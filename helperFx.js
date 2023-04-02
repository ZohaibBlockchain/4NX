import { parse } from "fixparserjs";

let garbage = ["_SPOT", "CFD", "FX", "CRYPTO", "CASH", "EQ","INDEX","COMMODITY","deliverable", "leveraged"];



export function getNames(dataArr) {
        let Data = parse(dataArr[i], '^').Body;
        let _name = (Data.Side == "BUY")?Data.Name += '.L.X':Data.Name += '.S.X';
        let _symbol = createSymbol(Data.Symbol,(Data.Side === 'BUY')?"L":"S")
        NamesArr[i] = { Name: _name, Symbol: _symbol, type: 'leveraged', fullInfo: Data };
    return NamesArr;
}





function splitSymbol(symbol) {
    return symbol.split(".");
}






function updateName(name, side) {
    if (side == 'BUY') {
        name += '.L.X';
    } else {
        name += '.S.X';
    }
    return name;
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



export function createSymbol(symbol, side) {
    let symbolArr = symbol.split(".");
    if (symbolArr[0] == 'deliverable') {
        const newSymbolArray = symbolArr.filter(_str => !garbage.includes(_str));
        if (countStringLengths(newSymbolArray) <= 8) {
            symbol = newSymbolArray[0] + "." + newSymbolArray.slice(1).join(""); //Now <=9 digits here string
            if (symbol.slice(-1) === ".") {
                return symbol.toUpperCase() + 'X';
            } else {
                return symbol.toUpperCase() + '.X';
            }
        }
        else {
            symbol = newSymbolArray[0] + ".";
            if (symbol.length <= 9) {
                if (symbol.slice(-1) === ".") {
                    return symbol.toUpperCase() + 'X';
                } else {
                    return symbol.toUpperCase() + '.X';
                }
            }
            else {
                symbol = symbol.slice(0, 9);
                if (symbol.slice(-1) === ".") {
                    return symbol.toUpperCase() + 'X';
                } else {
                    return symbol.toUpperCase() + '.X';
                }
            }
        }
    }
    else {
        const newSymbolArray = symbolArr.filter(_str => !garbage.includes(_str));
        if (countStringLengths(newSymbolArray) <= 6) {
            symbol = newSymbolArray[0] + "." + newSymbolArray.slice(1).join("");//Now <=7 digits here string
            if (symbol.slice(-1) === ".") {
                return symbol.toUpperCase() + side + '.X';
            } else {
                return symbol.toUpperCase() + '.' + side + '.X';
            }
        }
        else {
            symbol = newSymbolArray[0] + ".";
            symbol = symbol.slice(0, 7);
            if (symbol.slice(-1) === ".") {
                return symbol.toUpperCase() + side + '.X';
            } else {
                return symbol.toUpperCase() + '.' + side + '.X';
            }
        }
    }
}


export function countStringLengths(arr) {
    let totalLength = 0;
    for (let i = 0; i < arr.length; i++) {
        totalLength += arr[i].length;
    }
    return totalLength;
}