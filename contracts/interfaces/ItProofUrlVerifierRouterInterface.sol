// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ItProofUrlVerifierRouterInterface {

    /**
      * @notice Prepares the call for Chainlink Oracle, sending the list of NFT IDs with the connecting URLs (and storage type)
      * @param _nftList list of NFTs IDs
      * @param _urlList list of URLs
      * @param _storageType list of storage type. Currently supporting only Arweave, so not passed to oracle
      */
    function requestFileHashFromUrl (uint[] calldata _nftList, string[] calldata _urlList,
        uint16[] calldata _storageType) external;


}
