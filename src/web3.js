import "ethers";
import { ethers } from "ethers";
const fContractInfo = require("./contractABI/factory.json");
const tContractInfo = require("./contractABI/token.json");
const smartContractInf = require("./contractABI/contractInf.json");
const InfType = require('./Types/type.js');
import {createSymbol} from "../helperFx";
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






export async function getInstrument(inf) {
  try {
    let name = inf.instrumentName.toUpperCase() + '.L.X';

    let symbol = createSymbol(inf.tokenSymbol, 'L');

    let tokensData = [];

    const contract = new ethers.Contract(fContractInfo.factoryAddress, fContractInfo.factoryABI, provider);

    let address1 = await contract.getAddress(name);

    address1 = await createOrValidate(address1, symbol, name);
    
    let name2 = inf.instrumentName.toUpperCase() + '.S.X';

    let symbol2 = createSymbol(inf.tokenSymbol, 'S');

    let address2 = await contract.getAddress(name2);

    address2 = await createOrValidate(address2, symbol2, name2);

    if (address1 != null && address2 != null) {
      tokensData.push(symbol);
      tokensData.push(address1);
      tokensData.push(symbol2);
      tokensData.push(address2);
      return tokensData;
    } else {
      throw 'Failed to create or fetch the address.';
    }
  } catch (error) {
    console.log(error);
    return 'retry';
  }
}




export async function createOrValidate(address, symbol, name) {
  if (ethers.constants.AddressZero == address) {

    const pk = account_from.privateKey.toString();
    let wallet = new ethers.Wallet(pk, provider);
    let contract = new ethers.Contract(
      fContractInfo.factoryAddress,
      fContractInfo.factoryABI,
      wallet
    );

    let tx = await contract.deployNewERC20Token(name, symbol, '6', 'leveraged', true);
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
  tokenAddress = await contract.getAddress(symbol+'.X');
  if (ethers.constants.AddressZero == tokenAddress) {
    let tx = await contract.deployNewERC20Token(symbol+'.X', createSymbol(symbol,'L'), '18');//here createSymbol 2nd prams is extra 
    let receipt = await tx.wait();
    return receipt.logs[0].address;
  }
  else {
    return tokenAddress;
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




