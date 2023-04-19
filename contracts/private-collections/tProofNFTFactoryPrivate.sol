// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";
import "../tProofGeneralLibrary.sol";
import "../interfaces/ItProofNFTTokenUriGeneratorInterface.sol";

// tProof.io is a tool for Decentralized Proof of Timestamp, that anyone can use
// to prove digital content existed prior to a certain point in time.
// Solution is designed to work 100% on-chain, and to not rely on a central entity.
// Each proof is created in the form of an NFT.
//
// See https://tproof.io


// NFT factory to manage the NFT generation
contract tProofNFTFactoryPrivate is ERC721, AccessControl, Ownable, Pausable {

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
    uint256 constant MAX_SUPPLY = 2 ** 256 - 1;
    uint256 public totalSupply = 0;
    uint256 public prepaidMints = 0;

    // mapping
    /// @dev stores the core data of each NFT
    mapping (uint => tProofNFTData) public data;
    /// @dev description for the json. Stores in a separate part as this is highly optional
    mapping (uint => string) public description;

    // bytes
    /// @dev can call the mint function
    bytes32 public constant MINT_ROLE = keccak256("MINT_ROLE");
    /// @dev can call the mint function
    bytes32 public constant NFT_COLLECTION_OWNER_ROLE = keccak256("NFT_COLLECTION_OWNER_ROLE");

    // contract
    ItProofNFTTokenUriGeneratorInterface tokenUriGeneratorContract;

    // events
    event ProofMinted(uint indexed nft, bytes32 indexed hash, uint timestamp);
    event TitleEdited(uint indexed nft, string newTitle);
    event DescriptionEdited(uint indexed nft, string newDescription);
    event TokenUriGeneratorAddressChanged(address _newAddress);


    constructor(string memory certName, string memory certSymbol)
                ERC721(string.concat(certName, " | tProof"), string.concat("t", certSymbol)) {
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
        require(prepaidMints >= _hash.length, "Not enough prepaid mints");

        for (uint i=0; i<_hash.length; ++i) {
            _safeMint(_to, ( totalSupply + i ));
        }

        // stores hash and title information
        for(uint i = 0; i < _hash.length; ++i) {
            uint nftNum = ( totalSupply + i );
            data[nftNum].hash = _hash[i];
            data[nftNum].creationTimestamp = uint256(block.timestamp);
            if (!tProofGeneralLibrary.isStringEmpty(_title[i])) {
                data[nftNum].title = _title[i];
                emit TitleEdited(nftNum, _title[i]);
            }
            emit ProofMinted(nftNum, _hash[i], block.timestamp);
        }

        totalSupply = totalSupply + _hash.length;
        prepaidMints = prepaidMints - _hash.length;
    }

    /**
    * @notice Update the title of the NFT
    * @param _nftNum id of NFT to update
    * @param _title The new title (can also be empty)
    **/
    function updateTitle(uint[] calldata _nftNum, string[] calldata _title) external whenNotPaused() {
        require(_nftNum.length == _title.length, "Arrays must have same length");
        require(hasRole(NFT_COLLECTION_OWNER_ROLE, msg.sender), "Only NFT_COLLECTION_OWNER_ROLE can change title");
        for (uint i = 0;  i < _nftNum.length; ++i) {
            require(exists(_nftNum[i]), "NFT must exists");
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
        require(hasRole(NFT_COLLECTION_OWNER_ROLE, msg.sender), "Only NFT_COLLECTION_OWNER_ROLE can change description");
        for (uint i = 0;  i < _nftNum.length; ++i) {
            require(exists(_nftNum[i]), "NFT must exists");
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

    /**
     * @notice Updates the value of prepaid mints
     */
    function updatePrepaidMints(uint256 _newValue) public onlyRole(DEFAULT_ADMIN_ROLE) {
        prepaidMints = _newValue;
    }

}
