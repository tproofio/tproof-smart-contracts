import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Contract} from "ethers";

/**
 * Deploy an instance of Hash Regsitry
 * @param signer - who's going to sign the transaction
 * @param tProofNFTFactoryAddress - address of the NFT Factory contract on chain
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function deployHashRegistry(signer: SignerWithAddress, tProofNFTFactoryAddress: string, nonce: number = -1): Promise<Contract> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofHashRegistry", signer);
  return await contractFactory.deploy(
    tProofNFTFactoryAddress,
    { nonce: next_nonce }
  );

}

/**
 * Adds the CERTIFICATION_MANAGER_ROLE role to the given address
 * @param signer - who's going to sign the transaction
 * @param tProofHashRegistryAddress - address of the deployed hash registry
 * @param certificationManagerWalletAddress - address that will get the role
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function hashRegistry_setCertificationManagerRole(
  signer: SignerWithAddress,
  tProofHashRegistryAddress: string,
  certificationManagerWalletAddress: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofHashRegistry", signer);
  return await contractFactory
    .attach(tProofHashRegistryAddress)
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CERTIFICATION_MANAGER_ROLE")),
      certificationManagerWalletAddress,
      { nonce: next_nonce }
    );
}

/**
 * Adds the CERTIFICATION_MANAGER_ROLE role to the given address
 * @param signer - who's going to sign the transaction
 * @param tProofHashRegistryAddress - address of the deployed hash registry
 * @param urlVerifierRouterAddress - address that will get the role
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function hashRegistry_setUrlVerifierRouterRole(
  signer: SignerWithAddress,
  tProofHashRegistryAddress: string,
  urlVerifierRouterAddress: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofHashRegistry", signer);
  return await contractFactory
    .attach(tProofHashRegistryAddress)
    .grantRole(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("URL_VERIFIER_ROUTER_ROLE")),
      urlVerifierRouterAddress,
      { nonce: next_nonce }
    );
}

/**
 * Stores the addres of the working urlVerifierRouter
 * @param signer - who's going to sign the transaction
 * @param tProofHashRegistryAddress - address of the deployed hash registry
 * @param urlVerifierRouterAddress - address that will get the role
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function hashRegistry_setUrlVerifierRouterAddress(
  signer: SignerWithAddress,
  tProofHashRegistryAddress: string,
  urlVerifierRouterAddress: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofHashRegistry", signer);
  return await contractFactory
    .attach(tProofHashRegistryAddress)
    .setUrlVerifierRouter(
      urlVerifierRouterAddress,
      { nonce: next_nonce }
    );
}

/**
 * Adds a storage type to the contract
 * @param signer - who's going to sign the transaction
 * @param tProofHashRegistryAddress - address of the deployed hash registry
 * @param storageContractAddress - address of the contract that manages the storage
 * @param storageName - name of the storage
 * @param [nonce] - if we want to pass a nonce, rather than having the code to evaluate it
 */
export async function hashRegistry_addStorageType(
  signer: SignerWithAddress,
  tProofHashRegistryAddress: string,
  storageContractAddress: string,
  storageName: string,
  nonce: number = -1
): Promise<void> {
  let next_nonce = nonce >= 0 ? nonce : await signer.getTransactionCount();
  const contractFactory = await ethers.getContractFactory("tProofHashRegistry", signer);
  return await contractFactory
    .attach(tProofHashRegistryAddress)
    .addStorageTypeManager(
      storageContractAddress,
      storageName,
      { nonce: next_nonce }
    );
}
