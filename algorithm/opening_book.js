// opening_book.txt is a Base64 version of the 7x6.book binary found here https://github.com/PascalPons/connect4/releases/tag/book
// the data stores a large set of pre-computed opening moves in order to save on compute time.

const Base64 = Java.type("java.util.Base64");
const BigInt = Java.type("java.math.BigInteger");
const BIGINT_TWO = new BigInt("2");

var depth = -1;
var data = undefined;
var size = undefined;
var key_offset = 0;
var value_offset = 0;

function has_factor(n, min, max) {
    return min.multiply(min).compareTo(n) > 0 ? false :
           min.add(BigInt.ONE).compareTo(max) >= 0 ? n.mod(min).equals(BigInt.ZERO) :
           has_factor(n, min, med(min, max)) || has_factor(n, med(min, max), max);
}

function med(min, max) {
    return min.add(max).divide(BIGINT_TWO);
}

function next_prime(n) {
    return has_factor(n, BIGINT_TWO, n) ? next_prime(n.add(BigInt.ONE)) : n;
}

function load(file = "opening_book.txt") {
    const encoded = FileLib.read("QuadLinkSolver", file);
    if (encoded == undefined)
        return ChatLib.chat(`&cError: could not read "${file}"`);
    
    data = Base64.getDecoder().decode(encoded);
    table = new Map();

    depth = data[2];
    const partial_key_bytes = data[3];
    const value_bytes = data[4];

    if (partial_key_bytes !== 1 && value_bytes !== 1) {
        return ChatLib.chat("&cError: can only handle key and value byte sizes of 1");
    }

    const log_size = data[5];
    size = next_prime(BigInt.ONE.shiftLeft(log_size));
    
    key_offset = 6;
    value_offset = 6 + (size);
}

function index(key) {
    return key.mod(size);
}

export function getOpeningBook(board) {
    // lazy load data
    if (data === undefined) {
        load();
    }
    if (board.moves > depth) 
        return undefined;
    let key = board.key3();
    let pos = index(key).intValue();

    if (data[key_offset + pos] == key.byteValue())
        return data[value_offset + pos];

    return undefined;
}
