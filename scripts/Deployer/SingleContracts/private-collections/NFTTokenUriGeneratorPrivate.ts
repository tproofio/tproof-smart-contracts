import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {TProofNFTTokenUriGeneratorPrivate} from "../../../../typechain-types";

/**
 * Deploy an instance of tProofNFTTokenUriGeneratorPrivate
 * @param signer - who's going to sign the transaction
 * @param nftContractAddress - the address of the deployed tProofNFTFactoryPrivate contract
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function deployTProofNFTTokenUriGeneratorPrivate(
  signer: SignerWithAddress,
  nftContractAddress: string,
  nonce: number = -1
): Promise<TProofNFTTokenUriGeneratorPrivate> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofNFTTokenUriGeneratorPrivate", signer);
  const contract = await contractFactory.deploy(nftContractAddress, { nonce: next_nonce }) as TProofNFTTokenUriGeneratorPrivate;
  await contract.deployed();
  return contract;
}
