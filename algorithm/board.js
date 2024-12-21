export const ROW_COUNT = 6;
export const COLUMN_COUNT = 7
export const PLAYER_PIECE = 1;
export const WIZARD_PIECE = 2;
export const EMPTY = 0;

const BigInt = Java.type("java.math.BigInteger");
const BIGINT_THREE = new BigInt("3");

function bottom(width, height) {
    return width == 0 ? BigInt.ZERO : bottom(width - 1, height).or(BigInt.ONE.shiftLeft((width - 1) * (height + 1)));
}

const bottom_mask = bottom(COLUMN_COUNT, ROW_COUNT);
const board_mask = bottom_mask.multiply(BigInt.ONE.shiftLeft(ROW_COUNT).subtract(BigInt.ONE));

// A binary representation of the connect four board
// Java's BigInteger class is used as javascript numbers are stored as 64 bit floats but converted to 32 bit ints when doing bitwise operations
// more than 32 bits are required to represent a 7x6 board.

export class Board {
    constructor() {
        this.current_position = BigInt.ZERO;
        this.mask = BigInt.ZERO;
        this.moves = BigInt.ZERO;
    }

    canPlay(col) {
        return this.mask.and(Board.topMask(col)).equals(BigInt.ZERO);
    }
    play(move) {
        this.current_position = this.current_position.xor(this.mask);
        this.mask = this.mask.or(move);
        this.moves++;
    }
    playCol(col) {
        this.play(this.mask.add(Board.bottomMask(col)).and(Board.columnMask(col)));
    }
    playSequence(sequence) {
        for (let i in sequence) {
            let move = sequence.charCodeAt(i) - 49;
            if (this.canPlay(move)) {
                let winner = this.isWinningMove(move);
                this.playCol(move);
                if (winner)
                    return winner;
            }
            if (this.isTie())
                return -1;
        }
    }

    canWinNext() {
        return !this.winningPosition().and(this.possible()).equals(BigInt.ZERO);
    }
    isWinningMove(col) {
        return (!this.winningPosition().and(this.possible()).and(Board.columnMask(col)).equals(BigInt.ZERO))
                ? (this.moves % 2 == 0 ? WIZARD_PIECE : PLAYER_PIECE) : false;
    }
    isTie() {
        return this.moves == ROW_COUNT * COLUMN_COUNT;
    }

    possibleNonLosingMoves() {
        let possible_mask = this.possible();
        let opponent_win = this.opponentWinningPosition();
        let forced_moves = possible_mask.and(opponent_win);

        if (!forced_moves.equals(BigInt.ZERO)) {
            if (!forced_moves.and(forced_moves.subtract(BigInt.ONE)).equals(BigInt.ZERO))
                return BigInt.ZERO;
            else
                possible_mask = forced_moves;
        }
        return possible_mask.andNot(opponent_win.shiftRight(1));
    }
    winningPosition() {
        return computeWinningPosition(this.current_position, this.mask);
    }
    opponentWinningPosition() {
        return computeWinningPosition(this.current_position.xor(this.mask), this.mask);
    }

    possible() {
        return this.mask.add(bottom_mask).and(board_mask);
    }

    copy() {
        let new_board = new Board();
        new_board.current_position = this.current_position;
        new_board.mask = this.mask;
        new_board.moves = this.moves;
        return new_board;
    }

    key() {
        return this.current_position.add(this.mask);
    }
    key3() {
        let key_forward = BigInt.ZERO;
        for (let i = 0; i < COLUMN_COUNT; i++)
            key_forward = this.partialKey3(key_forward, i);
        
        let key_reverse = BigInt.ZERO;
        for (let i = COLUMN_COUNT; i >= 0; i--)
            key_reverse = this.partialKey3(key_reverse, i);
        
        return key_forward.compareTo(key_reverse) < 0 ? key_forward.divide(BIGINT_THREE) : key_reverse.divide(BIGINT_THREE);
    }
    partialKey3(key, col) {
        for (let pos = BigInt.ONE.shiftLeft(col * (ROW_COUNT + 1)); !pos.and(this.mask).equals(BigInt.ZERO); pos = pos.shiftLeft(1)) {
            key = key.multiply(BIGINT_THREE);
            if (!pos.and(this.current_position).equals(BigInt.ZERO))
                key = key.add(BigInt.ONE);
            else
                key = key.add(BigInt.ONE).add(BigInt.ONE);
        }
        return key.multiply(BIGINT_THREE);
    }

    alignment(pos) {
        // horizontal
        let m = pos.and(pos.shiftRight(ROW_COUNT + 1));
        if (!m.and( m.shiftRight(2 * (ROW_COUNT + 1)) ).equals(BigInt.ZERO))
            return true;
        
        // diagonal 1
        m = pos.and(pos.shiftRight(ROW_COUNT));
        if (!m.and( m.shiftRight(2 * ROW_COUNT) ).equals(BigInt.ZERO))
            return true;
 
        // diagonal 2 
        m = pos.and(pos.shiftRight(ROW_COUNT + 2));
        if (!m.and( m.shiftRight(2 * (ROW_COUNT + 2)) ).equals(BigInt.ZERO))
            return true;
 
        // vertical;
        m = pos.and(pos.shiftRight(1));
        if (!m.and( m.shiftRight(2) ).equals(BigInt.ZERO))
            return true;
 
        return false;
    }
    static topMask(col) {
        return BigInt.ONE.shiftLeft(ROW_COUNT - 1).shiftLeft(col * (ROW_COUNT + 1));
    }
    static bottomMask(col) {
        return BigInt.ONE.shiftLeft(col * (ROW_COUNT + 1));
    }
    static coordinateMask(row, col) {
        return BigInt.ONE.shiftLeft(ROW_COUNT - (1 + row)).shiftLeft(col * (ROW_COUNT + 1));
    }
    static columnMask(col) {
        return BigInt.ONE.shiftLeft(ROW_COUNT).subtract(BigInt.ONE).shiftLeft(col * (ROW_COUNT + 1));
    }

    moveScore(move) {
        return this.popcount(computeWinningPosition(this.current_position.or(move), this.mask));
    }
    popcount(m) {
        let c = 0;
        for (c = 0; !m.equals(BigInt.ZERO); c++) 
            m = m.and(m.subtract(BigInt.ONE));
        return c;
    }

    getPeiceAt(row, col) {
        const [piece, opp_piece] = 
            this.moves % 2 == 0 
            ? [WIZARD_PIECE, PLAYER_PIECE] 
            : [PLAYER_PIECE, WIZARD_PIECE];

        const coord_mask = Board.coordinateMask(row, col);

        if (this.mask.and(coord_mask).equals(BigInt.ZERO)) 
            return EMPTY;

        if (!this.current_position.and(coord_mask).equals(BigInt.ZERO))
            return piece;
        
        return opp_piece;
    }
    setPeiceAt(row, col, is_opponent) {
        const coord_mask = Board.coordinateMask(row, col);
        if (!this.mask.and(coord_mask).equals(BigInt.ZERO))
            return;

        this.mask = this.mask.or(coord_mask);
        if (!is_opponent)
            this.current_position = this.current_position.or(coord_mask)

        this.moves++;
    }
    invert() {
        this.current_position = this.current_position.xor(this.mask);
    }
    dropRow(col) {
        for (let row = 0; row < ROW_COUNT; row++)
            if (!this.mask.and(Board.coordinateMask(row, col)).equals(BigInt.ZERO)) {
                return row - 1;
            }
        return ROW_COUNT - 1;
    }

    toString() {
        let string = "";
        for (let row = 0; row < ROW_COUNT; row++) {
            for (let col = 0; col < COLUMN_COUNT; col++) {
                switch (this.getPeiceAt(row, col)) {
                    case PLAYER_PIECE: 
                        string += "&a1 "; break;
                    case WIZARD_PIECE: 
                        string += "&c2 "; break;
                    default:
                        string += "&70 ";
                }
            }
            string += "\n";
        }
        return string + `moves: ${this.moves}\nkey: ${this.key()}, key3: ${this.key3()}\nmask: ${this.mask}\npos: ${this.current_position}`;
    }
}

function computeWinningPosition(position, mask) {
    // vertical;
    let r = position.shiftLeft(1).and(position.shiftLeft(2)).and(position.shiftLeft(3));

    //horizontal
    let p = position.shiftLeft(ROW_COUNT + 1).and(position.shiftLeft(2 * (ROW_COUNT + 1)));
    r = r.or( p.and(position.shiftLeft(3 * (ROW_COUNT + 1))) );
    r = r.or( p.and(position.shiftRight(ROW_COUNT + 1)) );
    p = p.shiftRight( 3 * (ROW_COUNT + 1) );
    r = r.or( p.and(position.shiftLeft(ROW_COUNT + 1)) );
    r = r.or( p.and(position.shiftRight(3 * (ROW_COUNT + 1))) );

    //diagonal 1
    p = position.shiftLeft(ROW_COUNT).and(position.shiftLeft(2 * ROW_COUNT));
    r = r.or( p.and(position.shiftLeft(3 * ROW_COUNT)) );
    r = r.or( p.and(position.shiftRight(ROW_COUNT)) );
    p = p.shiftRight(3 * ROW_COUNT);
    r = r.or( p.and(position.shiftLeft(ROW_COUNT)) );
    r = r.or( p.and(position.shiftRight(3 * ROW_COUNT)) );

    //diagonal 2
    p = position.shiftLeft(ROW_COUNT + 2).and(position.shiftLeft(2 * (ROW_COUNT + 2)));
    r = r.or( p.and(position.shiftLeft(3 * (ROW_COUNT + 2))) );
    r = r.or( p.and(position.shiftRight(ROW_COUNT + 2)) );
    p = p.shiftRight(3 * (ROW_COUNT + 2));
    r = r.or( p.and(position.shiftLeft(ROW_COUNT + 2)) );
    r = r.or( p.and(position.shiftRight(3 * (ROW_COUNT + 2))) );

    return r.and(board_mask.xor(mask));
}