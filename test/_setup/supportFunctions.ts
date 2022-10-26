import {BigNumber} from "ethers";

/**
 * Given a NftNumber and a chainId, returns the full tokenId
 * @param {number} nftNum - the nft number
 * @param {number} chainId - id of the chain where it's deployed
 * @param {string} [returnType="bignumber"] - if the type returned should be a string or a bignumber
 * @return {string | BigNumber}
 */
export const fromNftNumToTokenId = (nftNum: number, chainId: number, returnType: "string" | "bignumber" = "bignumber"): string | BigNumber => {
  let res = BigNumber.from(10).pow(50).add(nftNum).add(BigNumber.from(10).pow(50).mul(chainId-1));
  if (returnType === "bignumber") return res;
  else return res.toString();
}
