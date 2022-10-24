// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./tProofNFTFactory.sol";
import "./tProofHashRegistry.sol";
import "./tProofGeneralLibrary.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

// tProof.io is a tool for Decentralized Proof of Timestamp, that anyone can use
// to prove a digital content existed prior to a certain point in time.
// Solution is designed to work 100% on-chain, and to not rely on a central entity.
// Each proof is created in the form of an NFT.
//
// See https://tproof.io


// Generates the TokenUri on its own, making it easy to update the logic of NFT representation
contract tProofNFTTokenUriGenerator {

    tProofNFTFactory nftContract;
    tProofHashRegistry hashRegistry;

    constructor(address NFTContractAddress, address hashRegistryContractAddress) {
        nftContract = tProofNFTFactory(NFTContractAddress);
        hashRegistry = tProofHashRegistry(hashRegistryContractAddress);
    }

    /**
    * @notice Generates the token URI
    * @param _tokenId the id of the NFT
    * @return a string representing the TokenUri
    **/
    function getTokenUri(uint256 _tokenId) external view returns (string memory) {
        require(nftContract.exists(_tokenId), 'URI query for nonexistent token');

        (bytes32 hash, uint256 creationTimestamp, string memory title) = nftContract.data(_tokenId);
        string memory hashStr = Strings.toHexString(uint256(hash));
        if (tProofGeneralLibrary.isStringEmpty(title)) {
            string memory startHash = tProofGeneralLibrary.substring(hashStr, 2, 8);
            string memory endHash = tProofGeneralLibrary.substring(hashStr, 60, 66);
            title = string.concat("0x", startHash, "...", endHash);
        }

        string memory description = getDescription(_tokenId, hashStr, creationTimestamp);

        return
        string.concat(
            "data:application/json;base64,",
            Base64.encode(
                bytes(
                    string.concat(
                        '{"name": "', title, '",',
                        ' "description": "',description,'",',
                        ' "image": "https://arweave.net/eesdQDYYNUAKOtKE6YATmeNUEEBfeDJeI9dwOduf4CI",',
                        ' "attributes":', tokenIdToAttributes(_tokenId, hashStr, creationTimestamp), ",",
                        ' "external_url": "', hashRegistry.getUrlFromNFT(_tokenId, 1), '"',
                        "}"
                    )
                )
            )
        );
    }

    /**
     * @notice Generates the attributes of the file
     * @param _tokenId Id of the NFT
     * @param _hash string representation of the hash
     * @return the string array containing the token id attributes
     */
    function tokenIdToAttributes(uint _tokenId, string memory _hash, uint _creationTimestamp) internal view returns (string memory)
    {
        string memory attributesString;
        (bool verified, uint64 certificationPendingValidUntil, uint16 storageType,
            uint32 mimeType, bool verificationInProgress, bool verificationFailed) = hashRegistry.hashGeneralDetails(_tokenId);

        string memory storageTypeStr = hashRegistry.storageTypeName(storageType);
        string memory MIMETypeStr = hashRegistry.mimeTypes(mimeType);
        uint tID = _tokenId;  // due to stack too deep error

        // define if the verification is valid or not
        string memory verifiedStr = verified ?
                                    "True"
                                    :
                                    (verificationInProgress || (!verificationInProgress && certificationPendingValidUntil > block.timestamp)) ?
                                    "Pending" : "False";

        attributesString = string.concat(
            '[',
                '{"trait_type":"Hash","value":"',_hash,'"},',
                '{"trait_type":"Created At","value":"',Strings.toString(_creationTimestamp),'"},',
                '{"trait_type":"Verified","value":"', verifiedStr ,'"},',
                '{"trait_type":"Storage Type","value":"',storageTypeStr,'"},',
                '{"trait_type":"MIME Type","value":"',MIMETypeStr,'"},',
                '{"trait_type":"Url","value":"',hashRegistry.getUrlFromNFT(tID, 1),'"},',
                '{"trait_type":"Verification Failed","value":"',tProofGeneralLibrary.boolToString(verificationFailed),'"}',
            ']'
        );

        return attributesString;
    }

    /**
     * @notice Generate the text description
     * @param _tokenId Id of the NFT
     * @param _hash string representation of the hash
     * @param _creationTimestamp creation timestamp
     * @return the string with the description of the Proof
     */
    function getDescription(uint _tokenId, string memory _hash, uint _creationTimestamp) internal view returns (string memory) {
        string memory descriptionText = nftContract.description(_tokenId);
        (bool verified, , , , , ) = hashRegistry.hashGeneralDetails(_tokenId);
        string memory tmpDescription =  string.concat(
            "**Hash:** ", _hash, "\\n\\n",
            "**Created at** (timestamp): ", Strings.toString(_creationTimestamp), "\\n\\n"
        );
        if (verified) {
            string memory url = hashRegistry.getUrlFromNFT(_tokenId, 1);
            tmpDescription = string.concat(tmpDescription, "**Public URL:** [", url, "](", url, ")\\n\\n");
        }
        if (bytes(descriptionText).length > 0) {
            tmpDescription = string.concat(tmpDescription, "\\n\\n");
            tmpDescription = string.concat(tmpDescription, descriptionText, "\\n\\n");
        }
        tmpDescription = string.concat(tmpDescription, "\\n");
        tmpDescription = string.concat(tmpDescription, "Made with [tProof.io](https://tproof.io)");
        return tmpDescription;
    }
}
