// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./tProofNFTFactory.sol";
import "./tProofHashRegistry.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// tProof.io is a tool for Decentralized Proof of Timestamp, that anyone can use
// to prove digital content existed prior to a certain point in time.
// Solution is designed to work 100% on-chain, and to not rely on a central entity.
// Each proof is created in the form of an NFT.
//
// See https://tproof.io


// Core entrance for the usage of tProof.io solution
contract tProofRouter is AccessControl, Pausable {

    // contract
    tProofNFTFactory NFTFactoryContract;
    tProofHashRegistry HashRegistryContract;

    // uint256
    /// @dev mint price to register a hash (excluding optional file verification)
    uint public MINT_PRICE;
    /// @dev ether price to verify a file
    uint public VERIFICATION_PRICE;
    /// @dev Number of seconds representing the validity of a pre-paid verification. After that period, amount is lost and verification needs to be re-paid
    uint public VALIDITY_FOR_HASH_VERIFICATION;

    // bytes
    bytes32 public constant WITHDRAW_ROLE = keccak256("WITHDRAW_ROLE");

    // boolean
    /// @dev True if the public file URL verification is open, false otherwise
    bool public enableFileUrlVerification = false;

    /**
      * @param _initialMintPrice initial value for MINT_PRICE
      * @param _initialVerificationPrice initial value for VERIFICATION_PRICE
      * @param _validityForHashVerification initial value for VALIDITY_FOR_HASH_VERIFICATION
      * @param _nftContractAddress address of NFTFactory contract
      * @param _hashRegistryAddress address of HashRegistry contract
      */
    constructor(uint _initialMintPrice, uint _initialVerificationPrice, uint _validityForHashVerification,
                    address _nftContractAddress, address _hashRegistryAddress) {
        MINT_PRICE = _initialMintPrice;
        VERIFICATION_PRICE = _initialVerificationPrice;
        VALIDITY_FOR_HASH_VERIFICATION = _validityForHashVerification;
        NFTFactoryContract = tProofNFTFactory(_nftContractAddress);
        HashRegistryContract = tProofHashRegistry(_hashRegistryAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
      * @notice Generates the tProof for one (or more) given hashes. Each tProof will be in the form of an NFT
      * @dev All the arrays must have same length and same order. All elements in pos-0 must refer to same hash, etc
      * @param _to Who will receive the NFT(s)
      * @param _hash list of hashes to verify
      * @param _title list of titles for NFTs. If empty, a shorter version of the hash is picked
      * @param _withFileURL true if a public file upload will follow, false otherwise. Determines the total cost of call
      * @param _storageType id of the storage used to store the file. See docs for list. If _withFileUrl is false, this param is ignored (Set it ot 0)
      * @param _delegateTo If we want to delegate another address to call for the verifyHashFileUrl call. Useful for better UX. Set to 0x for empty
      */
    function createProofs(bytes32[] calldata _hash, string[] calldata _title,
                            bool[] calldata _withFileURL, uint16[] calldata _storageType, address _to, address _delegateTo)
    external payable whenNotPaused() {
        // same-length between _title and _hash is checked in mint process
        require(_title.length == _withFileURL.length, "Array must have same length");
        require(_withFileURL.length == _storageType.length, "Array must have same length");

        // eval total cost
        uint numHashFilesWithVerification = 0;
        for (uint i = 0; i < _hash.length; ++i) {
            if (_withFileURL[i]) ++numHashFilesWithVerification;
        }
        uint amount = (_hash.length * MINT_PRICE) + (numHashFilesWithVerification * VERIFICATION_PRICE);
        require(msg.value >= amount, "Not enough ETH send for minting");
        uint totalSupplyNft = NFTFactoryContract.totalSupply();
        NFTFactoryContract.mint(_to, _hash, _title);

        // announce we'll certify a certain amount of hashes (already paid)
        if (numHashFilesWithVerification > 0) {
            for (uint i = 0; i < _hash.length; ++i) {
                if (_withFileURL[i]) {
                    require(enableFileUrlVerification, "File Url Verification disabled");
                    HashRegistryContract.markHashVerificationPrepaid(
                        NFTFactoryContract.normalizeNftNum(totalSupplyNft), _storageType[i], _evalPaidVerificationExpiration()
                    );
                    if (_delegateTo != 0x0000000000000000000000000000000000000000)
                        HashRegistryContract.delegateStartCertificationCall(
                            NFTFactoryContract.normalizeNftNum(totalSupplyNft), _delegateTo, _to
                        );
                }
                ++totalSupplyNft;
            }
        }
    }

    /**
      * @notice Allows NFT owner to edit the title of a given NFT
      * @dev You can pass an array of NFTs, with corresponding titles, to change more titles at the same time
      * @param _nftNum IDs on NFTs to operate on
      * @param _title list of titles to assign to NFTs
      */
    function editProofTitle (uint[] calldata _nftNum, string[] calldata _title) external whenNotPaused() {
        NFTFactoryContract.updateTitle(_nftNum, _title);
    }

    /**
      * @notice Uploads an URL and triggers the verification of hash connected to the given file
      * @param _nft List of nft
      * @param _url list of URLs to verify. See docs to understand the format of it, based on _storageType
      * @param _storageType The type of storage for each given URL. Needed to verify they match the paid one
      * @param _mimeType optional mime type for the given file. 0 to set undefined
      */
    function verifyHashFileUrl(uint[] calldata _nft, string[] calldata _url,
                                    uint16[] calldata _storageType, uint32[] calldata _mimeType) external whenNotPaused() {
        require(enableFileUrlVerification, "File Url Verification disabled");
        // start the certification
        HashRegistryContract.startCertification(_nft, _url, _storageType, _mimeType, msg.sender);
    }

    /**
      * @notice Extend the verification period for an hash. Can be used also to verify an hash after a simple mint.
                   If NFT is verified, this function sets it to not verified, thus the verification must re-run again.
      * @param _nft List of nft
      * @param _storageType The type of storage for each given NFT where it's plan to upload the file
      */
    function extendVerification(uint[] calldata _nft, uint16[] calldata _storageType) external payable whenNotPaused() {
        require(enableFileUrlVerification, "File Url Verification disabled");
        require(msg.value >= (_nft.length * VERIFICATION_PRICE), "Not enough ETH sent");
        for (uint i=0; i<_nft.length; ++i) {
            ( , uint64 certificationPendingValidUntil, , , , ) = HashRegistryContract.hashGeneralDetails(_nft[i]);
            if (certificationPendingValidUntil < block.timestamp) {
                HashRegistryContract.markHashVerificationPrepaid(
                    _nft[i],
                    _storageType[i],
                    _evalPaidVerificationExpiration()
                );
            } else {
                HashRegistryContract.markHashVerificationPrepaid(
                    _nft[i],
                    _storageType[i],
                    certificationPendingValidUntil + uint64(VALIDITY_FOR_HASH_VERIFICATION)
                );
            }
        }
    }

    /**
      * @notice Evaluates until when an hash just paid has its verification paid
      * @return timestamp in seconds (uint64) until when a hash can be verified with the currently paid fee
      */
    function _evalPaidVerificationExpiration() private view returns(uint64) {
        return uint64(block.timestamp + VALIDITY_FOR_HASH_VERIFICATION);
    }

    /**
     * @notice Get the address of the current instance of NFT Factory initialized
     * @return The address of the NFTFactoryContract
    **/
    function getNFTFactoryContractAddress() external view returns(address) {
        return address(NFTFactoryContract);
    }

    /**
     * @notice Get the address of the current instance of Hash Registry initialized
     * @return The address of the HashRegistryContract
    **/
    function getHashRegistryContractAddress() external view returns(address) {
        return address(HashRegistryContract);
    }

    /**
      * @notice Collect the ETH in this contract
      */
    function withdraw() public onlyRole(WITHDRAW_ROLE) whenNotPaused() {
        address payable to = payable(msg.sender);
        to.transfer(address(this).balance);
    }

    /**
      * @notice To handle possible direct payments to contract
      */
    receive() external payable {}

    /**
     * @notice Pause the functions of this router
     */
    function pause () public onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused() {
        _pause();
    }

    /**
     * @notice Unpause the functions of this router
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) whenPaused() {
        _unpause();
    }

    /**
     * @notice Activates / deactivates the URL Verification process
     */
    function toggleUrlVerificationService() public onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused() {
        enableFileUrlVerification = !enableFileUrlVerification;
    }

    /**
     * @notice Sets a new mint price (in ETH)
     * @param _newMintPrice - the new mint price to set
     */
    function setMintPrice(uint _newMintPrice) public onlyRole(DEFAULT_ADMIN_ROLE) {
        MINT_PRICE = _newMintPrice;
    }

    /**
     * @notice Sets a new verification price (in ETH)
     * @param _newVerificationPrice - the new mint price to set
     */
    function setVerificationPrice(uint _newVerificationPrice) public onlyRole(DEFAULT_ADMIN_ROLE) {
        VERIFICATION_PRICE = _newVerificationPrice;
    }

    /**
     * @notice Sets a new value of seconds to keep valid the hash verification request
     * @param _newValidityForHashVerification - the new amount of time, in seconds
     */
    function setValidityForHashVerification(uint _newValidityForHashVerification) public onlyRole(DEFAULT_ADMIN_ROLE) {
        VALIDITY_FOR_HASH_VERIFICATION = _newValidityForHashVerification;
    }
}
