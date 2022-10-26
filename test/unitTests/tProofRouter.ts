import {deployRouter} from "../../scripts/Deployer/SingleContracts/Router";
import {TProofRouter} from "../../typechain-types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import {expect} from "chai";
import {CHAIN_CONSTANTS} from "../../scripts/ProjectConstants";
import {TEST_CHAIN_ID} from "../_setup/TestConstants";
import exp from "constants";

const PREPAID_TPROOF_VALIDITY_SECS = CHAIN_CONSTANTS[TEST_CHAIN_ID].PREPAID_TPROOF_VALIDITY_SECS;

describe("tProofRouter", () => {

  let deployer: SignerWithAddress;
  let user01: SignerWithAddress;
  let user02: SignerWithAddress;
  let user03: SignerWithAddress;
  const initialMintPrice = CHAIN_CONSTANTS[TEST_CHAIN_ID].INITIAL_MINT_PRICE;
  const initialVerificationPrice = CHAIN_CONSTANTS[TEST_CHAIN_ID].INITIAL_VERIFICATION_PRICE;

  before(async () => {
    const [us0, us1, us2, us3] = await ethers.getSigners();
    deployer = us0;
    user01 = us1;
    user02 = us2;
    user03 = us3;
  })

  describe("Constructor parameters", async() => {
    it("Should deploy with correct constructor parameters", async () => {
      const NFTFactory = ethers.utils.getAddress("0xaabbccddeeff0011223344556677889901234567");
      const HashRegistry = ethers.utils.getAddress("0xaabbccddeeff00112233445566778899abcdef12");
      let tProofRouter = await deployRouter(deployer, initialMintPrice, initialVerificationPrice,
        PREPAID_TPROOF_VALIDITY_SECS, NFTFactory, HashRegistry);
      expect(await tProofRouter.MINT_PRICE()).to.be.equals(initialMintPrice);
      expect(await tProofRouter.VERIFICATION_PRICE()).to.be.equals(initialVerificationPrice);
      expect(await tProofRouter.VALIDITY_FOR_HASH_VERIFICATION()).to.be.equals(PREPAID_TPROOF_VALIDITY_SECS);
      expect(await tProofRouter.getNFTFactoryContractAddress()).to.be.equals(NFTFactory);
      expect(await tProofRouter.getHashRegistryContractAddress()).to.be.equals(HashRegistry);
    });
  });

  describe("User interaction functions", async () => {

    let tProofRouter: TProofRouter;
    let hash: string = ethers.utils.keccak256(ethers.utils.randomBytes(32));

    before(async () => {
      const NFTFactory = ethers.utils.getAddress("0xaabbccddeeff0011223344556677889901234567");
      const HashRegistry = ethers.utils.getAddress("0xaabbccddeeff00112233445566778899abcdef12");
      tProofRouter = await deployRouter(deployer, initialMintPrice, initialVerificationPrice,
        PREPAID_TPROOF_VALIDITY_SECS, NFTFactory, HashRegistry);
    });

    describe("Create Proofs", () => {
      it("Should fail as wrong payment is sent", async () => {
        try {
          await tProofRouter.connect(user01).createProofs(
            [hash], [""], [false], [0], user01.address, user01.address,
            {
              value: 0
            }
          );
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Not enough ETH send for minting/);
          return;
        }
        expect.fail("Proofs created with wrong payment sent");
      });

      it("Should fail as wrong payment is sent (with verification)", async () => {
        try {
          await tProofRouter.connect(user01).createProofs(
            [hash], [""], [true], [0], user01.address, user01.address,
            {
              value: initialMintPrice
            }
          );
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Not enough ETH send for minting/);
          return;
        }
        expect.fail("Proofs created with wrong payment sent for mint + verification");
      });

      it("Should fail as wrong NFT Factory and HashRegistry addresses have been included", async () => {
        try {
          await tProofRouter.connect(user01).createProofs(
            [hash], [""], [false], [0], user01.address, user01.address,
            { value: initialMintPrice }
          );
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Transaction reverted: function returned an unexpected amount of data/);
          return;
        }
        expect.fail("Proofs created with wrong NFT Factory and Hash registry added");
      });

      it("Should fail as wrong arrays length of arguments", async () => {
        // 2 titles and one others
        try {
          await tProofRouter.connect(user01).createProofs([hash], ["", ""], [false], [0], user01.address, user01.address);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Array must have same length/);
        }
        // 2 withFileUrls and one others
        try {
          await tProofRouter.connect(user01).createProofs([hash], [""], [false, false], [0], user01.address, user01.address);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Array must have same length/);
        }
        // 2 storageType and one others
        try {
          await tProofRouter.connect(user01).createProofs([hash], [""], [false], [0, 0], user01.address, user01.address);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Array must have same length/);
          return;
        }
        expect.fail(null, null, 'A mint createProofs different array lengths went through');
      });

      it("Should fail as contract is paused", async () => {
        await tProofRouter.pause();
        try {
          await tProofRouter.connect(user01).createProofs(
            [hash], [""], [false], [0], user01.address, user01.address,
            {
              value: 0
            }
          );
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Pausable: paused/);
          await tProofRouter.unpause();
          return;
        }
        expect.fail("Proofs created with contract paused");
      });
    });

    describe("Edit Title", () => {
      it("Should fail  as wrong NFTFactoryContract is set", async () => {
        try {
          await tProofRouter.connect(user01).editProofTitle([0], ["newTitle"]);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Transaction reverted: function call to a non-contract account/);
          return;
        }
        expect.fail("Did not fail with a wrong NFTFactoryContract set");
      });

      it("Should fail as contract is paused", async () => {
        await tProofRouter.pause();
        try {
          await tProofRouter.connect(user01).editProofTitle([0], ["newTitle"]);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Pausable: paused/);
          await tProofRouter.unpause();
          return;
        }
        expect.fail("editProofTitle called with contract paused");
      });
    });

    describe("Verify Hash File Url", () => {
      it("Should fail as verification is turned off", async () => {
        try {
          await tProofRouter.connect(user01).verifyHashFileUrl([0], ["https://dada.com"], [0], [0]);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/File Url Verification disabled/);
          await tProofRouter.toggleUrlVerificationService();
          return;
        }
        expect.fail("Did not fail with Url Verification Disabled");
      });

      it("Should fail as wrong HashRegistryContract is set", async () => {
        try {
          await tProofRouter.connect(user01).verifyHashFileUrl([0], ["https://dada.com"], [0], [0]);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Transaction reverted: function call to a non-contract account/);
          return;
        }
        expect.fail("Did not fail with a wrong HashRegistryContract set");
      });

      it("Should fail as contract is paused", async () => {
        await tProofRouter.pause();
        try {
          await tProofRouter.connect(user01).verifyHashFileUrl([0], ["https://dada.com"], [0], [0]);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Pausable: paused/);
          await tProofRouter.unpause();
          return;
        }
        expect.fail("verifyHashFileUrl called with contract paused");
      });
    });

    describe("Extend verification", () => {
      it("Should fail as verification is turned off", async () => {
        await tProofRouter.toggleUrlVerificationService();
        try {
          await tProofRouter.connect(user01).extendVerification([0], [0], {value: 0});
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/File Url Verification disabled/);
          await tProofRouter.toggleUrlVerificationService();
          return;
        }
        expect.fail("Did not fail with Url Verification Disabled");
      });

      it("Should fail as not enough ETH sent", async () => {
        // correct one and send 0 ETH
        try {
          await tProofRouter.connect(user01).extendVerification([0], [0], {value: 0});
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Not enough ETH sent/);
        }
        // correct two and send ETH for one
        try {
          await tProofRouter.connect(user01).extendVerification([0, 0], [0, 0], {value: initialVerificationPrice});
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Not enough ETH sent/);
          return;
        }
        expect.fail("Verification period extended with not enough ethereum");
      });

      it("Should fail as wrong HashRegistryContract is set", async () => {
        try {
          await tProofRouter.connect(user01).extendVerification([0], [0], {value: initialVerificationPrice});
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Transaction reverted: function returned an unexpected amount of data/);
          return;
        }
        expect.fail("Did not fail with a wrong HashRegistryContract set");
      });

      it("Should fail as contract is paused", async () => {
        await tProofRouter.pause();
        try {
          await tProofRouter.connect(user01).extendVerification([0], [0], {value: initialVerificationPrice});
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Pausable: paused/);
          await tProofRouter.unpause();
          return;
        }
        expect.fail("extendVerification called with contract paused");
      });
    });

  });  // end of User interaction functions

  describe("Admin interaction functions", async () => {
    let tProofRouter: TProofRouter;

    before(async () => {
      const NFTFactory = ethers.utils.getAddress("0xaabbccddeeff0011223344556677889901234567");
      const HashRegistry = ethers.utils.getAddress("0xaabbccddeeff00112233445566778899abcdef12");
      tProofRouter = await deployRouter(deployer, initialMintPrice, initialVerificationPrice,
        PREPAID_TPROOF_VALIDITY_SECS, NFTFactory, HashRegistry);
    });

    describe("Withdraw", () => {

      let WITHDRAW_ROLE: string = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WITHDRAW_ROLE"));

      // before each test, send some ethers to the contract
      beforeEach(async () => {
        await user02.sendTransaction({
          to: tProofRouter.address,
          value: ethers.utils.parseEther("0.02"),
          gasLimit: 50000
        })
      })

      it("Should fail has no WITHDRAW_ROLE set", async () => {
        try {
          await tProofRouter.connect(user01).withdraw();
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/AccessControl: account 0x([0-9a-fA-F]{40}) is missing role 0x([0-9a-fA-F]{64})/);
          return;
        }
        expect.fail("Withdraw succeeded without WITHDRAW_ROLE");
      });

      it("Should withdraw wallet content", async () => {
        await tProofRouter.grantRole(WITHDRAW_ROLE, user01.address);
        let balanceOfUser01 = await user01.getBalance();
        let balanceOfContract = await ethers.provider.getBalance(tProofRouter.address);
        let tx = await tProofRouter.connect(user01).withdraw();
        const receipt = await tx.wait();
        const gasUsed = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
        let balanceOfUser01After = await user01.getBalance();
        expect(balanceOfUser01After.add(gasUsed).sub(balanceOfUser01)).to.be.equals(balanceOfContract);
      });

      it("Should fail as contract is paused", async () => {
        await tProofRouter.pause();
        try {
          await tProofRouter.connect(user01).withdraw();
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Pausable: paused/);
          await tProofRouter.unpause();
          return;
        }
        expect.fail("withdraw called with contract paused");
      });

      it("Should fail as WITHDRAW_ROLE is revoked", async () => {
        await tProofRouter.revokeRole(WITHDRAW_ROLE, user01.address);
        try {
          await tProofRouter.connect(user01).withdraw();
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/AccessControl: account 0x([0-9a-fA-F]{40}) is missing role 0x([0-9a-fA-F]{64})/);
          return;
        }
        expect.fail("withdraw called after revoking the WITHDRAW_ROLE");
      });

    });

    describe("Change prices", () => {
      it("Should change mint price", async () => {
        let newMintPrice = initialMintPrice.div(2);
        await tProofRouter.setMintPrice(newMintPrice);
        expect(await tProofRouter.MINT_PRICE()).to.be.equals(newMintPrice);
      })

      it("Should fail (change mint price without permission)", async() => {
        try {
          await tProofRouter.connect(user01).setMintPrice(initialMintPrice);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/AccessControl: account 0x([0-9a-fA-F]{40}) is missing role 0x([0-9a-fA-F]{64})/);
          return;
        }
        expect.fail("Changed mint price without role");
      })

      it("Should change verification price", async () => {
        let newVerificationPrice = initialVerificationPrice.div(2);
        await tProofRouter.setVerificationPrice(newVerificationPrice);
        expect(await tProofRouter.VERIFICATION_PRICE()).to.be.equals(newVerificationPrice);
      })

      it("Should fail (change verification price without permission)", async() => {
        try {
          await tProofRouter.connect(user01).setVerificationPrice(initialVerificationPrice);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/AccessControl: account 0x([0-9a-fA-F]{40}) is missing role 0x([0-9a-fA-F]{64})/);
          return;
        }
        expect.fail("Changed verification price without role");
      })

    })
  });
})
