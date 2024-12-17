// Adapted from https://roboticsproject.readthedocs.io/en/latest/ConnectFourAlgorithm.html

import { max, min } from "./util";

export const ROW_COUNT = 6;
export const COLUMN_COUNT = 7
export const PLAYER_PIECE = 1;
export const WIZARD_PIECE = 2;
export const EMPTY = 0;
export const TIE = -1;

function score(board, piece) {
    let score = 0;

    // score centre column
    score += count(board.map((row) => row[Math.floor(COLUMN_COUNT / 2)]), piece) * 3;

    // score horizontal positions
    for (let row = 0; row < ROW_COUNT; row++) {
        let row_array = board[row];
        for (let col = 0; col < COLUMN_COUNT - 3; col++) {
            let window = row_array.slice(col, col + 4);
            score += evaluateWindow(window, piece);
        }
    }

    // score vertical positions
    for (let col = 0; col < COLUMN_COUNT; col++) {
        let col_array = board.map((row) => row[col]);
        for (let row = 0; row < ROW_COUNT - 3; row++) {
            let window = col_array.slice(row, row + 4);
            score += evaluateWindow(window, piece);
        }
    }

    // score diagonals
    for (let row = 0; row < ROW_COUNT - 3; row++) {
        for (let col = 0; col < COLUMN_COUNT - 3; col++) {
            let positive_window = new Array(4);
            let negative_window = new Array(4);
            for (let i = 0; i < 4; i++) {
                positive_window[i] = board[row + i][col + i];
                negative_window[i] = board[row + 3 - i][col + i];
            }
            score += evaluateWindow(positive_window, piece);
            score += evaluateWindow(negative_window, piece);
        }
    }

    return score;
}

function count(window, piece) {
    let count = 0;
    for (let i = 0; i < window.length; i++) {
        if (window[i] == piece) {
            count++;
        }
    }
    return count;
}

function evaluateWindow(window, piece) {
    let score = 0;
    const opponent_piece = piece === PLAYER_PIECE ? WIZARD_PIECE : PLAYER_PIECE;

    const count_piece = count(window, piece);
    const count_opponent_piece = count(window, opponent_piece);
    const count_empty = count(window, EMPTY);

    if (count_piece == 4) // winning move first priority
        score += 100;
    else if (count_piece == 3 && count_empty == 1) // connecting 3 second priority
        score += 5;
    else if (count_piece == 2 && count_empty == 2) // connecting 2 third priority
        score += 2;

    // prioritize blocking
    if (count_opponent_piece == 3 && count_empty == 1)
        score -= 4;

    return score;
}

function checkWinner(board) {
    // check if board is full
    let full = true;
    for (let col = 0; col < COLUMN_COUNT && full; col++) {
        if (board[0][col] == EMPTY) 
            full = false;
    }

    // check horizontal locations
    for (let col = 0; col < COLUMN_COUNT - 3; col++) {
        for (let row = 0; row < ROW_COUNT; row++) {
            if (board[row][col] != EMPTY && board[row][col + 1] == board[row][col] && board[row][col + 2] == board[row][col] && board[row][col + 3] == board[row][col])
                return board[row][col];
        }
    }
    
    // check vertical locations
    for (let col = 0; col < COLUMN_COUNT; col++) {
        for (let row = 0; row < ROW_COUNT - 3; row++) {
            if (board[row][col] != EMPTY && board[row + 1][col] == board[row][col] && board[row + 2][col] == board[row][col] && board[row + 3][col] == board[row][col])
                return board[row][col];
        }
    }
    
    // check positive diagonal locations
    for (let col = 0; col < COLUMN_COUNT - 3; col++) {
        for (let row = 0; row < ROW_COUNT - 3; row++) {
            if (board[row][col] != EMPTY && board[row + 1][col + 1] == board[row][col] && board[row + 2][col + 2] == board[row][col] && board[row + 3][col + 3] == board[row][col])
                return board[row][col];
        }
    }
    
    // check negative diagonal locations
    for (let col = 0; col < COLUMN_COUNT - 3; col++) {
        for (let row = 3; row < ROW_COUNT; row++) {
            if (board[row][col] != EMPTY && board[row - 1][col + 1] == board[row][col] && board[row - 2][col + 2] == board[row][col] && board[row - 3][col + 3] == board[row][col])
                return board[row][col];
        }
    }

    return full ? TIE : EMPTY;
}

function validLocations(board) {
    let valid_locations = [];
    for (let col = 0; col < COLUMN_COUNT; col++) {
        if (board[0][col] == EMPTY)
            valid_locations.push(col);
    }
    return valid_locations;
}

export function emptyBoard() {
    return [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0]
    ];
}
export function copyBoard(board) {
    let new_board = emptyBoard();
    for (let row = 0; row < ROW_COUNT; row++)
        for (let col = 0; col < COLUMN_COUNT; col++)
            new_board[row][col] = board[row][col];

    return new_board;
}

export function getNextOpenRow(board, col) {
    let row;
    for (row = 0; row < ROW_COUNT && board[row][col] == EMPTY; row++);
    return row - 1;
}

function makeMove(board, piece, col) {
    let new_board = copyBoard(board);
    let row = getNextOpenRow(board, col);
    new_board[row][col] = piece;

    return new_board
}

export function minimax(board, depth = 4, alpha = -Infinity, beta = Infinity, player_turn = true) {
    let valid_locations = validLocations(board);
    let winner = checkWinner(board);

    if (depth <= 0 || winner) {
        switch (winner) {
            case PLAYER_PIECE: return [undefined, 999999 + depth];
            case WIZARD_PIECE: return [undefined, -(999999 + depth)];
            case TIE:          return [undefined, -(999999 + depth)];
            default:
                return [undefined, score(board, PLAYER_PIECE)];
        }
    }

    if (player_turn) {
        let value = -Infinity;
        let move = valid_locations[Math.floor(Math.random() * valid_locations.length)];
        for (let col of valid_locations) {
            let new_board = makeMove(board, PLAYER_PIECE, col);
            let new_score = minimax(new_board, depth - 1, alpha, beta, false)[1];
            if (new_score > value) {
                value = new_score;
                move = col;
            }
            alpha = max(alpha, value);
            if (alpha >= beta)
                break;
        }
        return [move, value];
    }
    else {
        let value = Infinity;
        let move = valid_locations[Math.floor(Math.random() * valid_locations.length)];
        for (let col of valid_locations) {
            let new_board = makeMove(board, WIZARD_PIECE, col);
            let new_score = minimax(new_board, depth - 1, alpha, beta, true)[1];
            if (new_score < value) {
                value = new_score;
                move = col;
            }
            beta = min(beta, value);
            if (alpha >= beta)
                break;
        }
        return [move, value];
    }
}