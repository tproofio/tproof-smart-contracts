import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";


/**
 * Deploy an instance of NFTTokenUriGenerator
 * @param signer - who's going to sign the transaction
 * @param tProofNFTFactoryAddress - address of the NFT Factory contract on chain
 * @param tProofHashRegistryAddress - address of the hash registry contract on chain
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function deployNFTTokenUriGenerator(
  signer: SignerWithAddress,
  tProofNFTFactoryAddress: string,
  tProofHashRegistryAddress: string,
  nonce: number = -1
): Promise<Contract> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofNFTTokenUriGenerator", signer);
  return await contractFactory.deploy(
    tProofNFTFactoryAddress,
    tProofHashRegistryAddress,
    { nonce: next_nonce }
  );
}
