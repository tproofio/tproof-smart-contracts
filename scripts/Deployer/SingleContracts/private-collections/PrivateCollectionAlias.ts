import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {TProofPrivateCollectionAlias} from "../../../../typechain-types";

/**
 * Deploy an instance of tProofPrivateCollectionAlias
 * @param signer - who's going to sign the transaction
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function deployTProofPrivateCollectionAlias(
  signer: SignerWithAddress,
  nonce: number = -1
): Promise<TProofPrivateCollectionAlias> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofPrivateCollectionAlias", signer);
  const contract = await contractFactory.deploy({ nonce: next_nonce }) as TProofPrivateCollectionAlias;
  await contract.deployed();
  return contract;
}

/**
 * Adds the ALIAS_EDITOR_ROLE role to the given address
 * @param signer - who's going to sign the transaction
 * @param tProofPrivateCollectionAliasAddress - address of the deployed contract
 * @param walletAddress - address that will get the role
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function privateCollectionAlias_setAliasEditorRole(
  signer: SignerWithAddress,
  tProofPrivateCollectionAliasAddress: string,
  walletAddress: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofPrivateCollectionAlias", signer);
  return await contractFactory
    .attach(tProofPrivateCollectionAliasAddress)
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ALIAS_EDITOR_ROLE")),
      walletAddress,
      { nonce: next_nonce }
    );
}
