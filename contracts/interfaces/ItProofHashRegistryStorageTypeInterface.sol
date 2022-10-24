// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ItProofHashRegistryStorageTypeInterface {

    /**
    * @notice saves the url identifier
    * @param _nft the nft number connected to the url
    * @param _url the string representing the url
    **/
    function storeUrl (uint _nft, string calldata _url) external;

    /**
    * @notice get the string representing the url
    * @param _nft the nft connected to the url
    * @param _version the version of the URL to return. Mandatory are 0 and 1: 0 for the essential value, 1 for the fullUrl version. Other values may be possible, see docs based on storageType
    * @return a string representing the url, in the format required
    **/
    function getUrlString (uint _nft, uint _version) external view returns (string memory);

}
