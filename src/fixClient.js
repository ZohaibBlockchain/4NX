import { readFileSync } from 'fs';
import { EncryptMethod, Field, Fields, FIXParser, Message, Messages, OrderTypes, Side, TimeInForce } from 'free-fx';
let counter = 0;
    const fixParser = new FIXParser();
    const SENDER = 'PRINCIPAL_553_1';
    const TARGET = 'CLIENT_STP_771_1';
    const Password = ';z7;?2Hv';

    //Deprecated
// export function fixClient(registerTrade){
    
//     fixParser.connect({
//         host: 'platform.unity.finance',
//         port: 21005,
//         protocol: 'tls-tcp',
//         ConnectionType: 'initiator',
//         sender: SENDER,
//         target: TARGET,
//         fixVersion: 'FIX.4.4',
//         tlsUseSNI: false, // Set to true to use TLS SNI connection, requires host to be FQDN
//         logging: false,
//         // tlsCert: readFileSync('cert.pem'),
//         onOpen: () => {
//             console.log('Open');
//             sendLogon();
//         },
//         onMessage: async (message) => {
//             counter++;
//             const msg = message.encode('|');
//             const parsedJSON = parseFixMessage(msg);
    
//             if (parsedJSON['448'] != undefined && parsedJSON['448'].length === 42 && checkInstrument(parsedJSON['55'])) {
//                 const tradeInf = { instrumentName: 'LEVERAGED.' + parsedJSON['55'], instrumentType: 'LEVERAGED', tokenSymbol: parsedJSON['55'], walletAddress: parsedJSON['448'], tokenAmount: parsedJSON['38'], side: (parsedJSON['54'] == 1) ? 'BUY' : 'SELL', orderID: parsedJSON['37'], ExecID: parsedJSON['17'], ContractMultiplier: '0' }
//                 let trade = await registerTrade(tradeInf);
//                 console.log(tradeInf,trade);
//             } else {
//                 console.log('Nothing');
//             }
//         },
//         onClose: () => console.log('Disconnected'),
//     });
    




    
// }

export function fixClient(registerTrade) {

    const CONNECT_PARAMS = {
        host: 'platform.unity.finance',
        port: 21005,
        protocol: 'tls-tcp',
        ConnectionType: 'initiator',
        sender: SENDER,
        target: TARGET,
        fixVersion: 'FIX.4.4',
        tlsUseSNI: false, // Set to true to use TLS SNI connection, requires host to be FQDN
        logging: false,
        // tlsCert: readFileSync('cert.pem'),
        onOpen: () => {
            console.log('Open');
            sendLogon();
        },
        onMessage: async (message) => {
            counter++;
            const msg = message.encode('|');
            const parsedJSON = parseFixMessage(msg);
            console.log(parsedJSON)

            if (parsedJSON['448'] != undefined && parsedJSON['448'].length === 42 && checkInstrument(parsedJSON['55'])) {
                const tradeInf = { instrumentName: 'LEVERAGED.' + parsedJSON['55'], instrumentType: 'LEVERAGED', tokenSymbol: parsedJSON['55'], walletAddress: parsedJSON['448'], tokenAmount: parsedJSON['38'], side: (parsedJSON['54'] == 1) ? 'BUY' : 'SELL', orderID: parsedJSON['37'], ExecID: parsedJSON['17'], ContractMultiplier: '0' }
                let trade = await registerTrade(tradeInf);
                console.log(tradeInf);
            } else {
                console.log('Nothing');
            }
        },
        onClose: () => {
            console.log('Disconnected');
            setTimeout(() => {
                console.log('Reconnecting...');
                fixParser.connect(CONNECT_PARAMS);
            }, 1000);
        },
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