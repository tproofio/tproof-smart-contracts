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
import {
  TProofHashRegistry,
  TProofHashRegistryStorageType_ArweaveV1,
  TProofNFTFactory,
  TProofNFTTokenUriGenerator,
  TProofRouter, TProofUrlVerifierRouter
} from "../../typechain-types";
import {CHAIN_CONSTANTS} from "../ProjectConstants";

/**
 * Function to deploy all the contracts on a new chain. We've used a dedicate function, so that we can call it
 * also during testing
 *
 * @param {string} jobId - id of the Chainlink JobId to certify the match between URL and hash
 * @param {string} oracleAddress - SC ChainLink Oracle address
 * @param {string} linkErc20Address - LINK token ERC-20 address
 * @param {string} withdrawWalletAddress - wallet address allowed to withdraw funds in Router
 * @param {number} prepaidTProofValiditySecs - how many seconds a proof remains pending, waiting for chainlink URL verification call (suggested >= 14 days)
 * @param {number} initialMintPrice - price for a mint (initial one)
 * @param {number} initialVerificationPrice - price for a verification (initial one)
 * @param {number} chainId - id of the chain we're deploying to
 * @param {boolean} [enableWaiting] - if true, the waiting between certain deployment calls are executed. This can be skipped to speed up tests on local hardhat node
 */
export const deploy = async (
  jobId: string,
  oracleAddress: string,
  linkErc20Address: string,
  withdrawWalletAddress: string,
  prepaidTProofValiditySecs: number,
  initialMintPrice: BigNumber,
  initialVerificationPrice: BigNumber,
  chainId: number,
  enableWaiting: boolean = false
): Promise<{
  tProofNFTFactory: TProofNFTFactory,
  tProofHashRegistry: TProofHashRegistry,
  tProofRouter: TProofRouter,
  tProofNFTTokenUriGenerator: TProofNFTTokenUriGenerator,
  tProofHashRegistryStorageTypeArweaveV1: TProofHashRegistryStorageType_ArweaveV1,
  tProofUrlVerifierRouter: TProofUrlVerifierRouter
}> => {

  // We get the contract to deploy
  const [owner] = await ethers.getSigners();

  // get the next nouce
  let next_nonce = await owner.getTransactionCount();

  // Deploy all the smart contracts
  const tProofNFTFactory = await deployNFTFactory(owner, chainId, next_nonce);
  console.log("tProofNFTFactory deployed - " + tProofNFTFactory.address);

  const tProofHashRegistry = await deployHashRegistry(owner, tProofNFTFactory.address, ++next_nonce);
  console.log("tProofHashRegistry deployed - " + tProofHashRegistry.address);

  const tProofRouter = await deployRouter(owner, initialMintPrice, initialVerificationPrice, prepaidTProofValiditySecs,
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
    await new Promise((resolve, reject) => {setTimeout(resolve,15000)});

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
  let chainId: "5" | "137" | "80001" | "1337" = "137";
  deploy(
    CHAIN_CONSTANTS[chainId].JOD_ID,
    CHAIN_CONSTANTS[chainId].ORACLE_ADDRESS,
    CHAIN_CONSTANTS[chainId].LINK_ERC20_ADDRESS,
    CHAIN_CONSTANTS[chainId].WITHDRAW_WALLET_ADDRESS,
    CHAIN_CONSTANTS[chainId].PREPAID_TPROOF_VALIDITY_SECS,
    CHAIN_CONSTANTS[chainId].INITIAL_MINT_PRICE,
    CHAIN_CONSTANTS[chainId].INITIAL_VERIFICATION_PRICE,
    parseInt(chainId),
    true
  )
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}



