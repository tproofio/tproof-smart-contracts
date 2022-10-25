<h1 align="center">
  <a href="https://tproof.io"><img width="250" src="https://user-images.githubusercontent.com/12898752/197747462-83b0b651-88e9-4d96-bb15-882298138197.png" alt="tProof Logo" /></a>
</h1>

# tProof | Everlasting certifications

tProof is a tool to **generate everlasting evidence that a file exists at a given date** (proof of timestamp).

tProof works by publishing the hash of your file on a public blockchain, making the proof everlasting and with a 
single upfront cost (generation transaction). The proof, generated in the form of an NFT, lasts forever, while the NFT 
standard makes it easy for you to recover it, whenever you'll need it.

This repo contains all the Smart Contracts involved in the tProof ecosystem.

More details about tProof and it's project available on [tproof.io](https://tproof.io)

You can directly interact with deployed smart contracts through dApp on [app.tproof.io](https://app.tproof.io)

Current we have an active deployment on the following networks:
* Polygon Mainnet (coming 26th Oct 22)
* Ethereum Goerli (test)

Full documentation available on [docs.tproof.io](https://docs.tproof.io)

# How it works 🔍

At its core, a **SHA-256 checksum** is generated for each file that wants to be generated. The hash is sent to the smart 
contract to be included in the list of the proofs. As a result, an NFT is generated. The NFT contains the hash, as
well as other core information, such as the timestamp at which is has been created, a custom-name (optional) and others.

At the end of the process, all included in a single blockchain transaction, the user receives an NFT that represents the 
certification. 

We can list the **advantages** of adopting such a technology to certify the existence of a file at a given timestamp,
as follows:

✅ Everlasting proofs

✅ Single upfront cost

✅ Trustless, and transparent

✅ Open-source project

Find out more about tProof on our [website](https://tproof.io), and on the [project documentation](https://docs.tproof.io). 


# Clone and Install 📋

Make sure to clone the repo and install all the dependencies via

```shell
yarn install
```

## Deploy and Testing

This project has been developed with [Hardhat development environment](https://hardhat.org/)

⚠️ Before running any command, make sure to create a correct `.secrets.json` file in the main folder. 
You can find a `.secrets.example.json` file that you can copy.

To compile the contracts

```shell
npx hardhat compile
```

To run tests
```shell
npx hardhat test
```

To deploy
```shell
npx hardhat run scripts/Deployer/deploy.ts
```

More references about these commands can be found in [hardhat docs](https://hardhat.org/docs).
