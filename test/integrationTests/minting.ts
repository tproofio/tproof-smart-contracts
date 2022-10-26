import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import {deployRouter} from "../../scripts/Deployer/SingleContracts/Router";
import {
  TProofHashRegistry,
  TProofHashRegistryStorageType_ArweaveV1,
  TProofNFTFactory,
  TProofNFTTokenUriGenerator,
  TProofRouter, TProofUrlVerifierRouter
} from "../../typechain-types";
import {deployNFTFactory} from "../../scripts/Deployer/SingleContracts/NFTFactory";
import {TEST_CHAIN_ID} from "../_setup/TestConstants";
import {deployHashRegistry} from "../../scripts/Deployer/SingleContracts/HashRegistry";
import {deploy} from "../../scripts/Deployer/deploy";
import {CHAIN_CONSTANTS} from "../../scripts/ProjectConstants";
import { expect } from "chai";
import {address} from "hardhat/internal/core/config/config-validation";

describe("Minting via Router", () => {

  let deployer: SignerWithAddress;
  let user01: SignerWithAddress;
  let user02: SignerWithAddress;
  let user03: SignerWithAddress;

  let tProofRouter: TProofRouter;
  let NFTFactory: TProofNFTFactory;
  let hashRegistry: TProofHashRegistry;
  let NFTTokenUriGenerator: TProofNFTTokenUriGenerator;
  let hashRegistryStorageTypeArweaveV1: TProofHashRegistryStorageType_ArweaveV1;
  let urlVerifierRouter: TProofUrlVerifierRouter;

  before(async () => {
    const [us0, us1, us2, us3] = await ethers.getSigners();
    deployer = us0;
    user01 = us1;
    user02 = us2;
    user03 = us3;

    let res = await deploy(
      CHAIN_CONSTANTS[TEST_CHAIN_ID].JOD_ID,
      CHAIN_CONSTANTS[TEST_CHAIN_ID].ORACLE_ADDRESS,
      CHAIN_CONSTANTS[TEST_CHAIN_ID].LINK_ERC20_ADDRESS,
      CHAIN_CONSTANTS[TEST_CHAIN_ID].WITHDRAW_WALLET_ADDRESS,
      CHAIN_CONSTANTS[TEST_CHAIN_ID].PREPAID_TPROOF_VALIDITY_SECS,
      CHAIN_CONSTANTS[TEST_CHAIN_ID].INITIAL_MINT_PRICE,
      CHAIN_CONSTANTS[TEST_CHAIN_ID].INITIAL_VERIFICATION_PRICE,
      false
    );

    tProofRouter = res.tProofRouter;
    NFTFactory = res.tProofNFTFactory;
    hashRegistry = res.tProofHashRegistry;
    NFTTokenUriGenerator = res.tProofNFTTokenUriGenerator;
    hashRegistryStorageTypeArweaveV1 = res.tProofHashRegistryStorageTypeArweaveV1;
    urlVerifierRouter = res.tProofUrlVerifierRouter;

  });

  it("Should not allow direct NFT mint", async() => {
    let hash: string = ethers.utils.keccak256(ethers.utils.randomBytes(32));
    try {
      await NFTFactory.mint(deployer.address, [hash], [""]);
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      expect(error).to.match(/AccessControl: account 0x([0-9a-fA-F]{40}) is missing role 0x([0-9a-fA-F]{64})/);
      return;
    }
    expect.fail("Mint directly in NFT contract without role");
  });

  it("Should mint a proof", async() => {
    let hash: string = ethers.utils.keccak256(ethers.utils.randomBytes(32));
    await tProofRouter.createProofs([hash], [""], [false], [0], user01.address, deployer.address, {
      value: CHAIN_CONSTANTS[TEST_CHAIN_ID].INITIAL_MINT_PRICE
    })
  })

})
