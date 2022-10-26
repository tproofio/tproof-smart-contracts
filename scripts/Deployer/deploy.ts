import {ethers} from "hardhat";
import {deployNFTFactory, NFTFactory_setMintRole, NFTFactory_setTokenUriGenerator} from "./SingleContracts/NFTFactory";
import {
  deployHashRegistry, hashRegistry_addStorageType,
  hashRegistry_setCertificationManagerRole, hashRegistry_setUrlVerifierRouterAddress,
  hashRegistry_setUrlVerifierRouterRole
} from "./SingleContracts/HashRegistry";
import {deployRouter, router_setWithdrawRole} from "./SingleContracts/Router";
import {deployNFTTokenUriGenerator} from "./SingleContracts/NFTTokenUriGenerator";
import {deployHashRegistryStorageType_ArweaveV1} from "./SingleContracts/HashRegistryStorageType_ArweaveV1";
import {deployUrlVerifierRouter} from "./SingleContracts/UrlVerifierRouter";
import {BigNumber, Contract} from "ethers";
import {TProofNFTFactory, TProofRouter} from "../../typechain-types";

const JOD_ID = "f33949491d4a45948c3291e0efe6c6fe";
const ORACLE_ADDRESS = "0x6e3fC0DD7c85dE678B5494F2b7daDa7232a1e0Cb";
const LINK_ERC20_ADDRESS = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
const WITHDRAW_WALLET_ADDRESS = "0x68C85B3eA70C7cAa14Ad0fc52d3A7d03a63Ef64D";
const PREPAID_TPROOF_VALIDITY_SECS = 86400*14;

/**
 * Function to deploy all the contracts on a new chain. We've used a dedicate function, so that we can call it
 * also during testing
 *
 * @param {string} jobId - id of the Chainlink JobId to certify the match between URL and hash
 * @param {string} oracleAddress - SC ChainLink Oracle address
 * @param {string} linkErc20Address - LINK token ERC-20 address
 * @param {string} withdrawWalletAddress - wallet address allowed to withdraw funds in Router
 * @param {number} prepaidTProofValiditySecs - how many seconds a proof remains pending, waiting for chainlink URL verification call (suggested >= 14 days)
 * @param {boolean} [enableWaiting] - if true, the waiting between certain deployment calls are executed. This can be skipped to speed up tests on local hardhat node
 */
export const deploy = async (
  jobId: string,
  oracleAddress: string,
  linkErc20Address: string,
  withdrawWalletAddress: string,
  prepaidTProofValiditySecs: number,
  enableWaiting: boolean = false
): Promise<{
  tProofNFTFactory: TProofNFTFactory,
  tProofHashRegistry: Contract,
  tProofRouter: TProofRouter,
  tProofNFTTokenUriGenerator: Contract,
  tProofHashRegistryStorageTypeArweaveV1: Contract,
  tProofUrlVerifierRouter: Contract
}> => {

  // We get the contract to deploy
  const [owner] = await ethers.getSigners();

  // get the next nouce
  let next_nonce = await owner.getTransactionCount();

  // Deploy all the smart contracts
  const tProofNFTFactory = await deployNFTFactory(owner, 5, next_nonce);
  console.log("tProofNFTFactory deployed - " + tProofNFTFactory.address);

  const tProofHashRegistry = await deployHashRegistry(owner, tProofNFTFactory.address, ++next_nonce);
  console.log("tProofHashRegistry deployed - " + tProofHashRegistry.address);

  const tProofRouter = await deployRouter(owner, BigNumber.from(0), BigNumber.from(0), prepaidTProofValiditySecs,
    tProofNFTFactory.address, tProofHashRegistry.address, ++next_nonce);
  console.log("tProofRouter deployed - " + tProofRouter.address);

  const tProofNFTTokenUriGenerator = await deployNFTTokenUriGenerator(owner, tProofNFTFactory.address,
    tProofHashRegistry.address, ++next_nonce);
  console.log("tProofNFTTokenUriGenerator deployed - " + tProofNFTTokenUriGenerator.address);

  const tProofHashRegistryStorageTypeArweaveV1 =
    await deployHashRegistryStorageType_ArweaveV1(owner, tProofHashRegistry.address, ++next_nonce);
  console.log("tProofHashRegistryStorageTypeArweaveV1 deployed - " + tProofHashRegistryStorageTypeArweaveV1.address);

  const tProofUrlVerifierRouter = await deployUrlVerifierRouter(owner, tProofHashRegistry.address, jobId,
    oracleAddress, linkErc20Address, ++next_nonce);
  console.log("tProofUrlVerifierRouter deployed - " + tProofUrlVerifierRouter.address);

  if (enableWaiting)
    await new Promise((resolve, reject) => {setTimeout(resolve,3000)});

  /// Section where we set all the post-constructor values

  // set the TokenUriGenerator Url in the NFT contract
  await NFTFactory_setTokenUriGenerator(owner, tProofNFTFactory.address,
    tProofNFTTokenUriGenerator.address, ++next_nonce);

  // add WITHDRAW_ROLE in the router contract
  await router_setWithdrawRole(owner, tProofRouter.address, withdrawWalletAddress, ++next_nonce);

  // add MINT_ROLE inside tProofNFTFactory
  await NFTFactory_setMintRole(owner, tProofNFTFactory.address, tProofRouter.address, ++next_nonce);

  // add CERTIFICATION_MANAGER_ROLE inside tProofHashRegistry
  await hashRegistry_setCertificationManagerRole(owner, tProofHashRegistry.address, tProofRouter.address, ++next_nonce);
  // add URL_VERIFIER_ROUTER_ROLE inside tProofHashRegistry
  await hashRegistry_setUrlVerifierRouterRole(owner, tProofHashRegistry.address, tProofUrlVerifierRouter.address, ++next_nonce);

  await hashRegistry_setUrlVerifierRouterAddress(owner, tProofHashRegistry.address, tProofUrlVerifierRouter.address, ++next_nonce);

  // set typedata manager arweave and call it  "ArweaveV1"
  await hashRegistry_addStorageType(owner, tProofHashRegistry.address,
    tProofHashRegistryStorageTypeArweaveV1.address, "ArweaveV1", ++next_nonce);

  return { tProofNFTFactory, tProofHashRegistry, tProofRouter, tProofNFTTokenUriGenerator, tProofHashRegistryStorageTypeArweaveV1, tProofUrlVerifierRouter }
}


if (typeof require !== 'undefined' && require.main === module) {
  deploy(
    JOD_ID, ORACLE_ADDRESS, LINK_ERC20_ADDRESS, WITHDRAW_WALLET_ADDRESS, PREPAID_TPROOF_VALIDITY_SECS, true
  )
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}



