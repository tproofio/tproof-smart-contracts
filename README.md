<div style="width: 100%; display: flex; justify-content: center; margin-top: 32px; margin-bottom: 32px">
    <div style="width: 240px; background: white; border-radius: 10px; padding: 8px">
        <img src="https://tproof.io/images/tProof-Logo-p-500.png"/>
    </div>
</div>

# tProof | Everlasting certifications

tProof is a tool to generate everlasting evidence that a file exists at a given date (proof of timestamp).

tProof takes care of publishing the hash of your file on a public blockchain, making the proof everlasting and with a 
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

[ TBD ]

We can list the **advantages** as follows:

✅ Everlasting proofs

✅ Single upfront cost

✅ Trustless, and transparent

✅ Open-source project


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
