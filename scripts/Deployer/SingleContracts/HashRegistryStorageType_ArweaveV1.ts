import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";
import {TProofHashRegistryStorageType_ArweaveV1} from "../../../typechain-types";


/**
 * Deploy an instance of tProofHashRegistryStorageType_ArweaveV1
 * @param signer - who's going to sign the transaction
 * @param tProofHashRegistryAddress - address of the hash registry contract on chain
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function deployHashRegistryStorageType_ArweaveV1(
  signer: SignerWithAddress,
  tProofHashRegistryAddress: string,
  nonce: number = -1
): Promise<TProofHashRegistryStorageType_ArweaveV1> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofHashRegistryStorageType_ArweaveV1", signer);
  return await contractFactory.deploy(
    tProofHashRegistryAddress,
    { nonce: next_nonce }
  ) as TProofHashRegistryStorageType_ArweaveV1;
}
