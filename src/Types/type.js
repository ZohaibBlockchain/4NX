
export function domain(inf)
{
 return EIP712Domain = {
    name: inf.name,
    version: inf.version,
    chainId: inf.chainId,
    verifyingContract: inf.verifyingContract, // Address of the smart contract that will verify the signature
};
}



export const types = {
    INF: [
        { name: 'tradeID', type: 'uint256' },
        { name: 'price', type: 'uint256' },
        { name: 'amount', type: 'uint256' },
        { name: 'blockRange', type: 'uint256'},
        { name: 'user', type: 'address' },
        { name: 'token', type: 'address' },
    ]
};



export function val(inf)
{
   return inf = {
        tradeID: inf.tradeID,
        price:inf.price,
        amount:inf.amount,
        blockRange:inf.blockRange,
        user:inf.user,
        token:inf.token
    };
}



export async function signMessage(inf) {
    const privateKey = inf;
    const signer = new ethers.Wallet(privateKey);
    const signature = await signer._signTypedData(domain(inf), types, val(inf));
    const { r, s, v } = ethers.utils.splitSignature(signature);
    console.log(`r: ${r}`);
    console.log(`s: ${s}`);
    console.log(`v: ${v}`);
    return {r:r,s:s,v:v};
}