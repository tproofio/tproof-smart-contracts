// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// tProof.io is a tool for Decentralized Proof of Timestamp, that anyone can use
// to prove digital content existed prior to a certain point in time.
// Solution is designed to work 100% on-chain, and to not rely on a central entity.
// Each proof is created in the form of an NFT.
//
// See https://tproof.io


// Stores the aliases connected to private collections
contract tProofPrivateCollectionAlias is Ownable, AccessControl, Pausable {

    // mapping
    /// @dev stores the match between alias and collection address
    mapping (string => address) public aliasToAddress;
    /// @dev stores the match between address and alias
    mapping (address => string) public addressToAlias;

    // bytes
    /// @dev can manage aliases automatically
    bytes32 public constant ALIAS_EDITOR_ROLE = keccak256("ALIAS_EDITOR_ROLE");

    // events
    /// @dev This event is emitted when a new alias is generated for a collection.
    event AliasGenerated(string indexed _alias, address indexed _collectionAddress);
    /// @dev This event is emitted when the alias for a collection is updated.
    event AliasUpdated(address indexed _collection, string indexed _oldAlias, string indexed _newAlias);
    /// @dev This event is emitted when an alias is removed from a collection.
    event AliasRemoved(string indexed _alias, address indexed _collectionAddress);


    /**
    * @dev Adds an alias to the list of aliases
    * @notice Adds an alias to the list of aliases
    * @param _alias new alias to add
    * @param _collectionAddress the address of the collection matching the alias
    * @return None
    **/
    function addAlias(string memory _alias, address _collectionAddress)
    external whenNotPaused() onlyRole(ALIAS_EDITOR_ROLE) {
        require(addressToAlias[_collectionAddress] == "", "Collection has already an alias");
        return(aliasToAddress[_alias] == address(0), "Alias already associated");

        aliasToAddress[_alias] = _collectionAddress;
        addressToAlias[_collectionAddress] = _alias;

        emit AliasGenerated(_alias, _collectionAddress);
    }

    /**
    * @dev Update the alias for a collection
    * @notice Update the alias for a collection
    * @param _collection address of the collection
    * @param _newAlias The new alias for the collection
    * @return None
    **/
    function updateAlias(address _collection, string memory _newAlias) external whenNotPaused() onlyRole(ALIAS_EDITOR_ROLE) {
        require(addressToAlias[_collection] != "", "Alias must assigned before editing it");
        require(aliasToAddress[_newAlias] == "", "Alias already taken");
        string memory currentAlias = addressToAlias[_collection];

        aliasToAddress[_newAlias] = _collection;
        addressToAlias[_collection] = _newAlias;
        aliasToAddress[currentAlias] = address(0);

        emit AliasUpdated(_collection, currentAlias, _newAlias);
    }

    /**
    * @dev Removes an alias from the list of aliases
    * @notice Removes an alias from the list of aliases
    * @param _alias The alias to remove
    * @return None
    **/
    function removeAlias(string memory _alias) external whenNotPaused() onlyRole(ALIAS_EDITOR_ROLE) {
        address collectionAddress = aliasToAddress[_alias];
        require(collectionAddress != address(0), "Alias not found");

        delete aliasToAddress[_alias];
        delete addressToAlias[collectionAddress];

        emit AliasRemoved(_alias, collectionAddress);
    }

    /**
     * @notice Pause the generation of aliases
     * @return None
     */
    function pause () public onlyOwner whenNotPaused() {
        _pause();
    }

    /**
     * @notice Unpause the generation of aliases
     * @return None
     */
    function unpause() public onlyOwner whenPaused() {
        _unpause();
    }


}
