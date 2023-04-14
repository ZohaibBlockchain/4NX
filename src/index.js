//Beta version 1.1 of W3API...
import { SignTrade, tradeListener } from "./web3";
import express from "express";
const bodyParser = require("body-parser");
import { ExeTrade } from "./db/db";
const mongoose = require("mongoose");
import { router } from "./routes/routes";
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');
require("dotenv").config();
let counter = 0;
let Approvedclients = [];




Errorlogger('Init');
WSSserver();
tradeListener(Approvedclients);
function WSSserver() {
  try {
    const server = https.createServer({
      cert: fs.readFileSync(__dirname + '/certificates/cert.pem'),
      key: fs.readFileSync(__dirname + '/certificates/key.pem')
    });
    const wss = new WebSocket.Server({ server });
    wss.on('connection', (ws) => {
      ws.id__ = stringToHash(ws.toString());
      console.log('Client connected');
      InitClient(ws);
    });
    server.listen(process.env.WSPORT, () => {
      console.log('Server started on port 9999');
    });
  } catch (error) {
    Errorlogger(error.message);
  }
}

const ip = require("ip");
const ipAddress = ip.address();

mongoose
  .connect(process.env.DBKEY, { useNewUrlParser: true })
  .then(() => {
    //-----------Express----------
    const envport = process.env.SERVERPORT;
    var app = express();

    app.use(router);
    app
      .listen(envport, function () {
        console.log(`The SERVER HAS STARTED ON PORT: ${envport}`);
        console.log(ipAddress);
        w3Engine();
      })
      .on("error", function (err) {
        console.log(err);
        process.once("SIGUSR2", function () {
          process.kill(process.pid, "SIGUSR2");
        });
        process.on("SIGINT", function () {
          // this is only called on ctrl+c, not restart
          process.kill(process.pid, "SIGINT");
        });
      });
    //-----------Express----------
  });

process.on('uncaughtException', function (err) {
  Errorlogger(err.message);
  console.log("...");
});

process.on('TypeError', function (err) {
  Errorlogger(err.message);
  console.log("...");

});


//-----------functions--------
const updateSpeed = 20000;
async function w3Engine() {
  let e = await ExeTrade();
  console.log(e);




  setTimeout(() => { w3Engine(); }, updateSpeed);
}
//---------functions--------
//---------ExecutionBlock------
//---------ExecutionBlock------



async function msgHandler(msg, ws) {
  console.log(ws.id__);
  if (checkClient(ws)) {
    switch (msg.messageType) {
      case 'auth': {
        ws.send(JSON.stringify({ messageType: 'auth', message: 'Already Approved' }));
        break;
      }
      case 'tokenInfo': {
        console.log('Needs to send token Information');
        break;
      }
      case 'signOrder': {
        let res = await SignTrade(msg.message);
        ws.send(JSON.stringify({ messageType: 'signOrder', message: res }));
        break;
      }
      default:
        ws.send(JSON.stringify({ messageType: 'log', message: 'Invalid Request!' }));
        break;
    }
  } else {
    switch (msg.messageType) {
      case 'auth': {
        if (msg.message == process.env.CTID) {
          Approvedclients.push(ws);
          // wsClients.push(ws);
          ws.send(JSON.stringify({ messageType: 'auth', message: 'Approved' }));
          return;
        } else {
          console.log('!Client Fired.');
          ws.send(JSON.stringify({ messageType: 'auth', message: 'Invalid key!' }));
          ws.close();
        }
        break;
      }
      default:
        console.log('!Client Fired.');
        ws.send(JSON.stringify({ messageType: 'log', message: 'unauthorized connection detected.!' }));
        ws.close();
        break;
    }
  }
}



function InitClient(ws) {
  ws.send(JSON.stringify({ messageType: 'log', message: 'welcome! to the 4NX server v1.16.0.' }));
  ws.send(JSON.stringify({ messageType: 'log', message: 'Please provide connection key in order to use the service.' }));
  ws.on('message', (message) => {
    if (isJSON(message)) {
      let msg = JSON.parse(message);
      msgHandler(msg, ws);
    } else {
      ws.send(JSON.stringify({ messageType: 'log', message: 'Please use Valid Format for interaction.' }));
      ws.close();
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    removeClient(ws); //Remove from array...
  });
}



function checkClient(ws) {
  let res = false;
  Approvedclients.forEach(ws => {
    if (ws.id__.toString() == ws.id__.toString()) {
      res = true;
    }
  });
  return res;
}



function removeClient(ws) {
  for (let i = 0; i < Approvedclients.length; i++) {
    if (Approvedclients[i].id__.toString() == ws.id__.toString()) {
      Approvedclients.splice(i, 1);
    }
  }
}



function isJSON(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function Errorlogger(error) {
  if (counter == 0) {
    fs.writeFile(__dirname + '/logs/logs.txt', 'Application Error Logs \n\n\n', function (err) {
      if (err) throw err;
      console.log('Logs cleaned.');
    });
  } else {
    fs.appendFile((__dirname + '/logs/logs.txt'), `${counter}: ` + error + '\n', function (err) {
      if (err) console.log('Unable to write error on file and the error is : ', err.message);
      console.log('Data appended to file.');
    });
  }
  counter++;
  console.log(error);
}


function stringToHash(str) {
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return hash;
}


