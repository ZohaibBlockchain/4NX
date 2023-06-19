import "ethers";
import { ethers } from "ethers";
const fContractInfo = require("./contractABI/factory.json");
const tContractInfo = require("./contractABI/token.json");
const smartContractInf = require("./contractABI/contractInf.json");
const InfType = require('./Types/type.js');
import { createSymbol, createDeliverableSymbol } from "../helperFx";
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
  matic: {
    name: "matic",
    rpc: "https://polygon-rpc.com/", // Insert your RPC URL here
    chainId: 137, //0x in hex,
  },
};

// 3. Create ethers provider
const provider = new ethers.providers.StaticJsonRpcProvider(
  providerRPC.matic.rpc,
  {
    chainId: providerRPC.matic.chainId,
    name: providerRPC.matic.name,
  }
);


export async function nonLeverageTradeManager(inf, tokenAddress) {
  //Nothing Right Now
}



export async function LeverageTradeManager(inf, tokens) {
  try {
    const pk = account_from.privateKey.toString();
    let wallet = new ethers.Wallet(pk, provider);
    // let tokenAddresses = await arrangeAddresses(tokens);
    let contract = new ethers.Contract(
      fContractInfo.factoryAddress,
      fContractInfo.factoryABI,
      wallet
    );
    let tx = await contract.tradeLeverage(tokens[1], tokens[3], inf.walletAddress, inf.tokenAmount * 1000000, getside(inf.side), inf.orderID);
    let receipt = await tx.wait();
    return { res: "Filled", tx: receipt.logs[0].transactionHash };
  }
  catch (error) {
    return { res: "Failed" };
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

//-------------------------------------------Update v1.17.0


export async function getInstrumentAddress(symbol) {
  const pk = account_from.privateKey;
  let wallet = new ethers.Wallet(pk, provider);
  let contract = new ethers.Contract(
    smartContractInf.Factory.Address,
    smartContractInf.Factory.ABI,
    wallet
  );
  let _symbol = createDeliverableSymbol(symbol);//here createSymbol 2nd prams is extra 
  let _name = symbol + '.X';
  let tokenAddress = await contract.getAddress(_name);
  console.log('Check-1:',_name,tokenAddress);
  if (ethers.constants.AddressZero == tokenAddress) {
    let tx = await contract.deployNewERC20Token(_name, _symbol, '18');
    let receipt = await tx.wait();
    return { symbol: _symbol, address: receipt.logs[0].address }
  }
  else {
    return { symbol: _symbol, address: tokenAddress };
  }
}


const blockRange__ = 150;//It may change while testing the polygon network contracts
const _chainID = 137;//It may also change when we change network
const _name = '4NXDAPP';
const _version = '1';

export async function SignTrade(inf) {
  try {
    let _token = await getInstrumentAddress(inf.symbol);
    let _blockRange = await (provider.getBlockNumber()) + blockRange__;//Trade will be valid for the next 5 block
    const _tradeId = inf.orderId;
    let _price = ethers.BigNumber.from(ethers.utils.parseEther(inf.price.toString())._hex).toString();
    let _tradeAmount = ethers.BigNumber.from(ethers.utils.parseEther(inf.tradeAmount.toString())._hex).toString()
    const _inf = { name: _name, version: _version, chainId: _chainID, verifyingContract: smartContractInf.EIP712.Address, tradeId: _tradeId, price: _price, tradeAmount: _tradeAmount, blockRange: _blockRange, walletAddress: inf.walletAddress, token: _token.address, privateKey: account_from.privateKey };
    const { r, s, v } = await InfType.signData(_inf);
    console.log(`r: ${r}`);
    console.log(`s: ${s}`);
    console.log(`v: ${v}`);
    return { status: 'Approved', r: r, s: s, v: v, orderId: _tradeId, price: _price, tradeAmount: _tradeAmount, blockRange: _blockRange, token: _token.address, side: inf.side, factoryAddress: smartContractInf.Factory.Address, factoryAbi: smartContractInf.Factory.ABI, tokenAbi: smartContractInf.USDX.ABI };
  }
  catch (err) {
    console.log(err);
    return { status: 'Failed',orderId:inf.orderId ,reason: err };
  }
}



export async function tradeListener(wsClients) {
  const pk = account_from.privateKey;
  let wallet = new ethers.Wallet(pk, provider);
  let contract = new ethers.Contract(
    smartContractInf.Factory.Address,
    smartContractInf.Factory.ABI,
    wallet
  );

  contract.on("trade", async (tradeId, price, tradeAmount, blockRange, walletAddress, token, side) => {
    // Do something with the event data
    console.log(`New trade event received: tradeId=${tradeId}, price=${price}, tradeAmount=${tradeAmount}, blockRange=${blockRange}, walletAddress=${walletAddress}, token=${token}, side=${side}`);

    let tokenContract = new ethers.Contract(
      token,
      tContractInfo.tokenABI,
      wallet
    );
    let symbol = await tokenContract.name();
    symbol = symbol.substring(0, symbol.length - 2);
    const tradeEvent = {
      tradeId: ethers.BigNumber.from(tradeId).toString(),
      price: ethers.utils.formatEther(ethers.BigNumber.from(price).toString()),
      tradeAmount: ethers.utils.formatEther(ethers.BigNumber.from(tradeAmount).toString()),
      blockRange: ethers.BigNumber.from(blockRange).toString(),
      walletAddress: walletAddress,
      // token: token,
      side: (side === 1) ? 'BUY' : 'SELL',
      instrument:symbol
    };
    wsClients.forEach(client => {
      console.log(tradeEvent);
      client.send(JSON.stringify({ messageType: 'tradeConfirm', message: tradeEvent }));
    });
  });


}