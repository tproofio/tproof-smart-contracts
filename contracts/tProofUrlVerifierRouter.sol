// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import '@chainlink/contracts/src/v0.8/ChainlinkClient.sol';
import '@chainlink/contracts/src/v0.8/ConfirmedOwner.sol';
import './tProofHashRegistry.sol';
import "hardhat/console.sol";


// tProof.io is a tool for Decentralized Proof of Timestamp, that anyone can use
// to prove digital content existed prior to a certain point in time.
// Solution is designed to work 100% on-chain, and to not rely on a central entity.
// Each proof is created in the form of an NFT.
//
// See https://tproof.io


// Routes calls of Hash-URL pair certifications to ChainLink Node
contract tProofUrlVerifierRouter is ChainlinkClient, ConfirmedOwner, ItProofUrlVerifierRouterInterface {

    using Chainlink for Chainlink.Request;

    //// uint256
    uint256 public ORACLE_PAYMENT = 0 * LINK_DIVISIBILITY;

    /// bytes
    /// @dev jobID of Chainlink
    bytes32 private jobId;

    /// addresses
    tProofHashRegistry hashRegistryContract;

    /**
      * @param _hashRegistryContractAdd address of the Hash Registry contract
      * @param _jobId id of the job for ChainLink
      * @param _oracle address of the Oracle SC
      * @param _LINKAddress Address of the LINK token
      */
    constructor( address _hashRegistryContractAdd, string memory _jobId, address _oracle, address _LINKAddress) ConfirmedOwner(msg.sender) {
        setChainlinkToken(_LINKAddress);
        setChainlinkOracle(_oracle);
        jobId = _stringToBytes32(_jobId);
        hashRegistryContract = tProofHashRegistry(_hashRegistryContractAdd);
        ORACLE_PAYMENT = 0 * LINK_DIVISIBILITY;
    }

    /**
      * @notice Prepares the call for Chainlink Oracle, sending the list of NFT IDs with the connecting URLs (and storage type)
      * @param _nftList list of NFTs IDs
      * @param _urlList list of URLs
      * @param _storageType list of storage type. Currently supporting only Arweave, so not passed to oracle
      */
    function requestFileHashFromUrl (uint[] calldata _nftList, string[] calldata _urlList,
                                        uint16[] calldata _storageType) external {
        require(_nftList.length == _urlList.length, "arrays must have same length");
        require(msg.sender == address(hashRegistryContract), "Only hashRegistry can call");

        // store the list of NFTs as a byte sequence
        bytes memory nftListBytes;
        for (uint i=0; i<_nftList.length; ++i) {
            nftListBytes = bytes.concat(nftListBytes, abi.encodePacked(_nftList[i]));
        }

        // perform a request
        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillRequestHashFile.selector
        );
        req.addStringArray('urlList', _urlList);
        req.addBytes('nftList', nftListBytes);
        sendOperatorRequest(req, ORACLE_PAYMENT);
    }

    /**
      * @notice Callback from CL Node to fulfill the request
      * @param _requestId id of the request
      * @param _nftList list of NFTs passed
      * @param _evalHashList list of hash eval from given urls
      */
    function fulfillRequestHashFile(bytes32 _requestId, uint[] calldata _nftList, bytes32[] calldata _evalHashList)
    external
    recordChainlinkFulfillment(_requestId) {
        require(_nftList.length == _evalHashList.length, "Response has different size");
        hashRegistryContract.fulfillCertification(_nftList, _evalHashList);
    }

    /**
      * @notice Get the ChainLink token address
      * @return The address of LINK ERC-20
      */
    function getChainlinkToken() public view returns (address) {
        return chainlinkTokenAddress();
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
      * @notice Move extra LNK to the owner
      */
    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), 'Unable to transfer');
    }

    /**
      * @notice Blocks the request to the CL Oracle
      * @param _requestId id of the request
      * @param _payment the payment made
      * @param _callbackFunctionId id of the function to callback
      * @param _expiration until when
      */
    function cancelRequest(
        bytes32 _requestId,
        uint256 _payment,
        bytes4 _callbackFunctionId,
        uint256 _expiration
    ) public onlyOwner {
        cancelChainlinkRequest(_requestId, _payment, _callbackFunctionId, _expiration);
    }

    /**
      * @notice Updates the jobID, if we need to edit it
      * @param _jobId jobID to update
      */
    function setJobId (string calldata _jobId) external onlyOwner {
        jobId = _stringToBytes32(_jobId);
    }

    /**
      * @notice Sets the new payment to the oracle (in LINK)
      * @param _newLinkPayment LINK to be paid to the Oracle
    **/
    function setOralcePayment (uint _newLinkPayment) external onlyOwner {
        ORACLE_PAYMENT = _newLinkPayment;
    }


    //    ██████╗ ██████╗ ██╗██╗   ██╗ █████╗ ████████╗███████╗    ███████╗██╗   ██╗███╗   ██╗ ██████╗███████╗
    //    ██╔══██╗██╔══██╗██║██║   ██║██╔══██╗╚══██╔══╝██╔════╝    ██╔════╝██║   ██║████╗  ██║██╔════╝██╔════╝
    //    ██████╔╝██████╔╝██║██║   ██║███████║   ██║   █████╗      █████╗  ██║   ██║██╔██╗ ██║██║     ███████╗
    //    ██╔═══╝ ██╔══██╗██║╚██╗ ██╔╝██╔══██║   ██║   ██╔══╝      ██╔══╝  ██║   ██║██║╚██╗██║██║     ╚════██║
    //    ██║     ██║  ██║██║ ╚████╔╝ ██║  ██║   ██║   ███████╗    ██║     ╚██████╔╝██║ ╚████║╚██████╗███████║
    //    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚═╝      ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚══════╝

    /**
      * @notice Converts a string into bytes32
      * @param _source convert the jobID
      */
    function _stringToBytes32(string memory _source) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(_source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
        // solhint-disable-line no-inline-assembly
            result := mload(add(_source, 32))
        }
    }

}
