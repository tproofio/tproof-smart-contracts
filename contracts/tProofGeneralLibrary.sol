// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// tProof.io is a tool for Decentralized Proof of Timestamp, that anyone can use
// to prove digital content existed prior to a certain point in time.
// Solution is designed to work 100% on-chain, and to not rely on a central entity.
// Each proof is created in the form of an NFT.
//
// See https://tproof.io

// Generic used functions among our contracts
library tProofGeneralLibrary {

    /**
    * @notice Returns the substring of a given string
    * @param _str the string to substring
    * @param _startIndex the start of the substring
    * @param _endIndex the end of the substring
    * @return the extracted part of the substring
    **/
    function substring( string memory _str, uint256 _startIndex, uint256 _endIndex ) internal pure
                returns (string memory) {
        bytes memory strBytes = bytes(_str);
        bytes memory result = new bytes(_endIndex - _startIndex);
        for (uint256 i = _startIndex; i < _endIndex; ++i) {
            result[i - _startIndex] = strBytes[i];
        }
        return string(result);
    }

    /**
    * @notice Checks if a string is empty
    * @param _test the string to test
    * @return true if it's empty (""), false otherwsie
    **/
    function isStringEmpty (string memory _test) internal pure returns(bool) {
        bytes memory emptyStringTest = bytes(_test);
        return emptyStringTest.length == 0;
    }

    /**
    * @notice Returns a string representation of true / false
    * @param _value the boolean value
    * @return "true" (string) or "false" (string)
    **/
    function boolToString (bool _value) internal pure returns(string memory) {
        return _value ? "true" : "false";
    }


}
