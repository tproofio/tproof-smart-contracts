import {ethers} from "ethers";

export const CHAIN_CONSTANTS = {
  5: {
    JOD_ID : "f33949491d4a45948c3291e0efe6c6fe",
    ORACLE_ADDRESS: "0x6e3fC0DD7c85dE678B5494F2b7daDa7232a1e0Cb",
    LINK_ERC20_ADDRESS: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    WITHDRAW_WALLET_ADDRESS: "0x68C85B3eA70C7cAa14Ad0fc52d3A7d03a63Ef64D",
    PREPAID_TPROOF_VALIDITY_SECS: 86400*14,
    INITIAL_MINT_PRICE: ethers.utils.parseEther("0.01"),
    INITIAL_VERIFICATION_PRICE: ethers.utils.parseEther("0.02")
  },
  1337: {
    JOD_ID : "f33949491d4a45948c3291e0efe6c6fe",
    ORACLE_ADDRESS: "0x6e3fC0DD7c85dE678B5494F2b7daDa7232a1e0Cb",
    LINK_ERC20_ADDRESS: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    WITHDRAW_WALLET_ADDRESS: "0x68C85B3eA70C7cAa14Ad0fc52d3A7d03a63Ef64D",
    PREPAID_TPROOF_VALIDITY_SECS: 86400*14,
    INITIAL_MINT_PRICE: ethers.utils.parseEther("0.1"),
    INITIAL_VERIFICATION_PRICE: ethers.utils.parseEther("0.2")
  }
}
