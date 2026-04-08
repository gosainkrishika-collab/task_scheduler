const DIFF_COLORS = {
  1: { bg: '#8BC34A', text: '#fff', label: 'Easy' },
  2: { bg: '#CDDC39', text: '#000', label: 'Simple' },
  3: { bg: '#FFC107', text: '#000', label: 'Medium' },
  4: { bg: '#FF9800', text: '#fff', label: 'Hard' },
  5: { bg: '#F44336', text: '#fff', label: 'Beast' }
};

const TIMELINE_COLORS = [
  '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'
];
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

function greedySchedule(inputTasks) {

  // --- STEP 1: Sort by deadline (Earliest Deadline First) ---
  // We spread [...inputTasks] to avoid modifying the original array
  const sorted = [...inputTasks].sort((a, b) => a.deadline - b.deadline);

  // --- STEP 2: Insert all tasks into the Min-Heap ---
  // The heap is ordered by deadline, so most urgent = root
  const heap = new MinHeap((a, b) => a.deadline - b.deadline);
  sorted.forEach(task => heap.push({ ...task })); // spread to copy each task object

  // --- STEP 3: Greedy loop ---
  const scheduled = []; // Tasks we successfully fit into the schedule
  const skipped    = []; // Tasks that couldn't fit before their deadline
  let currentTime  = 0;  // Tracks what time it is now in our schedule

  while (heap.size > 0) {
    const task = heap.pop(); // Get the most urgent (earliest deadline) task

    // Can we finish this task before its deadline?
    // i.e., if we start NOW and work until (currentTime + duration),
    // will that be BEFORE or AT the deadline?
    if (currentTime + task.duration <= task.deadline) {
      // YES → Schedule it!
      scheduled.push({
        ...task,
        startTime: currentTime,
        endTime: currentTime + task.duration
      });
      currentTime += task.duration; // Advance the clock
    } else {
      // NO → Skip it. Duration would push past the deadline.
      skipped.push(task);
    }
  }

  // --- STEP 4: Difficulty balancing pass ---
  return balanceDifficulty(scheduled, skipped, currentTime);
}

function balanceDifficulty(scheduled, skipped, currentTime) {

  // Keep looping until no more swaps can be made
  let changed = true;

  while (changed) {
    changed = false; // Assume nothing will change this pass

    // Check every consecutive pair in the schedule
    for (let i = 0; i < scheduled.length - 1; i++) {

      const taskA = scheduled[i];     // Current task
      const taskB = scheduled[i + 1]; // Next task

      // Are BOTH tasks hard (difficulty 4 or 5)?
      if (taskA.difficulty >= 4 && taskB.difficulty >= 4) {

        // Search skipped tasks for an easy one that fits here
        const insertIdx = skipped.findIndex(easyTask => {

          // Where would this easy task end if inserted here?
          const insertEnd = taskA.endTime + easyTask.duration;

          // Two conditions must be true:
          // 1. It's easy (difficulty <= 2)
          // 2. It fits before its own deadline
          // 3. It doesn't push taskB past ITS deadline
          return (
            easyTask.difficulty <= 2 &&
            insertEnd <= easyTask.deadline &&
            insertEnd <= taskB.deadline - taskB.duration
          );
        });

        if (insertIdx !== -1) {
          // Found an easy task! Remove it from skipped list
          const easyTask = skipped.splice(insertIdx, 1)[0];

          // Schedule the easy task right after taskA
          easyTask.startTime = taskA.endTime;
          easyTask.endTime   = taskA.endTime + easyTask.duration;

          // Shift all tasks after this point to start later
          for (let j = i + 1; j < scheduled.length; j++) {
            scheduled[j].startTime = scheduled[j - 1].endTime;
            scheduled[j].endTime   = scheduled[j].startTime + scheduled[j].duration;
          }

          // Insert easy task into position i+1
          scheduled.splice(i + 1, 0, easyTask);

          changed = true; // We made a change — run the loop again
          break;          // Restart the scan from the beginning
        }
      }
    }
  }

  // Return both lists so the UI can show both scheduled and skipped tasks
  return { scheduled, skipped };
}





