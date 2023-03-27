import { parse } from "fixparserjs";


const garbage = ['_SPOT', ''];
const CFDInstruments = ["INDEX", "EQ", "CRYPTO", "FX", "COMMODITY"];

export function getNames(dataArr) {
    let NamesArr = [];
    for (let i = 0; i < dataArr.length; i++) {
        NamesArr[i] = parse(dataArr[i], '^');
        let Data = NamesArr[i].Body;
        NamesArr[i] = NamesArr[i].Body.Symbol;
        let v = (detectInstrument(NamesArr[i]));
        NamesArr[i] = { Name: updateName(Data.Symbol, Data.Side, v.type), Symbol: v.name, type: v.type, fullInfo: Data};
    }
    return NamesArr;
}



export function detectInstrument(InstrumentSymbol) {

    let Instrument = splitSymbol(InstrumentSymbol);
    switch (Instrument[0]) {
        case 'CFD':
            for (let i = 0; i < CFDInstruments.length; i++) {
                if (CFDInstruments[i] == Instrument[1]) {
                    if (Instrument.length == 4) {
                        let name = Instrument[2] + '.' + Instrument[3];
                        return { name: name, type: Instrument[0] + '.' + Instrument[1] };
                    }
                    else if (Instrument.length == 3) {
                        let name = Instrument[2];
                        return { name: name, type: Instrument[0] + '.' + Instrument[1] };
                    }
                    else if (Instrument.length == 2) {
                        let name = Instrument[1];
                        return { name: name, type: Instrument[0] };
                    }
                }
            }

            if (Instrument.length == 4) {
                let name = Instrument[2] + '.' + Instrument[3];
                return { name: name, type: Instrument[0] + '.' + Instrument[1] };
            }
            else if (Instrument.length == 3) {
                let name = Instrument[2];
                return { name: name, type: Instrument[0] + '.' + Instrument[1] };
            }
            else if (Instrument.length == 2) {
                let name = Instrument[1];
                return { name: name, type: Instrument[0] };
            }

            break;
        case 'EQ':
            if (Instrument.length == 3) {
                let name = Instrument[1] + '.' + Instrument[2];
                return { name: name, type: Instrument[0] };;
            } else {
                let name = Instrument[1];
                return { name: name, type: Instrument[0] };
            }

            break;
        case 'CRYPTO':
            {
                let name = Instrument[1];
                return { name: name, type: Instrument[0] };
            }
            break;
        case 'FX':
            {
                let name = Instrument[1];
                return { name: name, type: Instrument[0] };
            }
            break;
        default:
            break;
    }
}





function splitSymbol(symbol) {
    return symbol.split(".");
}






function updateName(name, side, type) {
    garbage.forEach(element => {
        name = name.replace(element, '');
    });
    if (checkLeverageInstruments(type)) {
        if (side == 'BUY') {
            name += '.L';
        } else {
            name += '.S';
        }
    } else {
        //Do nothing
    }
    return name
}




function checkLeverageInstruments(type) {

    let _type = splitSymbol(type);
    for (let i = 0; i < _type.length; i++) {

        if (_type[i] == 'CFD' || _type[i] == 'FX') {

            return true;
        }
    }
    return false;
}



export function checkType(symbol) {
    let arr = splitSymbol(symbol);
    if (arr[0] == 'CFD' || arr[0] == 'FX') {
        return true;
    } else {
        return false;
    }
}

