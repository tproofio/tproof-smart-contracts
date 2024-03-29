// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";
import "./tProofGeneralLibrary.sol";
import "./interfaces/ItProofNFTTokenUriGeneratorInterface.sol";

// tProof.io is a tool for Decentralized Proof of Timestamp, that anyone can use
// to prove digital content existed prior to a certain point in time.
// Solution is designed to work 100% on-chain, and to not rely on a central entity.
// Each proof is created in the form of an NFT.
//
// See https://tproof.io


// NFT factory to manage the NFT generation
contract tProofNFTFactory is ERC721, AccessControl, Ownable, Pausable {

    using Strings for uint256;

    // struct
    /**
     * @notice Container for the core values of the NFT
     * @member hash the hash connected with the NFT
     * @member title optional title of the NFT (can be empty)
     */
    struct tProofNFTData {
        bytes32 hash;
        uint256 creationTimestamp;
        string title;
    }

    //uint256
    uint256 constant MAX_SUPPLY = 10 ** 50 - 1;
    uint256 immutable DEPLOYMENT_ID;
    uint256 public totalSupply = 0;

    // mapping
    /// @dev stores the core data of each NFT
    mapping (uint => tProofNFTData) public data;
    /// @dev description for the json. Stores in a separate part as this is highly optional
    mapping (uint => string) public description;

    // bytes
    /// @dev can call the mint function
    bytes32 public constant MINT_ROLE = keccak256("MINT_ROLE");

    // contract
    ItProofNFTTokenUriGeneratorInterface tokenUriGeneratorContract;

    // events
    event ProofMinted(uint indexed nft, bytes32 indexed hash, uint timestamp);
    event TitleEdited(uint indexed nft, string newTitle);
    event DescriptionEdited(uint indexed nft, string newDescription);
    event TokenUriGeneratorAddressChanged(address _newAddress);


    constructor(uint256 _deploymentId) ERC721("tProof Certifications", "TPROOF") {
        DEPLOYMENT_ID = _deploymentId;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
    * @notice Mint one or more NFTs
    * @param _to address that will own the NFT after the mint
    * @param _hash list fo file hash associated with NFT
    * @param _title Title of the NFT (optional). If missing, a short version of the has will be shown
    **/
    function mint(address _to, bytes32[] calldata _hash, string[] calldata _title)
                        external whenNotPaused() onlyRole(MINT_ROLE) {
        require((_hash.length == _title.length), "All arrays must have same length");

        for (uint i=0; i<_hash.length; ++i) {
            _safeMint(_to, normalizeNftNum( totalSupply + i ));
        }

        // stores hash and title information
        for(uint i = 0; i < _hash.length; ++i) {
            uint normalizedNftNum = normalizeNftNum( totalSupply + i );
            data[normalizedNftNum].hash = _hash[i];
            data[normalizedNftNum].creationTimestamp = uint256(block.timestamp);
            if (!tProofGeneralLibrary.isStringEmpty(_title[i])) {
                data[normalizedNftNum].title = _title[i];
                emit TitleEdited(normalizedNftNum, _title[i]);
            }
            emit ProofMinted(normalizedNftNum, _hash[i], block.timestamp);
        }

        totalSupply = totalSupply + _hash.length;
    }

    /**
    * @notice Update the title of the NFT
    * @param _nftNum id of NFT to update
    * @param _title The new title (can also be empty)
    **/
    function updateTitle(uint[] calldata _nftNum, string[] calldata _title) external whenNotPaused() {
        require(_nftNum.length == _title.length, "Arrays must have same length");
        for (uint i = 0;  i < _nftNum.length; ++i) {
            require(ownerOf(_nftNum[i]) == msg.sender, "Only owner can change title");
            data[ _nftNum[i] ].title = _title[i];
            emit TitleEdited(_nftNum[i], _title[i]);
        }
    }

    /**
    * @notice Needs to have just one supportInterface function
    * @param _interfaceId id of the interface
    **/
    function supportsInterface(bytes4 _interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(_interfaceId);
    }

    /**
    * @notice Check the existence of a tokenId
    * @param _tokenId id of the NFT token
    **/
    function exists(uint256 _tokenId) public view returns (bool) {
        return _exists(_tokenId);
    }

    /**
    * @notice Set the optional description
    * @param _nftNum list of NFT to set description
    * @param _description List of description to associate
    **/
    function setDescription(uint[] calldata _nftNum, string[] calldata _description) external whenNotPaused() {
        require(_nftNum.length == _description.length, "Arrays must have same length");
        for (uint i = 0;  i < _nftNum.length; ++i) {
            require(ownerOf(_nftNum[i]) == msg.sender, "Only owner can change description");
            description[ _nftNum[i] ] = _description[i];
            emit DescriptionEdited(_nftNum[i], _description[i]);
        }
    }

    /**
     * @notice Returns the SVG and metadata for a token Id
     * @param _tokenId The tokenId to return the SVG and metadata for.
     * @return A string representing the TokenUI
     **/
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(address(tokenUriGeneratorContract) != address(0), "tokenUriGeneratorContract not initialized");
        return tokenUriGeneratorContract.getTokenUri(_tokenId);
    }

    /**
     * @notice Given an NftNum, returns the complete number with the Deployment Id (the TokenId)
     * @dev If a value above 10**50 is given, no checks are performed, supposing it's already valid
     * @param _nftNum The number of NFT
     * @return The correct Token ID for this DeploymentId
     **/
    function normalizeNftNum(uint256 _nftNum) public view returns(uint256) {
        if (_nftNum > MAX_SUPPLY) return _nftNum;
        else return ( (10**50 * DEPLOYMENT_ID) + _nftNum);
    }


    //
    //     ██████╗ ██╗    ██╗███╗   ██╗███████╗██████╗
    //    ██╔═══██╗██║    ██║████╗  ██║██╔════╝██╔══██╗
    //    ██║   ██║██║ █╗ ██║██╔██╗ ██║█████╗  ██████╔╝
    //    ██║   ██║██║███╗██║██║╚██╗██║██╔══╝  ██╔══██╗
    //    ╚██████╔╝╚███╔███╔╝██║ ╚████║███████╗██║  ██║
    //     ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝
    //

    /**
     * @notice Set the address of the contract hosting the logic to generate the tokenUri
     * @param _newAddress The new address of the contract
     */
    function setTokenUriGenerator(address _newAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        tokenUriGeneratorContract = ItProofNFTTokenUriGeneratorInterface(_newAddress);
        emit TokenUriGeneratorAddressChanged(_newAddress);
    }

    /**
    * @notice Get the address of the current instance of TokenUriGenerator initialized
    * @return The address of the tokenUriGeneratorContract
    **/
    function getTokenUriGeneratorAddress() public view returns(address) {
        return address(tokenUriGeneratorContract);
    }

    /**
     * @notice Pause the mint of new tokens
     */
    function pause () public onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused() {
        _pause();
    }

    /**
     * @notice Unpause the mint of new tokens
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) whenPaused() {
        _unpause();
    }


}
