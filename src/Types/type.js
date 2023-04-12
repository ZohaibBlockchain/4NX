import { providers, Wallet, utils } from 'ethers';

export async function signData(data) {
  const provider = new providers.JsonRpcProvider();
  const signer = new Wallet(data.privateKey, provider);
  const domain = {
    name: data.name,
    version: data.version,
    chainId: data.chainId, // Replace with the correct chainId for your network
    verifyingContract: data.verifyingContract, // Replace with the address of your contract
  };

  const types = {
    INF: [
      { name: 'tradeId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'tradeAmount', type: 'uint256' },
      { name: 'blockRange', type: 'uint256' },
      { name: 'walletAddress', type: 'address' },
      { name: 'token', type: 'address' },
    ],
  };

  const value = {
    tradeId: data.tradeId,
    price: data.price,
    tradeAmount: data.tradeAmount,
    blockRange: data.blockRange,
    walletAddress: data.walletAddress,
    token: data.token,
  };
 
  const signature = await signer._signTypedData(domain, types, value);
  const { r, s, v } = utils.splitSignature(signature);
  return { r, s, v };
}