class MinHeap {
  // compareFn: a function that tells us how to compare two items
  // Example: (a, b) => a.deadline - b.deadline  means "sort by deadline"
  constructor(compareFn) {
    this.heap = [];          // The internal array storing all items
    this.compare = compareFn;
  }
}
function get_size() {
    return this.heap.length;
  }

  // Look at the smallest item WITHOUT removing it
function peek() {
    return this.heap[0] || null;
  }

// ADD a new item to the heap
  // After adding, we "bubble up" to restore the heap property
function push(item) {
    this.heap.push(item);                   // Add to end
    this._bubbleUp(this.heap.length - 1);   // Fix heap order
  }

// REMOVE and RETURN the smallest item from the heap
  // After removing, we "sink down" to restore the heap property
function pop() {
    if (this.heap.length === 0) return null;

    const top = this.heap[0];         // Save the smallest (root)
    const last = this.heap.pop();     // Remove the last item
    // If there are still items, move last item to root and fix
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }

    return top;
  }

  
  // PRIVATE: Move an item UP the tree until heap order is restored
  // Called after push() — new item might be smaller than its parent
  function _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);  // Find parent index

      // If current item is SMALLER than parent, swap them
      if (this.compare(this.heap[i], this.heap[parent]) < 0) {
        // Swap using destructuring (ES6 shorthand)
        [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
        i = parent; // Continue checking from parent's position
      } else {
        break; // Item is in the right place, stop
      }
    }
  }

  // PRIVATE: Move an item DOWN the tree until heap order is restored
  // Called after pop() — we moved the last item to root, need to fix
  function _sinkDown(i) {
    const n = this.heap.length;

    while (true) {
      let smallest = i;           // Assume current is smallest
      const left  = 2 * i + 1;   // Left child index
      const right = 2 * i + 2;   // Right child index

      // If left child exists and is smaller, it's the new candidate
      if (left < n && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }

      // If right child exists and is smaller than current candidate
      if (right < n && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      // If a child is smaller, swap and continue sinking
      if (smallest !== i) {
        [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
        i = smallest;
      } else {
        break; // Item is in the right place, stop
      }
    }
  }
}


