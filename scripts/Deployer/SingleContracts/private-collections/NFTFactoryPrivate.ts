import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {TProofNFTFactoryPrivate} from "../../../../typechain-types";

/**
 * Deploy an instance of tProofNFTFactoryPrivate
 * @param signer - who's going to sign the transaction
 * @param certName - name of the NFT
 * @param certSymbol - symbol of the NFT
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function deployTProofNFTFactoryPrivate(
  signer: SignerWithAddress,
  certName: string,
  certSymbol: string,
  nonce: number = -1
): Promise<TProofNFTFactoryPrivate> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofNFTFactoryPrivate", signer);
  const contract = await contractFactory.deploy(certName, certSymbol, { nonce: next_nonce }) as TProofNFTFactoryPrivate;
  await contract.deployed();
  return contract;
}


/**
 * Adds the MINT_ROLE to the given address
 * @param signer - who's going to sign the transaction
 * @param tProofNFTFactoryPrivateAddress - address of the deployed contract
 * @param walletAddress - address that will get the role
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function NFTFactoryPrivate_setMintRole(
  signer: SignerWithAddress,
  tProofNFTFactoryPrivateAddress: string,
  walletAddress: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofNFTFactoryPrivate", signer);
  return await contractFactory
    .attach(tProofNFTFactoryPrivateAddress)
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINT_ROLE")),
      walletAddress,
      { nonce: next_nonce }
    );
}


/**
 * Adds the NFT_COLLECTION_OWNER_ROLE to the given address
 * @param signer - who's going to sign the transaction
 * @param tProofNFTFactoryPrivateAddress - address of the deployed contract
 * @param walletAddress - address that will get the role
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function NFTFactoryPrivate_setNFTCollectionOwnerRole(
  signer: SignerWithAddress,
  tProofNFTFactoryPrivateAddress: string,
  walletAddress: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofNFTFactoryPrivate", signer);
  return await contractFactory
    .attach(tProofNFTFactoryPrivateAddress)
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("NFT_COLLECTION_OWNER_ROLE")),
      walletAddress,
      { nonce: next_nonce }
    );
}


/**
 * Adds the NFT_COLLECTION_OWNER_ROLE to the given address
 * @param signer - who's going to sign the transaction
 * @param tProofNFTFactoryPrivateAddress - address of the deployed contract
 * @param setTokenUriGeneratorAddress - address of the token Uri Generator Smart Contract
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function NFTFactoryPrivate_setTokenUriGenerator(
  signer: SignerWithAddress,
  tProofNFTFactoryPrivateAddress: string,
  setTokenUriGeneratorAddress: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofNFTFactoryPrivate", signer);
  return await contractFactory
    .attach(tProofNFTFactoryPrivateAddress)
    .setTokenUriGenerator(
      setTokenUriGeneratorAddress,
      { nonce: next_nonce }
    );
}
