// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ItProofHashRegistryStorageTypeInterface.sol";


// tProof.io is a tool for Decentralized Proof of Timestamp, that anyone can use
// to prove digital content existed prior to a certain point in time.
// Solution is designed to work 100% on-chain, and to not rely on a central entity.
// Each proof is created in the form of an NFT.
//
// See https://tproof.io


// Managers Arweave V1 storage URLs
contract tProofHashRegistryStorageType_ArweaveV1 is Ownable, ItProofHashRegistryStorageTypeInterface {

    // struct
    /**
    * @notice represents the stored URL
    * @dev instead of storing a string, since we know Arweave identifiers are 43 chars, we optimized storage splitting their value in two bytes variables
    * @param url1 the first part of the Arweave TX id
    * @param url2 the remaining part of the Arweave TX id
    **/
    struct HashUrl {
        bytes32 url1;
        bytes11 url2;  // can be up to 32
    }

    // mappings
    /// @dev connects the URL to each NFT id
    mapping (uint => HashUrl) private nftUrl;

    // address
    address hashRegistryContract;

    constructor (address _hashRegistryAddress) {
        hashRegistryContract = _hashRegistryAddress;
    }

    /**
    * @notice saves the url identifier (Arweave 43 characters tx ID)
    * @param _nft the nft number connected to the url
    * @param _url the string representing the url
    **/
    function storeUrl (uint _nft, string calldata _url) external {
        require(msg.sender == hashRegistryContract, "Only hashRegistry can call");
        nftUrl[_nft].url1 = bytes32(bytes(_url)[0:32]);
        nftUrl[_nft].url2 = bytes11(bytes(_url)[32:43]);
    }

    /**
    * @notice get the string representing the url
    * @param _nft the nft connected to the url
    * @param _version the version of the URL to return. See docs based on storageType for the given file. Generally 0 for the essential storage data, 1 for the fullUrl version. Other values may be possible
    * @return a string representing the url, in the format required
    **/
    function getUrlString (uint _nft, uint _version) external view returns (string memory) {
        require(_version < 2, "Unsupported version value");
        bytes memory bytesUrl = bytes.concat(nftUrl[_nft].url1, nftUrl[_nft].url2);
        string memory arweaveTxId = string(bytesUrl);
        if (_version == 0) {
            // return the stored Arweave hash
            return arweaveTxId;
        } else {
            // return the full url version
            return string.concat("https://arweave.net/", arweaveTxId);
        }
    }

    /**
    * @notice set the hash registry contract in the emergency case we'll need to change it
    * @param _newAddress the new address
    **/
    function setHashRegistryContract(address _newAddress) public onlyOwner {
        hashRegistryContract = _newAddress;
    }

}
