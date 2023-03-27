// Require Mongoose
const mongoose = require("mongoose");

// Define a schema
const Schema = mongoose.Schema;

const user = new Schema({
  userWallet: {type:String,unique: true},
  Instruments:{type: [Object]}
});



const token = new Schema({
  name: String,
  instrumentType:String,
  address: String,
  iconuri: String
 
});

const defaultIcon = new Schema({
iconuri: {type:String ,required:true}
});




const trade = new Schema({
  walletAddress: {type:String ,required:true},
  tokenAmount: {type:Number ,required:true},
  tokenSymbol:{type:String ,required:true},
  instrumentType:{type:String ,required:true},
  instrumentName:{type:String ,required:true},
  side:{type:String ,required:true},
  contractMultiplier:{type:Number ,required:true},
  transactionHash:{type:String ,required:true},
  orderID:{type:String ,required:true},
  execID:{type:String ,required:true},
  time : { type : Date, default: Date.now }
});


export const TradeModel = mongoose.model("Trade", trade);
export const defaultIconModel = mongoose.model("icon", defaultIcon);0
export const TokenModel = mongoose.model("Token", token);
export const UserModel = mongoose.model("User", user);//First is the Name of the collection  2nd is the model