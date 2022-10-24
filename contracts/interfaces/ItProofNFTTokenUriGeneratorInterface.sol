// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ItProofNFTTokenUriGeneratorInterface {

    /**
    * @notice Generates the token URI
    * @param _tokenId the id of the NFT
    * @return a string representing the TokenUri
    **/
    function getTokenUri (uint256 _tokenId) external view returns (string memory);

}
