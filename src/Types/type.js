export function domain(inf) {
    let EIP712Domain = {
      name: inf.name,
      version: inf.version,
      chainId: inf.chainId,
      verifyingContract: inf.verifyingContract,
    };
    return EIP712Domain;
  }
  



export const types = {
    INF: [
        { name: 'tradeId', type: 'uint256' },
        { name: 'price', type: 'uint256' },
        { name: 'tradeAmount', type: 'uint256' },
        { name: 'blockRange', type: 'uint256'},
        { name: 'walletAddress', type: 'address' },
        { name: 'token', type: 'address' },
    ]
};

export function val(inf) {
    return {
      ...inf,
      tradeId: inf.tradeId,
      price: inf.price,
      tradeAmount: inf.tradeAmount,
      blockRange: inf.blockRange,
      walletAddress: inf.walletAddress,
      token: inf.token,
    };
  }


// export async function signMessage(inf) {
//     const privateKey = inf;
//     const signer = new ethers.Wallet(privateKey);
//     const signature = await signer._signTypedData(domain(inf), types, val(inf));
//     const { r, s, v } = ethers.utils.splitSignature(signature);
//     console.log(`r: ${r}`);
//     console.log(`s: ${s}`);
//     console.log(`v: ${v}`);
//     return {r:r,s:s,v:v};
// }