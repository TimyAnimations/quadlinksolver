// Adapted from http://blog.gamesolver.org/solving-connect-four/01-introduction/

export const ROW_COUNT = 6;
export const COLUMN_COUNT = 7
export const PLAYER_PIECE = 1;
export const WIZARD_PIECE = 2;
export const EMPTY = 0;

export class Board {
    
    constructor(move_sequence = "") {
        this.columns = [];
        for (let i = 0; i < COLUMN_COUNT; i++)
            this.columns.push([]);

        this.move_sequence = "";
        this.moves = 0;
        
        for (let i in move_sequence) {
            this.play(move_sequence.charCodeAt(i) - 49);
        }
    }

    copy() {
        let copy = new Board();
        for (let i = 0; i < COLUMN_COUNT; i++) {
            this.columns[i].forEach((piece) => copy.columns[i].push(piece));
        }
        copy.move_sequence = this.move_sequence;
        copy.moves = this.moves;
        return copy;
    }

    play(col) {
        const piece = this.moves % 2 == 0 ? WIZARD_PIECE : PLAYER_PIECE;

        this.columns[col].push(piece);
        this.move_sequence += `${col + 1}`;
        this.moves++;
    }

    checkWinningMove(col) {
        const row = this.columns[col].length;
        const piece = this.moves % 2 == 0 ? WIZARD_PIECE : PLAYER_PIECE;

        // verticle
        if (row >= 3 && piece === this.columns[col][row - 1] && piece === this.columns[col][row - 2] && piece === this.columns[col][row - 3])
            return piece;

        // horizontal
        let count = 1;
        for (let offset = 1; col + offset < COLUMN_COUNT && count < 4 && this.columns[col + offset][row] === piece; offset++)
            count++;
        for (let offset = 1; col - offset >= 0           && count < 4 && this.columns[col - offset][row] === piece; offset++)
            count++;
        if (count == 4)
            return piece;

        // positive diagonal
        count = 1;
        for (let offset = 1; col + offset < COLUMN_COUNT && row + offset < ROW_COUNT && count < 4 && this.columns[col + offset][row + offset] === piece; offset++)
            count++;
        for (let offset = 1; col - offset >= 0           && row - offset >= 0        && count < 4 && this.columns[col - offset][row - offset] === piece; offset++)
            count++;
        if (count == 4)
            return piece;
        
        // negative diagonal
        count = 1;
        for (let offset = 1; col + offset < COLUMN_COUNT && row - offset >= 0        && count < 4 && this.columns[col + offset][row - offset] === piece; offset++)
            count++;
        for (let offset = 1; col - offset >= 0           && row + offset < ROW_COUNT && count < 4 && this.columns[col - offset][row + offset] === piece; offset++)
            count++;
        if (count == 4)
            return piece;

        return false;
    }

    isTie() {
        return this.moves == ROW_COUNT * COLUMN_COUNT;
    }

    canPlay(col) {
        return this.columns[col].length < ROW_COUNT;
    }
    dropToRow(col) {
        return this.columns[col].length;
    }

    getPeiceAt(row, col) {
        return this.columns[col][ROW_COUNT - row - 1] ?? EMPTY;
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
        return string + `moves: ${this.moves}\nsequence: ${this.move_sequence}\n${this.key()}`;
    }

    key() {
        let string = "";
        for (let col = 0; col < COLUMN_COUNT; col++) {
            string += this.columns[col].join("") + "0".repeat(ROW_COUNT - this.columns[col].length);
        }
        return string;
    }
}

var nodes_visited = 0;
function negamax(board, alpha = -Math.floor(COLUMN_COUNT * ROW_COUNT / 2), beta = Math.floor(COLUMN_COUNT * ROW_COUNT / 2), depth = 4) {
    if (depth < 0)
        return [undefined, alpha];
    
    nodes_visited++;
    ChatLib.chat(`[${nodes_visited}] ${board.key()}, ${depth}`);
    
    if (board.isTie()) {
        return [undefined, 0];
    }

    // check if can win
    for (let col = 0; col < COLUMN_COUNT; col++) {
        if (board.canPlay(col) && board.checkWinningMove(col)) {
            return [col, Math.floor((COLUMN_COUNT * ROW_COUNT + 1 - board.moves) / 2)];
        }
    }

    let max = Math.floor((COLUMN_COUNT * ROW_COUNT - 1 - board.moves) / 2);
    if (beta > max) {
        beta = max;
        if (alpha >= beta)
            return [undefined, beta];
    }

    let best = undefined;
    // compute possible moves and keep the best one
    for (let col = 0; col < COLUMN_COUNT; col++) {
        if (board.canPlay(col)) {
            board_copy = board.copy();
            board_copy.play(col);
            let score = -(negamax(board_copy, -beta, -alpha, depth - 1)[1]);
            if (score >= beta) {
                return [col, score]; 
            }
            if (score > alpha) {
                best = col;
                alpha = score;
            }
        }
    }

    return [best, alpha];
}

var test_board = undefined;
var processing_move = false;

function doMove(move) {
    if (isNaN(move))
        return ChatLib.chat("&cError: Invalid Move, NaN");
    if (!test_board.canPlay(move))
        return ChatLib.chat("&cError: Invalid Move, Column full");

    let winner = test_board.checkWinningMove(move);
    if (winner) {
        ChatLib.chat(`&aPlayer ${winner} Wins!`);
        overlay_trigger.unregister();
        test_board = undefined;
        return;
    }

    test_board.play(move);
    ChatLib.chat(`&aMove ${move}`);
    if (test_board.isTie()) {
        ChatLib.chat("&eTie Game!");
        overlay_trigger.unregister();
        test_board = undefined;
    }
}

register("command", (arg) => {
    if (test_board == undefined || arg == "reset") {
        test_board = new Board();
        overlay_trigger.register();
        return ChatLib.chat("&aStarting QuadLink Practice Game");
    }

    if (arg === "auto") {
        new Thread(() => {
            const start_time = Date.now();
            processing_move = true;
            nodes_visited = 0;
            let [move, score] = negamax(test_board, -Math.floor(COLUMN_COUNT * ROW_COUNT / 2), Math.floor(COLUMN_COUNT * ROW_COUNT / 2), 1);

            processing_move = false;
            ChatLib.chat(`Took ${(Date.now() - start_time)}ms, visiting ${nodes_visited} nodes`);
            if (move)
                ChatLib.chat(`&aFound move &e${move} &7(${score})`);
            else
                ChatLib.chat(`&cNo move found &7(${score})`);

            doMove(move);
        }).start();
        return;
    }
    if (arg === "stop") {
        overlay_trigger.unregister();
        test_board = undefined;
        return;
    }

    doMove(parseInt(arg));
}).setName("quadlinkmove");

const overlay_trigger = register("renderOverlay", () => {
    if (processing_move) {
        Renderer.drawString(`&eprocessing... ${nodes_visited}`, 100, 90);
    }
    Renderer.drawString(test_board.toString(), 100, 100);
});
overlay_trigger.unregister();