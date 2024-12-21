import { COLUMN_COUNT } from "./board";

// insertion sorted list of scored moves
export class MoveSorter {
    constructor() {
        this.entries = new Array(COLUMN_COUNT);
        this.size = 0;
    }

    add(move, score) {
        let pos = this.size++;
        for (; pos && this.entries[pos-1].score > score; --pos)
            this.entries[pos] = this.entries[pos - 1];
        this.entries[pos] = {move: move, score: score};
    }

    getNext() {
        if (this.size)
            return this.entries[--this.size].move;
        else
            return 0;
    }
    peekNext() {
        if (this.size)
            return this.entries[this.size - 1].move;
        else
            return 0;
    }
    peekNextScore() {
        if (this.size)
            return this.entries[this.size - 1].score;
        else
            return undefined;
    }

    reset() {
        this.size = 0;
    }
}