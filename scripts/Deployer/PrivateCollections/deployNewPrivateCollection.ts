import {ethers} from "hardhat";
import {TProofNFTFactoryPrivate, TProofNFTTokenUriGeneratorPrivate} from "../../../typechain-types";
import {
  deployTProofNFTFactoryPrivate,
  NFTFactoryPrivate_setMintRole,
  NFTFactoryPrivate_setNFTCollectionOwnerRole,
  NFTFactoryPrivate_setTokenUriGenerator
} from "../SingleContracts/private-collections/NFTFactoryPrivate";
import {
  deployTProofNFTTokenUriGeneratorPrivate
} from "../SingleContracts/private-collections/NFTTokenUriGeneratorPrivate";
import {PRIVATE_DEPLOYMENT} from "../../ProjectConstants";


/**
 * Function to deploy all the contracts on a new chain. We've used a dedicate function, so that we can call it
 * also during testing
 *
 * @param certName - name of the NFT
 * @param certSymbol - symbol of the NFT
 * @param collectionMinters - array of wallet address that will get the minter role
 * @param collectionOwners - array of wallet address that will get the collection owner role
 * @param {boolean} [enableWaiting] - if true, the waiting between certain deployment calls are executed. This can be skipped to speed up tests on local hardhat node
 */
export const deploy = async (
  certName: string,
  certSymbol: string,
  collectionMinters: string[],
  collectionOwners: string[],
  enableWaiting: boolean = false
): Promise<{
  tProofNFTFactoryPrivate: TProofNFTFactoryPrivate,
  tProofNFTTokenUriGeneratorPrivate: TProofNFTTokenUriGeneratorPrivate
}> => {

  // We get the contract to deploy
  const [owner] = await ethers.getSigners();

  // get the next nouce
  let next_nonce = await owner.getTransactionCount();

  // Deploy the NFT collection
  const tProofNFTFactoryPrivate = await deployTProofNFTFactoryPrivate(owner, certName, certSymbol, next_nonce);
  console.log("tProofNFTFactoryPrivate deployed - " + tProofNFTFactoryPrivate.address);

  // Deploy the NFTTokenUriGenerator
  const tProofNFTTokenUriGeneratorPrivate = await deployTProofNFTTokenUriGeneratorPrivate(owner, tProofNFTFactoryPrivate.address, ++next_nonce);
  console.log("tProofNFTTokenUriGeneratorPrivate deployed - " + tProofNFTTokenUriGeneratorPrivate.address);

  // assign the minter role
  for (let r of collectionMinters) {
    await NFTFactoryPrivate_setMintRole(owner, tProofNFTFactoryPrivate.address, r, ++next_nonce);
    console.log("Mint Role assigned to " + r);
  }

  // assign the collection owner role
  for (let o of collectionOwners) {
    await NFTFactoryPrivate_setNFTCollectionOwnerRole(owner, tProofNFTFactoryPrivate.address, o, ++next_nonce);
    console.log("Collection Owner Role assigned to " + o);
  }

  // set the tokenURIGenerator smart contract address
  for (let o of collectionOwners) {
    await NFTFactoryPrivate_setTokenUriGenerator(owner, tProofNFTFactoryPrivate.address, tProofNFTTokenUriGeneratorPrivate.address, ++next_nonce);
    console.log("Set TokenUriGenerator contract ad address " + tProofNFTTokenUriGeneratorPrivate.address);
  }

  return { tProofNFTFactoryPrivate, tProofNFTTokenUriGeneratorPrivate }
}


if (typeof require !== 'undefined' && require.main === module) {
  let chainId: "5" | "137" | "80001" | "1337" = "137";
  deploy(
    PRIVATE_DEPLOYMENT.NAME,
    PRIVATE_DEPLOYMENT.SYMBOL,
    PRIVATE_DEPLOYMENT.MINER_ROLE,
    PRIVATE_DEPLOYMENT.COLLECTION_OWNER_ROLE,
    true
  )
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}



