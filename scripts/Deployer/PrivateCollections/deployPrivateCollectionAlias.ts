import {ethers} from "hardhat";
import {TProofPrivateCollectionAlias} from "../../../typechain-types";
import {
  deployTProofPrivateCollectionAlias,
  privateCollectionAlias_setAliasEditorRole
} from "../SingleContracts/private-collections/PrivateCollectionAlias";

/**
 * Function to deploy the instance of PrivateCollectionAlias smart contract
 *
 * @param {boolean} [enableWaiting] - if true, the waiting between certain deployment calls are executed. This can be skipped to speed up tests on local hardhat node
 */
export const deploy = async (
  enableWaiting: boolean = false
): Promise<{
  tProofPrivateCollectionAlias: TProofPrivateCollectionAlias
}> => {

  // We get the contract to deploy
  const [owner] = await ethers.getSigners();

  // get the next nouce
  let next_nonce = await owner.getTransactionCount();

  // Deploy the smart contract
  const tProofPrivateCollectionAlias = await deployTProofPrivateCollectionAlias(owner, next_nonce);
  console.log("tProofPrivateCollectionAlias deployed - " + tProofPrivateCollectionAlias.address);

  // add the role
  await privateCollectionAlias_setAliasEditorRole(owner, tProofPrivateCollectionAlias.address, owner.address, ++next_nonce);
  console.log("Alias Editor Role assigned to " + owner.address);

  return { tProofPrivateCollectionAlias }
}

if (typeof require !== 'undefined' && require.main === module) {
  let chainId: "5" | "137" | "80001" | "1337" = "137";
  deploy(
    true
  )
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}



