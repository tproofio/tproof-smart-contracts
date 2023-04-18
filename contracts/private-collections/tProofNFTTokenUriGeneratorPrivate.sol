// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./tProofNFTFactoryPrivate.sol";
import "../tProofGeneralLibrary.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

// tProof.io is a tool for Decentralized Proof of Timestamp, that anyone can use
// to prove digital content existed prior to a certain point in time.
// Solution is designed to work 100% on-chain, and to not rely on a central entity.
// Each proof is created in the form of an NFT.
//
// See https://tproof.io


// Generates the TokenUri on its own, making it easy to update the logic of NFT representation
contract tProofNFTTokenUriGeneratorPrivate {

    tProofNFTFactoryPrivate nftContract;

    constructor(address NFTContractAddress) {
        nftContract = tProofNFTFactoryPrivate(NFTContractAddress);
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
                        ' "attributes":', tokenIdToAttributes(_tokenId, hashStr, creationTimestamp),
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
        string memory attributesString = string.concat(
            '[',
                '{"trait_type":"Hash","value":"',_hash,'"},',
                '{"trait_type":"Created At","value":"',Strings.toString(_creationTimestamp),'"}',
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
        string memory tmpDescription =  string.concat(
            "**Hash:** ", _hash, "\\n\\n",
            "**Created at** (timestamp): ", Strings.toString(_creationTimestamp), "\\n\\n"
        );
        if (bytes(descriptionText).length > 0) {
            tmpDescription = string.concat(tmpDescription, "\\n\\n");
            tmpDescription = string.concat(tmpDescription, descriptionText, "\\n\\n");
        }
        tmpDescription = string.concat(tmpDescription, "\\n");
        tmpDescription = string.concat(tmpDescription, "Made with [tProof.io](https://tproof.io)");
        return tmpDescription;
    }
}
