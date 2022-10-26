import {deployNFTFactory} from "../../scripts/Deployer/SingleContracts/NFTFactory";
import {ethers} from "hardhat";
import {TProofNFTFactory} from "../../typechain-types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import randomstring from "randomstring";
import {BigNumber} from "ethers";
import {fromNftNumToTokenId} from "../_setup/supportFunctions";
import {TEST_CHAIN_ID} from "../_setup/TestConstants";


describe("tProofNFTFactory", () => {

  describe("End-user functions", () => {
    let NFTFactory: TProofNFTFactory;
    let deployer: SignerWithAddress;
    let user01: SignerWithAddress;
    let user02: SignerWithAddress;
    let user03: SignerWithAddress;

    // deploy the NFT contract itself
    before(async () => {
      const [us0, us1, us2, us3] = await ethers.getSigners();
      deployer = us0;
      user01 = us1;
      user02 = us2;
      user03 = us3;
      NFTFactory = await deployNFTFactory(deployer, TEST_CHAIN_ID);
    });

    describe("Mint", async () => {

      it("Should throw error (no mint role assigned)", async () => {
        let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        try {
          await NFTFactory.connect(user01).mint(user01.address, [hash], [""]);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/AccessControl: account 0x([0-9a-fA-F]{40}) is missing role 0x([0-9a-fA-F]{64})/);
          return
        }
        expect.fail(null, null, 'User without a role was able to mint');
      })

      it("Should assign the MINT_ROLE", async () => {
        let roleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINT_ROLE"));
        await NFTFactory.grantRole(
          roleHash,
          user01.address
        );
        expect(await NFTFactory.hasRole(roleHash, user01.address)).to.be.true;
      });

      it("Should mint one", async () => {
        let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        await NFTFactory.connect(user01).mint(user01.address, [hash], [""]);
        expect(await NFTFactory.balanceOf(user01.address)).to.be.equal(1);
      });

      it("Should total supply equals one", async () => {
        let totalSupplyRead = await NFTFactory.totalSupply();
        expect(totalSupplyRead.toString()).to.be.equal("1");
      });

      it("Should mint one and send to user02", async () => {
        let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        await NFTFactory.connect(user01).mint(user02.address, [hash], [""]);
        expect(await NFTFactory.balanceOf(user02.address)).to.be.equal(1);
      });

      it("Should total supply equals two", async () => {
        let totalSupplyRead = await NFTFactory.totalSupply();
        expect(totalSupplyRead.toString()).to.be.equal("2");
      });

      it("Should throw error (invalid input arrays length)", async () => {
        let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        // 2 hash and one title
        try {
          await NFTFactory.connect(user01).mint(user01.address, [hash, hash], [""]);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/All arrays must have same length/);
        }
        // 1 hash and 2 titles
        try {
          await NFTFactory.connect(user01).mint(user01.address, [hash], ["", ""]);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/All arrays must have same length/);
          return;
        }
        expect.fail(null, null, 'A mint with different array lenghts went through');
      });

      it("Should throw error (mint paused)", async () => {
        await NFTFactory.pause();
        let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        try {
          await NFTFactory.connect(user01).mint(user01.address, [hash], [""]);
        } catch (error) {
          expect(error).to.be.instanceOf(Error);
          expect(error).to.match(/Pausable: paused'/);
          await NFTFactory.unpause();
          return;
        }
        expect.fail(null, null, 'Mint passed with contract paused');
      });

      it("Should mint two", async () => {
        let hash01 = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        let hash02 = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        let balanceOfInitial = await NFTFactory.balanceOf(user01.address);
        await NFTFactory.connect(user01).mint(user01.address, [hash01, hash02], ["", ""]);
        let balanceOfAfter = await NFTFactory.balanceOf(user01.address);
        expect(balanceOfAfter.toNumber() - balanceOfInitial.toNumber()).to.be.equal(2);
      });

      it("Should mint two and send to user03", async () => {
        let hash01 = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        let hash02 = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        await NFTFactory.connect(user01).mint(user03.address, [hash01, hash02], ["", ""]);
        expect(await NFTFactory.balanceOf(user03.address)).to.be.equal(2);
      });

      it("Should mint one with customTitle", async () => {
        let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        let customTitle = randomstring.generate(15);
        await NFTFactory.connect(user01).mint(user01.address, [hash], [customTitle]);
        let totalSupply = await NFTFactory.totalSupply();
        let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
        let mintedNftData = await NFTFactory.data(lastNftId);
        expect(mintedNftData.title).to.be.equal(customTitle);
      });

      it("Should mint one and exists", async () => {
        let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
        await NFTFactory.connect(user01).mint(user01.address, [hash], [""]);
        let totalSupply = await NFTFactory.totalSupply();
        let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
        expect(await NFTFactory.exists(lastNftId)).to.be.true;
      });

    });

    describe("Operations on NFTs", () => {

      describe("Token Uri", () => {
        it ("Should fail (no token uri generator set)", async () => {
          let totalSupply = await NFTFactory.totalSupply();
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          try {
            await NFTFactory.tokenURI(lastNftId);
          } catch (error) {
            expect(error).to.be.an.instanceof(Error);
            expect(error).to.match(/tokenUriGeneratorContract not initialized/);
            return;
          }
          expect.fail("TokenURI returned a value but was not initialized");
        })
      })

      describe("Edit Title", () => {

        let totalSupply: BigNumber;  // the total supply evaluated after each mint that occurs in the beforeEach section

        beforeEach(async () => {
          let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
          await NFTFactory.connect(user01).mint(user01.address, [hash], [""]);
          totalSupply = await NFTFactory.totalSupply();
        })

        it("Should fail (not the owner of NFT)", async () => {
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          try {
            await NFTFactory.connect(user02).updateTitle([lastNftId], ["ups"]);
          } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error).to.match(/Only owner can change title/);
            return;
          }
          expect.fail("NFT title has been changed from a wallet different from the owner");
        });

        it("Should fail (not the owner of NFT for just one NFT)", async () => {
          let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
          await NFTFactory.connect(user01).mint(user02.address, [hash], [""]);
          let totalSupply = await NFTFactory.totalSupply();
          let user01NftMinted = fromNftNumToTokenId(totalSupply.sub(2).toNumber(), TEST_CHAIN_ID);
          let user02NftMinted = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          try {
            await NFTFactory.connect(user02).updateTitle([user01NftMinted, user02NftMinted], ["ups", "ups"]);
          } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error).to.match(/Only owner can change title/);
            return;
          }
          expect.fail("NFT title has been changed from a wallet different from the owner");
        });

        it("Should fails (arrays have different length)", async () => {
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          try {
            await NFTFactory.connect(user02).updateTitle([lastNftId], ["ups", "ups"]);
          } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error).to.match(/Arrays must have same length/);
            return;
          }
          try {
            await NFTFactory.connect(user02).updateTitle([lastNftId, lastNftId], ["ups"]);
          } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error).to.match(/Arrays must have same length/);
            return;
          }
          expect.fail("Passed the control of different array lengths");
        });

        it("Should edit the title", async () => {
          let newTitle = "newTitle";
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          await NFTFactory.connect(user01).updateTitle([lastNftId], [newTitle]);
          let data = await NFTFactory.data(lastNftId);
          expect(data.title).to.be.equal(newTitle);
        });

        it("Should edit multiple titles (2)", async () => {
          let newTitle1 = "newTitle01";
          let newTitle2 = "newTitle02";
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          let beforeLastNftId = lastNftId.sub(1);
          await NFTFactory.connect(user01).updateTitle([lastNftId, beforeLastNftId], [newTitle1, newTitle2]);
          let data1 = await NFTFactory.data(lastNftId);
          let data2 = await NFTFactory.data(beforeLastNftId);
          expect(data1.title).to.be.equal(newTitle1);
          expect(data2.title).to.be.equal(newTitle2);
        });

        it("Should throw error (contract paused)", async () => {
          await NFTFactory.pause();
          let newTitle1 = "newTitle";
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          try {
            await NFTFactory.connect(user01).updateTitle([lastNftId], [newTitle1]);
          } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error).to.match(/Pausable: paused'/);
            await NFTFactory.unpause();
            return;
          }
          expect.fail(null, null, 'Title edited with contract paused');
        });

      })

      describe("Edit Description", () => {

        let totalSupply: BigNumber;  // the total supply evaluated after each mint that occurs in the beforeEach section

        beforeEach(async () => {
          let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
          await NFTFactory.connect(user01).mint(user01.address, [hash], [""]);
          totalSupply = await NFTFactory.totalSupply();
        })

        it("Should fail (not the owner of NFT)", async () => {
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          try {
            await NFTFactory.connect(user02).setDescription([lastNftId], ["newDescription"]);
          } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error).to.match(/Only owner can change description/);
            return;
          }
          expect.fail("NFT description has been changed from a wallet different from the owner");
        });

        it("Should fail (not the owner of NFT for just one NFT)", async () => {
          let hash = ethers.utils.keccak256(ethers.utils.randomBytes(32));
          await NFTFactory.connect(user01).mint(user02.address, [hash], [""]);
          let totalSupply = await NFTFactory.totalSupply();
          let user01NftMinted = fromNftNumToTokenId(totalSupply.sub(2).toNumber(), TEST_CHAIN_ID);
          let user02NftMinted = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          try {
            await NFTFactory.connect(user02).setDescription([user01NftMinted, user02NftMinted], ["newDesc", "newDesc"]);
          } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error).to.match(/Only owner can change description/);
            return;
          }
          expect.fail("NFT description has been changed from a wallet different from the owner");
        });

        it("Should fails (arrays have different length)", async () => {
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          try {
            await NFTFactory.connect(user02).setDescription([lastNftId], ["newDesc", "newDesc"]);
          } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error).to.match(/Arrays must have same length/);
            return;
          }
          try {
            await NFTFactory.connect(user02).setDescription([lastNftId, lastNftId], ["newDesc"]);
          } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error).to.match(/Arrays must have same length/);
            return;
          }
          expect.fail("Passed the control of different array lengths");
        });

        it("Should edit the description", async () => {
          let newDescription = "newDescription";
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          await NFTFactory.connect(user01).setDescription([lastNftId], [newDescription]);
          let description = await NFTFactory.description(lastNftId);
          expect(description).to.be.equal(newDescription);
        });

        it("Should edit multiple descriptions (2)", async () => {
          let newDesc01 = "newDesc01";
          let newDesc02 = "newDesc02";
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          let beforeLastNftId = lastNftId.sub(1);
          await NFTFactory.connect(user01).setDescription([lastNftId, beforeLastNftId], [newDesc01, newDesc02]);
          let description1 = await NFTFactory.description(lastNftId);
          let description2 = await NFTFactory.description(beforeLastNftId);
          expect(description1).to.be.equal(newDesc01);
          expect(description2).to.be.equal(newDesc02);
        });

        it("Should throw error (contract paused)", async () => {
          await NFTFactory.pause();
          let newDescription = "newDescirption";
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          try {
            await NFTFactory.connect(user01).setDescription([lastNftId], [newDescription]);
          } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error).to.match(/Pausable: paused'/);
            await NFTFactory.unpause();
            return;
          }
          expect.fail(null, null, 'Description edited with contract paused');
        });

      })

      describe("Normalize Nft Num", () => {

        it("Should return passed tokenId", async () => {
          let totalSupply = await NFTFactory.totalSupply();
          let lastNftId = fromNftNumToTokenId(totalSupply.sub(1).toNumber(), TEST_CHAIN_ID);
          let normalizedNftNum = await NFTFactory.normalizeNftNum(lastNftId);
          expect(normalizedNftNum).to.be.equal(lastNftId);
        });

        it("Should return correct tokenId from NftNum", async () => {
          let totalSupply = await NFTFactory.totalSupply();
          let lastNftNum = totalSupply.sub(1);
          let lastNftId = fromNftNumToTokenId(lastNftNum.toNumber(), TEST_CHAIN_ID);
          let normalizedNftNum = await NFTFactory.normalizeNftNum(lastNftNum);
          expect(normalizedNftNum).to.be.equal(lastNftId);
        });

      })
    })
  });

  describe("Owner functions", () => {
    let NFTFactory: TProofNFTFactory;
    let deployer: SignerWithAddress;
    let user01: SignerWithAddress;
    let user02: SignerWithAddress;
    let user03: SignerWithAddress;

    // deploy the NFT contract itself
    before(async () => {
      const [us0, us1, us2, us3] = await ethers.getSigners();
      deployer = us0;
      user01 = us1;
      user02 = us2;
      user03 = us3;
      NFTFactory = await deployNFTFactory(deployer, TEST_CHAIN_ID);
    });

    it("Should throw error (not called by owner)", async () => {
      let newAddress = "0xaabbccddeeff11223344556677889900abcdef01";
      try {
        await NFTFactory.connect(user01).setTokenUriGenerator(newAddress);
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error).to.match(/AccessControl: account 0x([0-9a-fA-F]{40}) is missing role 0x([0-9a-fA-F]{64})/);
        return;
      }
      expect.fail("Token Uri set from a wallet that is not the owner");
    });

    it("Should set token Uri generator contract", async () => {
      let newAddress = ethers.utils.getAddress("0xaabbccddeeff11223344556677889900abcdef01");
      await NFTFactory.setTokenUriGenerator(newAddress);
      expect(await NFTFactory.getTokenUriGeneratorAddress()).to.be.equal(newAddress);
    });

    it("Should update the token Uri generator contract", async () => {
      let newAddress = ethers.utils.getAddress("0xaabbccddeeff11223344556677889900abcdef01");
      await NFTFactory.setTokenUriGenerator(newAddress);
      expect(await NFTFactory.getTokenUriGeneratorAddress()).to.be.equal(newAddress);
    });

    it("Should pause/unpause the contract", async () => {
      await NFTFactory.pause();
      expect(await NFTFactory.paused()).to.be.true;
      await NFTFactory.unpause();
      expect(await NFTFactory.paused()).to.be.false;
    });

    it("Should fail (pause contract from a non owner)", async () => {
      try {
        await NFTFactory.connect(user01).pause();
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error).to.match(/AccessControl: account 0x([0-9a-fA-F]{40}) is missing role 0x([0-9a-fA-F]{64})/);
        return;
      }
      expect.fail("A generic wallet paused the contract");
    });

    it("Should fail (unpause contract from a non owner)", async () => {
      await NFTFactory.pause();
      try {
        await NFTFactory.connect(user01).unpause();
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error).to.match(/AccessControl: account 0x([0-9a-fA-F]{40}) is missing role 0x([0-9a-fA-F]{64})/);
        await NFTFactory.unpause();
        return;
      }
      expect.fail("A generic wallet unpaused the contract");
    });

  })



});
