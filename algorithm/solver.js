// Adapted from http://blog.gamesolver.org/solving-connect-four/01-introduction/

const BigInt = Java.type("java.math.BigInteger");

import { Board, COLUMN_COUNT, ROW_COUNT } from "./board";
import { TranspositionTable } from "./transposition_table";
import { MoveSorter } from "./move_sorter";
import { getOpeningBook } from "./opening_book";

const COLUMN_ORDER = [3, 4, 2, 5, 1, 6, 0];
const STARTING_MAX = Math.floor(COLUMN_COUNT * ROW_COUNT / 2);
const MAX_SCORE = Math.floor((COLUMN_COUNT * ROW_COUNT + 1) / 2) - 3;
const MIN_SCORE = -Math.floor((COLUMN_COUNT * ROW_COUNT) / 2) + 3;
var transposition_table = new TranspositionTable(8388593);

export function getTranspositionTable() {
    return transposition_table;
}

var terminate_early = false;
export function terminate(val = true) {
    terminate_early = val;
}
export function isTerminated() {
    return terminate_early;
}

function negamax(board, alpha = -STARTING_MAX, beta = STARTING_MAX, depth = 8) {
    // opponent wins next move
    let possible = board.possibleNonLosingMoves();
    if (possible.equals(BigInt.ZERO)) {
        return -Math.floor((COLUMN_COUNT * ROW_COUNT - board.moves) / 2);
    }

    // check for draw
    if (board.isTie()) {
        return 0;
    }

    let min = -Math.floor((COLUMN_COUNT * ROW_COUNT - 2 - board.moves) / 2);
    if (alpha < min) {
        alpha = min;
        if (alpha >= beta)
            return alpha;
    }

    let max = Math.floor((COLUMN_COUNT * ROW_COUNT - 1 - board.moves) / 2);
    if (beta > max) {
        beta = max;
        if (alpha >= beta)
            return beta;
    }

    const key = board.key();
    let val = transposition_table.get(key);
    if (val != undefined) {
        if (val > MAX_SCORE - MIN_SCORE + 1) {
            min = val + 2 * MIN_SCORE - MAX_SCORE - 2;
            if (alpha < min) {
                alpha = min;
                if (alpha >= beta)
                    return alpha;
            }
        }
        else {
            max = val + MIN_SCORE - 1;
            if (beta > max) {
                beta = max;
                if (alpha >= beta)
                    return beta;
            }
        }
    }

    val = getOpeningBook(board);
    if (val)
        return val + MIN_SCORE - 1;

    if (terminate_early || depth < 0) {
        return alpha;
    }

    let moves = new MoveSorter();
    for (let col = COLUMN_COUNT - 1; col >= 0; col--) {
        let move = possible.and(Board.columnMask(COLUMN_ORDER[col]));
        if (!move.equals(BigInt.ZERO))
            moves.add(move, board.moveScore(move));
    }

    let next;
    while (next = moves.getNext()) {
        let board_copy = board.copy();
        board_copy.play(next);
        let score = -negamax(board_copy, -beta, -alpha, depth - 1);
        if (score >= beta) {
            transposition_table.put(key, score + MAX_SCORE - 2 * MIN_SCORE + 2);
            return score;
        }
        if (score > alpha)
            alpha = score;
    }

    transposition_table.put(key, alpha - MIN_SCORE + 1);
    return alpha;
}

function solve(board, depth = 8) {
    if (board.canWinNext())
        return Math.floor((COLUMN_COUNT * ROW_COUNT + 1 - board.moves) / 2);

    let min = -STARTING_MAX;
    let max = STARTING_MAX;

    while (min < max) {
        let med = Math.floor(min + (max - min) / 2);
        if (med <= 0 && Math.floor(min / 2) < med)
            med = Math.floor(min / 2);
        else if (med >= 0 && Math.floor(max / 2) > med)
            med = Math.floor(max / 2);
        let score = negamax(board, med, med + 1, depth);
        if (score <= med)
            max = score;
        else
            min = score;
    }

    return min;
}

export function analyze(board, depth = 8) {
    let scores = Array(COLUMN_COUNT).fill(undefined);
    for (let col = 0; col < COLUMN_COUNT; col++) {
        if (board.canPlay(col)) {
            if (board.isWinningMove(col))
                scores[col] = Math.floor((COLUMN_COUNT * ROW_COUNT + 1 - board.moves) / 2);
            else {
                let board_copy = board.copy();
                board_copy.playCol(col);
                scores[col] = -solve(board_copy, depth); 
            }
        }
    }
    return scores;
}

export function bestMove(board, depth = 8) {
    let best_move = undefined;
    let best_score = -Infinity;
    for (let col = 0; col < COLUMN_COUNT; col++) {
        if (board.canPlay(COLUMN_ORDER[col])) {
            if (board.isWinningMove(COLUMN_ORDER[col]))
                return COLUMN_ORDER[col];
            else {
                let board_copy = board.copy();
                board_copy.playCol(COLUMN_ORDER[col]);
                let score = -solve(board_copy, depth);
                if (score > best_score) {
                    best_score = score;
                    best_move = COLUMN_ORDER[col];
                }
            }
        }
    }
    return best_move;
}

