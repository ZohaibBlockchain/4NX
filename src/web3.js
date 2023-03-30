import "ethers";
import { ethers } from "ethers";
const fContractInfo = require("./contractABI/factory.json");
const tContractInfo = require("./contractABI/token.json");
const smartContractInf = require("./contractABI/contractInf.json");
const InfType = require('./Types/type.js');

require('dotenv').config();

const account_from = {
  privateKey:
    process.env.PK,
};

// const providerRPC = {
//   matic: {
//     name: "Polygon Mainnet",
//     rpc: "https://polygon-rpc.com/",
//     chainId: 137, 
//   },
// };


const providerRPC = {
  bscTestnet: {
    name: "bscTestnet",
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545", // Insert your RPC URL here
    chainId: 97, //0x in hex,
  },
};
// 3. Create ethers provider
const provider = new ethers.providers.StaticJsonRpcProvider(
  providerRPC.bscTestnet.rpc,
  {
    chainId: providerRPC.bscTestnet.chainId,
    name: providerRPC.bscTestnet.name,
  }
);


export async function nonLeverageTradeManager(inf, tokenAddress) {
  //Nothing Right Now
}

async function arrangeAddresses(tokenAddresses) {
  let tokens = [];
  let token1 = new ethers.Contract(tokenAddresses[0], tContractInfo.tokenABI, provider);
  let token2 = new ethers.Contract(tokenAddresses[1], tContractInfo.tokenABI, provider);
  let name1 = await token1.name.call();
  name1 = name1.slice(-1);
  let name2 = await token2.name.call();
  name2 = name2.slice(-1);
  if (name1 === 'L') {
    tokens[0] = tokenAddresses[0];
  } else {
    tokens[1] = tokenAddresses[0];
  }
  if (name2 === 'S') {
    tokens[1] = tokenAddresses[1];
  } else {
    tokens[0] = tokenAddresses[1];
  }
  return tokens;
}

export async function LeverageTradeManager(inf, tokens) {
  try {
    const pk = account_from.privateKey.toString();
    let wallet = new ethers.Wallet(pk, provider);
    let tokenAddresses = await arrangeAddresses(tokens);
    let contract = new ethers.Contract(
      fContractInfo.factoryAddress,
      fContractInfo.factoryABI,
      wallet
    );
    let tx = await contract.tradeLeverage(tokenAddresses[0], tokenAddresses[1], inf.walletAddress, inf.tokenAmount * 1000000, getside(inf.side), inf.orderID);
    let receipt = await tx.wait();
    return receipt.logs[0].transactionHash;
  }
  catch (error) {
    console.log(error);
  }


}



function correctInf(inf) {


  if (inf[inf.length - 2] === '.') {
    return inf;
  } else {
    return inf + '.L'
  }
}



export async function getInstrument(inf) {
  try {
    inf.instrumentName = correctInf(inf.instrumentName);
    inf.tokenSymbol = correctInf(inf.tokenSymbol);
    let doubleAddresses = [];
    const contract = new ethers.Contract(fContractInfo.factoryAddress, fContractInfo.factoryABI, provider);
    let address1 = await contract.getAddress(inf.instrumentName);
    address1 = await createOrValidate(address1, inf, inf.instrumentName);
    let name2 = inf.instrumentName;
    let symbol = inf.tokenSymbol;
    name2 = name2.slice(0, -1) + flipChar(name2.slice(-1));
    symbol = symbol.slice(0, -1) + flipChar(symbol.slice(-1));
    console.log(name2, symbol);
    let address2 = await contract.getAddress(name2);
    address2 = await createOrValidate(address2, inf, name2);
    if (address1 != null && address2 != null) {
      doubleAddresses.push(address1);
      doubleAddresses.push(address2);
      return doubleAddresses;
    } else {
      throw 'Failed to create or fetch the address.';
    }
  } catch (error) {
    console.log(error);
    return 'retry';
  }
}




export async function createOrValidate(address, inf, name) {
  if (ethers.constants.AddressZero == address) {

    const pk = account_from.privateKey.toString();
    let wallet = new ethers.Wallet(pk, provider);
    let contract = new ethers.Contract(
      fContractInfo.factoryAddress,
      fContractInfo.factoryABI,
      wallet
    );

   let symbol= removeSubstrings(inf.tokenSymbol,substringsToRemove)
    symbol = truncateString(symbol);
    let tx = await contract.deployNewERC20Token(name, symbol, '6', inf.instrumentType, true);
    let receipt = await tx.wait();
    return receipt.logs[0].address;
  }
  else {
    return address;
  }
}





export function checkLeverageInstruments(type) {

  let _type = splitSymbol(type);
  for (let i = 0; i < _type.length; i++) {

    if (_type[i] == 'CFD' || _type[i] == 'FX') {

      return true;
    }

  }
  return false;
}




function splitSymbol(symbol) {
  return symbol.split(".");
}


function flipChar(char) {
  if (char == 'L')
    return 'S';
  else {
    return 'L';
  }
}

function getside(side) {
  if (side == 'SELL')
    return 0
  else
    return 1;
}

//-------------------------------------------Update v1.16.0




export async function getInstrumentAddress(symbol) {
  const pk = account_from.privateKey;
  let wallet = new ethers.Wallet(pk, provider);
  let contract = new ethers.Contract(
    smartContractInf.Factory.Address,
    smartContractInf.Factory.ABI,
    wallet
  );
  //Create new instrument token and then return address
  tokenAddress =  await contract.getAddress(symbol);
  if (ethers.constants.AddressZero == tokenAddress) {
    let nSymbol = symbol;
    if (nSymbol.length > 12) {
      nSymbol = nSymbol.slice(0, 12); // take the first 12 characters
    };
    let tx = await contract.deployNewERC20Token(symbol, nSymbol, '18');
    let receipt = await tx.wait();
    return receipt.logs[0].address;
  }
  else {
    return address;
  }
}

export async function SignTrade(inf) {
  try {
    let _token = await getInstrumentAddress(inf.symbol);
    let _blockRange = await (provider.getBlockNumber() + 5);//Trade will be valid for the next 5 block
    const _chainID = 1337;
    const _tradeID = Math.floor(Math.random() * (9999999 - 1111111 + 1) + min);
    const _inf = { name: '4NX', version: 1, chainId: _chainID, verifyingContract: smartContractInf.EIP712.Address, tradeID: _tradeID, price: inf.price, amount: inf.amount, blockRange: _blockRange, user: inf.user, token: _token };
    const signer = new ethers.Wallet(account_from.privateKey);
    const signature = await signer._signTypedData(InfType.domain(_inf), InfType.types, InfType.val(_inf));
    const { r, s, v } = ethers.utils.splitSignature(signature);
    console.log(`r: ${r}`);
    console.log(`s: ${s}`);
    console.log(`v: ${v}`);
    return { status: 'success', r: r, s: s, v: v, tradeID: _tradeID, price: inf.price, amount: inf.amount, blockRange: _blockRange, token: _token, type: _inf.type };
  }
  catch (err) {
    return { status: 'Failed', reason: err };
  }
}


let substringsToRemove = ["_SPOT", "CFD","FX","CRYPTO","CASH"];

function removeSubstrings(str, substrings) {
  substrings.forEach(substring => {
    str = str.replace(substring, '');
  });
  return str;
}
function truncateString(str) {
  if (str.length > 11) {
    return str.slice(0, 11) + '...';
  }
  return str;
}
