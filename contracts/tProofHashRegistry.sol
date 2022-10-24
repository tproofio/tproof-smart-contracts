// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./tProofNFTFactory.sol";
import "./interfaces/ItProofHashRegistryStorageTypeInterface.sol";
import "./interfaces/ItProofUrlVerifierRouterInterface.sol";

// tProof.io is a tool for Decentralized Proof of Timestamp, that anyone can use
// to prove a digital content existed prior to a certain point in time.
// Solution is designed to work 100% on-chain, and to not rely on a central entity.
// Each proof is created in the form of an NFT.
//
// See https://tproof.io


// Core contract for Hash to URL matching registration
contract tProofHashRegistry is AccessControl {

    // struct
    /**
     * @notice Container to store StorageType-independent hash values
     * @member verified true if the hash has been verified, false otherwise
     * @member certificationPendingValidUntil Until when the certification has been paid
     * @member storageType Type of storage associated with a hash
     * @member mimeType Number referencing to the MIMEType of the file. 0 for undefined.
     * @member verificationInProgress True if verifier has been call and a response is pending
     */
    struct HashGeneralDetails {
        bool verified;
        uint64 certificationPendingValidUntil;
        uint16 storageType;
        uint32 mimeType;
        bool verificationInProgress;
        bool verificationFailed;
        // still 15 bytes left of space
    }

    // mappings
    /// @dev stores the general details of each NFT File, mapping on the NFT number
    mapping (uint => HashGeneralDetails) public hashGeneralDetails;
    /// @dev list of who can call the start certification process on behalf of the NFT owner
    mapping (uint => address) public delegatedStartCertification;
    /// @dev give a name to each storage type, for better indexing
    mapping (uint16 => string) public storageTypeName;

    // array
    /// @dev A pointer to the contract that knows how to handle the URL of a given file, based on its StorageType
    ItProofHashRegistryStorageTypeInterface[] storageTypeManagers;
    /// @dev list of allowed mime types. First element is the undefined mime Type (not specified)
    string[] public mimeTypes;

    // address
    ItProofUrlVerifierRouterInterface urlVerifierRouterContract;
    tProofNFTFactory NFTFactory;

    // bytes
    /// @dev responsible to call the function related to certification (startCertification - delegateStartCertificationCall - markHashVerificationPrepaid
    bytes32 public constant CERTIFICATION_MANAGER_ROLE = keccak256("CERTIFICATION_MANAGER_ROLE");
    bytes32 public constant URL_VERIFIER_ROUTER_ROLE = keccak256("URL_VERIFIER_ROUTER_ROLE");

    event CertificationStarted(uint indexed nft, uint16 indexed storageType, string url);
    event CertificationComplete(uint indexed nft, bytes32 hash);
    event CertificationFailed(uint indexed nft, bytes32 hash, bytes32 hashEval);
    event ExtendedVerification(uint indexed nft, uint until);
    event DelegateStartCertification(address indexed from, uint indexed nft, address indexed delegateTo);
    event StorageType(string name, address contractManager);
    event StorageTypeDisabled(string name);
    event MIMEType(string name);
    event UrlVerifierRouterChanged(address _newAddress);


    constructor(address NFTFactoryAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        mimeTypes.push("-");
        NFTFactory = tProofNFTFactory(NFTFactoryAddress);
    }

    /**
    * @notice initiate the certification process
    * @param _nft list of nft to certify
    * @param _url list of urls connected to hash (See docs on how to pass them), based on storageType
    * @param _storageType list of storageTypes associated with file urls
    * @param _mimeType optional mime type for the given file. 0 to set undefined
    **/
    function startCertification(uint[] calldata _nft, string[] calldata _url,
                                    uint16[] calldata _storageType, uint32[] calldata _mimeType, address caller)
    external
    onlyRole(CERTIFICATION_MANAGER_ROLE) {
        require(_nft.length == _url.length, "nfts and urls != len");
        require(_url.length == _storageType.length, "url and storageType != len");
        require(_storageType.length == _mimeType.length, "storageType and mimeType != len");

        for (uint i=0; i< _nft.length; ++i) {
            // check that the caller is either the owner, or the allowed third party
            if (NFTFactory.ownerOf(_nft[i]) != caller) {  // TODO instead of caller, why not put the sign of the delegator? Check also Gas Usage
                require(delegatedStartCertification[_nft[i]] == caller, "Not allowed to start cert.");
            }
            HashGeneralDetails memory hgd = hashGeneralDetails[_nft[i]];
            require(hgd.certificationPendingValidUntil >= block.timestamp, "Has verification not paid");
            require(hgd.storageType == _storageType[i], "Different StorageType paid");
            require(_mimeType[i] < mimeTypes.length, "Unknown mimeType passed");
            require(hgd.verified == false, "Already verified");
            require(hgd.verificationInProgress == false, "Verification already called");

            HashGeneralDetails storage hgd_store = hashGeneralDetails[_nft[i]];

            // set the file mimetype
            if (_mimeType[i] > 0)
                hgd_store.mimeType = _mimeType[i];

            hgd_store.verificationInProgress = true;
            storageTypeManagers[_storageType[i]].storeUrl(_nft[i], _url[i]);
            emit CertificationStarted(_nft[i], _storageType[i], _url[i]);
        }
        urlVerifierRouterContract.requestFileHashFromUrl(_nft, _url, _storageType);
    }

    /**
    * @notice completes the call to store the verified hash
    * @param _nft list of nft with certification response
    * @param _hashEvalFromUrl computed hashes obtained from urls passed to verifier
    **/
    function fulfillCertification(uint[] calldata _nft, bytes32[] calldata _hashEvalFromUrl) external onlyRole(URL_VERIFIER_ROUTER_ROLE) {
        for (uint i=0; i<_nft.length; ++i) {
            (bytes32 hash, , ) = NFTFactory.data(_nft[i]);
            HashGeneralDetails storage hgd_store = hashGeneralDetails[_nft[i]];
            if ( hash == _hashEvalFromUrl[i] ) {
                hgd_store.verified = true;
                emit CertificationComplete(_nft[i], hash);
            } else {
                hgd_store.certificationPendingValidUntil = uint64(block.timestamp - 1);
                hgd_store.verificationFailed = true;
                emit CertificationFailed(_nft[i], hash, _hashEvalFromUrl[i]);
            }
            hgd_store.verificationInProgress = false;
        }
    }

    /**
    * @notice returns the url connected to a given hash
    * @param _nft the nft to get the url stored
    * @param _version the version of the URL to return. See docs based on storageType for the given file. 0 for the essential storage data, 1 for the fullUrl version. Other values may be possible
    * @return a string representing the url, in the format required
    **/
    function getUrlFromNFT(uint _nft, uint _version) public view returns(string memory) {
        if (!hashGeneralDetails[_nft].verified) return "";
        else return storageTypeManagers[ hashGeneralDetails[_nft].storageType ].getUrlString(_nft, _version);
    }

    /**
    * @notice marks an hash as pre-paid, setting a time validity to allow the verification call to be made
    * @param _nft the nft id to add the pre-paid flag
    * @param _storageType the type of storage that will be used to store the file
    * @param _until timestamp until when the payment is valid
    **/
    function markHashVerificationPrepaid (uint _nft, uint16 _storageType, uint64 _until)
                                            external onlyRole(CERTIFICATION_MANAGER_ROLE) {
        require(_storageType < storageTypeManagers.length, "Invalid storage Type given");
        HashGeneralDetails storage hgd_store = hashGeneralDetails[_nft];
        hgd_store.certificationPendingValidUntil = _until;
        hgd_store.verified = false;
        hgd_store.verificationInProgress = false;
        hgd_store.storageType = _storageType;
        hgd_store.verificationFailed = false;
        emit ExtendedVerification(_nft, _until);
    }

    /**
    * @notice Allows the call to start the certification, once file is upload, to up to another address.
    * @dev This feature allows tProof to be integrated into your processes, reducing the number of calls the end user has to make
    * @param _nft the nft to delegate the certification call
    * @param _delegateTo the delegated address
    * @param _from who requested the delegation
    **/
    function delegateStartCertificationCall (uint _nft, address _delegateTo, address _from) public {
        require(NFTFactory.ownerOf(_nft) == msg.sender || hasRole(CERTIFICATION_MANAGER_ROLE, msg.sender), "Not the owner");
        if (NFTFactory.ownerOf(_nft) == msg.sender)
            require(msg.sender == _from, "Mismatched _from param");
        delegatedStartCertification[_nft] = _delegateTo;
        emit DelegateStartCertification(_from, _nft, _delegateTo);
    }

    //
    //     █████╗ ██████╗ ███╗   ███╗██╗███╗   ██╗    ███████╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗
    //    ██╔══██╗██╔══██╗████╗ ████║██║████╗  ██║    ██╔════╝██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║
    //    ███████║██║  ██║██╔████╔██║██║██╔██╗ ██║    ███████╗█████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║
    //    ██╔══██║██║  ██║██║╚██╔╝██║██║██║╚██╗██║    ╚════██║██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║
    //    ██║  ██║██████╔╝██║ ╚═╝ ██║██║██║ ╚████║    ███████║███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║
    //    ╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝    ╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
    //

    /**
    * @notice Add a new type of storage, pointing to the contract managing it
    * @dev The new position will be the ID for that given storage
    * @param _contractAddress address of the contract implementing the ItProofHashRegistryStorageTypeInterface
    * @param _name a name to connect to this storage type, for better indexing
    **/
    function addStorageTypeManager(address _contractAddress, string calldata _name) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(storageTypeManagers.length < (2**16), "Max number of storage types reached");
        storageTypeManagers.push(ItProofHashRegistryStorageTypeInterface(_contractAddress));
        storageTypeName[uint16(storageTypeManagers.length - 1)] = _name;
        emit StorageType(_name, _contractAddress);
    }

    /**
    * @notice Removes a StorageType from the list
    * @dev WARNING! This is an emergency call and will make all the files with that stroga type unaccessible (needs to be re-verified)
    * @param _position position (ID) of the storage type to disable
    **/
    function disableOneStorageTypeManager (uint16 _position) external onlyRole(DEFAULT_ADMIN_ROLE) {
        storageTypeManagers[uint256(_position)] = ItProofHashRegistryStorageTypeInterface(0x0000000000000000000000000000000000000000);
        emit StorageTypeDisabled(storageTypeName[_position]);
    }

    /**
    * @notice Adds a new MimeType to the allowed list
    * @param _mimeTypes array with the MIME types to add
    **/
    function addMimeType (string[] calldata _mimeTypes) public onlyRole(DEFAULT_ADMIN_ROLE) {
        for(uint i=0; i<_mimeTypes.length; ++i) {
            mimeTypes.push(_mimeTypes[i]);
            emit MIMEType(_mimeTypes[i]);
        }
    }

    /**
    * @notice Stores the reference to the urlVerifierRouter
    * @param _newAddress the address of the urlVerifierRouter
    **/
    function setUrlVerifierRouter (address _newAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        urlVerifierRouterContract = ItProofUrlVerifierRouterInterface(_newAddress);
        emit UrlVerifierRouterChanged(_newAddress);
    }

}
