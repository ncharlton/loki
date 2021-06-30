class BaseQueue {
    storage = [];

    constructor(capacity = Infinity) {

    }

    enqueue(item) {
        if (this.size() === this.capacity) {
            throw Error("Queue has reached max capacity, you cannot add more items");
        }
        this.storage.push(item);
    }

    prequeue(item) {
        this.storage.unshift(item);
    }

    dequeue() {
        return this.storage.shift();
    }

    size() {
        return this.storage.length;
    }

    queue() {
        return this.storage;
    }
}

export default BaseQueue;
