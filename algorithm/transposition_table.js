// simplified to using javascript's Map class, but limits the size of the map to a set value

// TODO: improve memory usuage by implementing a byte sized key, similar to how the opening_book works

export class TranspositionTable {
    constructor(size) {
        this.max_size = size;
        this.entries = new Map();
    }

    put(key, val) {
        this.entries.set(key.toString(), val);
        while (this.entries.size > this.max_size) {
            this.entries.delete(this.entries.keys()[0]);
        }
    }
    get(key) {
        return this.entries.get(key.toString());
    }
}