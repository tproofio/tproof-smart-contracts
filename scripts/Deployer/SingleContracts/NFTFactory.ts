import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";
import {TProofNFTFactory} from "../../../typechain-types";


/**
 * Deploy an instance of NFT Factory
 * @param signer - who's going to sign the transaction
 * @param chainId - used to give the right ID not NFTs
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function deployNFTFactory(signer: SignerWithAddress, chainId: number, nonce: number = -1): Promise<TProofNFTFactory> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofNFTFactory", signer);
  return await contractFactory.deploy(
    chainId,
    { nonce: next_nonce }
  ) as TProofNFTFactory;
}

/**
 * Attach to an already deployed instance of NFTFactory
 * @param user - user that will interact with the contract
 * @param contractAddress - address of the deployed contract
 */
export async function attachNFTFactory(user: SignerWithAddress, contractAddress: string): Promise<TProofNFTFactory> {
  const contractFactory = await ethers.getContractFactory("tProofNFTFactory", user);
  return await contractFactory.attach(contractAddress) as TProofNFTFactory;
}

/**
 * Set the Token URI Generator address in the NFT Factory
 * @param signer - who's going to sign the transaction
 * @param NFTFactoryAddress - address of the deployed NFT Factory
 * @param NFTTokenUriGeneratorAddress - address of the contract that generates the URI content
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function NFTFactory_setTokenUriGenerator(
  signer: SignerWithAddress,
  NFTFactoryAddress: string,
  NFTTokenUriGeneratorAddress: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofNFTFactory", signer);
  return await contractFactory
    .attach(NFTFactoryAddress)
    .setTokenUriGenerator(
      NFTTokenUriGeneratorAddress,
      { nonce: next_nonce }
    );
}


/**
 * Adds the MINT_ROLE role to the given address
 * @param signer - who's going to sign the transaction
 * @param tProofNFTFactoryAddress - address of the deployed NFT Factory
 * @param minterWalletAddress - wallet that will get the role
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function NFTFactory_setMintRole(
  signer: SignerWithAddress,
  tProofNFTFactoryAddress: string,
  minterWalletAddress: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofNFTFactory", signer);
  return await contractFactory
    .attach(tProofNFTFactoryAddress)
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINT_ROLE")),
      minterWalletAddress,
      { nonce: next_nonce }
    );
}
