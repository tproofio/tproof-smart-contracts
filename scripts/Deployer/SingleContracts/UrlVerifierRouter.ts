import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";

/**
 * Deploy an instance of UrlVerifierRouter
 * @param signer - who's going to sign the transaction
 * @param tProofHashRegistryAddress - address of the hash registry contract on chain
 * @param jobId - ID of the job to verify URL on Chainlink Oracle
 * @param oracle - address of the oracle Smart Contract
 * @param LINKAddress - address of LINK ERC-20 contract
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function deployUrlVerifierRouter(
  signer: SignerWithAddress,
  tProofHashRegistryAddress: string,
  jobId: string,
  oracle: string,
  LINKAddress: string,
  nonce: number = -1
): Promise<Contract> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofUrlVerifierRouter", signer);
  return await contractFactory.deploy(
    tProofHashRegistryAddress,
    jobId,
    oracle,
    LINKAddress,
    { nonce: next_nonce }
  );

}
