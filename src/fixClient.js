import { readFileSync } from 'fs';
import { EncryptMethod, Field, Fields, FIXParser, Message, Messages, OrderTypes, Side, TimeInForce } from 'free-fx';
require("dotenv").config();



    let counter = 0;
    const fixParser = new FIXParser();
    const SENDER = process.env.FIX_SENDER;
    const TARGET = process.env.FIX_TARGET;
    const Password = process.env.FIX_PASSWORD;

    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 10000000; // Maximum number of reconnect attempts
    const RECONNECT_INTERVAL = 100; // Initial reconnect interval in milliseconds
    


export function fixClient(registerTrade) {

    const CONNECT_PARAMS = {
        host: 'platform.unity.finance',
        port: 21005,
        protocol: 'tls-tcp',
        ConnectionType: 'initiator',
        sender: SENDER,
        target: TARGET,
        fixVersion: 'FIX.4.4',
        tlsUseSNI: false,
        logging: false,
        // tlsCert: readFileSync('cert.pem'),
        onOpen: () => {
            console.log('Open');
            sendLogon();
            reconnectAttempts = 0;
        },
        onMessage: async (message) => {
            counter++;
            const msg = message.encode('|');
            const parsedJSON = parseFixMessage(msg);
            // console.log(parsedJSON)

            if (parsedJSON['448'] != undefined && parsedJSON['448'].length === 42 && checkInstrument(parsedJSON['55'])) {
                const tradeInf = { instrumentName: 'LEVERAGED.' + parsedJSON['55'], instrumentType: 'LEVERAGED', tokenSymbol: parsedJSON['55'], walletAddress: parsedJSON['448'], tokenAmount: parsedJSON['38'], side: (parsedJSON['54'] == 1) ? 'BUY' : 'SELL', orderID: parsedJSON['37'], ExecID: parsedJSON['17'], ContractMultiplier: '0' }
                let trade = await registerTrade(tradeInf);
                console.log(tradeInf);
            } else {
                // console.log('Nothing');
            }
        },
        onClose: () => handleDisconnect(CONNECT_PARAMS),
    };
    fixParser.connect(CONNECT_PARAMS);
}
const sendLogon = () => {
    const logon = fixParser.createMessage(
        new Field(Fields.MsgType, Messages.Logon),
        new Field(Fields.MsgSeqNum, fixParser.getNextTargetMsgSeqNum()),
        new Field(Fields.SenderCompID, SENDER),
        new Field(Fields.SendingTime, fixParser.getTimestamp()),
        new Field(Fields.TargetCompID, TARGET),
        new Field(Fields.EncryptMethod, EncryptMethod.None),
        new Field(Fields.ResetSeqNumFlag, 'Y'),
        new Field(Fields.Password, Password),
        new Field(Fields.HeartBtInt, 30),
    );
    fixParser.send(logon);
};

function parseFixMessage(fixMessage) {
    const fields = fixMessage.split('|');
    const result = {};

    fields.forEach(field => {
        const [tag, value] = field.split('=');
        result[tag] = value;
    });

    return result;
}

function checkInstrument(symbol) {
    let _type = symbol.split(".")
    for (let i = 0; i < _type.length; i++) {

        if (_type[i] == 'CFD' || _type[i] == 'FX' || _type[i] == 'FU') {
            return true;
        }
    }
    return false;
}

const handleDisconnect = (CONNECT_PARAMS) => {
    console.log('Disconnected');
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => {
            console.log('Reconnecting...');
            try {
                fixParser.connect(CONNECT_PARAMS);
                reconnectAttempts++;
            } catch (error) {
                console.error('Reconnect failed:', error);
            }
        }, RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts));
    } else {
        console.log('Max reconnect attempts reached. Stopping reconnection attempts.');
    }
};
