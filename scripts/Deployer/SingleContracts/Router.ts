import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";

/**
 * Deploy an instance of Hash Regsitry
 * @param signer - who's going to sign the transaction
 * @param initialMintPrice - price to mint a proof
 * @param initialVerificationPrice - price to verify a public file URL
 * @param validityForHashVerification - how long an hash verification can stay pending
 * @param tProofNFTFactoryAddress - address of the NFT Factory contract on chain
 * @param tProofHashRegistryAddress - address of the hash registry contract on chain
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function deployRouter(
  signer: SignerWithAddress,
  initialMintPrice: number,
  initialVerificationPrice: number,
  validityForHashVerification: number,
  tProofNFTFactoryAddress: string,
  tProofHashRegistryAddress: string,
  nonce: number = -1
): Promise<Contract> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofRouter", signer);
  return await contractFactory.deploy(
    initialMintPrice,
    initialVerificationPrice,
    validityForHashVerification,
    tProofNFTFactoryAddress,
    tProofHashRegistryAddress,
    { nonce: next_nonce }
  );
}

/**
 * Adds the WITHDRAW_ROLE role to the given address
 * @param signer - who's going to sign the transaction
 * @param tProofRouterAddress - address of the deployed Router
 * @param withdrawWalletAddress - wallet that will get the role
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function router_setWithdrawRole(
  signer: SignerWithAddress,
  tProofRouterAddress: string,
  withdrawWalletAddress: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofRouter", signer);
  return await contractFactory
    .attach(tProofRouterAddress)
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("WITHDRAW_ROLE")),
      withdrawWalletAddress,
      { nonce: next_nonce }
    );
}
