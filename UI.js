/* ============================================================
   ui.js
   WHO WROTE THIS: Person 2 (UI Developer) + Person 3 (Integrator)
   WHAT THIS FILE DOES: Handles everything the USER sees and clicks.
   - Reading form inputs
   - Adding/removing tasks from the list
   - Calling the algorithm (from scheduler.js)
   - Displaying the results on screen

   NOTE: This file DEPENDS on scheduler.js being loaded first.
   That's why in index.html, scheduler.js is linked BEFORE ui.js.
   ============================================================ */


/* ============================================================
   GLOBAL STATE
   These variables are available to all functions in this file.
   Think of them as the app's "memory".
   ============================================================ */

let tasks = [];        // Array of task objects the user has added
let taskIdCounter = 0; // Each task gets a unique ID (0, 1, 2, ...)


/* ============================================================
   FUNCTION: addTask()
   CALLED BY: The "+ADD" button in index.html (onclick='addTask()')
   WHAT IT DOES:
   1. Reads the 4 input fields
   2. Validates the inputs (shows alerts if something's wrong)
   3. Creates a task object and adds it to the tasks[] array
   4. Clears the input fields
   5. Re-renders the task list
   ============================================================ */
function addTask() {

  // Read values from the form fields
  // .trim() removes accidental spaces before/after text
  const name       = document.getElementById('taskName').value.trim();
  const deadline   = parseFloat(document.getElementById('deadline').value);
  const duration   = parseFloat(document.getElementById('duration').value);
  const difficulty = parseInt(document.getElementById('difficulty').value);

  // --- INPUT VALIDATION ---
  // Stop the function early if anything is wrong

  if (!name) {
    alert('Please enter a task name!');
    return; // Stop here — don't add a nameless task
  }

  if (!deadline || deadline <= 0) {
    alert('Please enter a valid deadline (in hours)!');
    return;
  }

  if (!duration || duration <= 0) {
    alert('Please enter a valid duration (in hours)!');
    return;
  }

  if (duration > deadline) {
    alert('Duration cannot exceed deadline! You need time to finish before it\'s due.');
    return;
  }

  // --- CREATE TASK OBJECT ---
  // An object that stores all info about one task
  const newTask = {
    id:         taskIdCounter++, // Unique ID, then increment counter
    name:       name,
    deadline:   deadline,
    duration:   duration,
    difficulty: difficulty
  };

  // Add the new task to our global array
  tasks.push(newTask);

  // Clear the input fields so user can add another task
  document.getElementById('taskName').value = '';
  document.getElementById('deadline').value = '';
  document.getElementById('duration').value = '';
  // Note: We DON'T reset difficulty — user might want same level for next task

  // Update the task list shown on screen
  renderTaskList();
}


/* ============================================================
   FUNCTION: removeTask(id)
   CALLED BY: The "Remove" button inside each task chip
   WHAT IT DOES: Filters out the task with matching id, then re-renders
   ============================================================ */
function removeTask(id) {
  // Array.filter returns a NEW array with matching items removed
  tasks = tasks.filter(task => task.id !== id);
  renderTaskList();
}


/* ============================================================
   FUNCTION: renderTaskList()
   CALLED BY: addTask() and removeTask() after any change
   WHAT IT DOES: Rebuilds the HTML for all task chips on screen
   ============================================================ */
function renderTaskList() {
  const container = document.getElementById('taskList');

  // If no tasks, show the placeholder message
  if (tasks.length === 0) {
    container.innerHTML = `<div class='empty-state'>No troops added yet. Add tasks above!</div>`;
    return;
  }

  // Build HTML for each task as a "chip" row
  // .map() transforms each task object into an HTML string
  // .join('') combines all HTML strings into one big string
  container.innerHTML = tasks.map(task => {

    const dc = DIFF_COLORS[task.difficulty]; // Get color config from scheduler.js

    return `
      <div class='task-chip'>
        <span class='task-name'>${task.name}</span>
        <span class='task-meta'>Deadline: ${task.deadline}h | Duration: ${task.duration}h</span>
        <span class='diff-badge' style='background:${dc.bg}; color:${dc.text}'>
          ${task.difficulty}/5 ${dc.label}
        </span>
        <button onclick='removeTask(${task.id})'>Remove</button>
      </div>
    `;
  }).join('');
}


/* ============================================================
   FUNCTION: generateSchedule()
   CALLED BY: The "GENERATE BATTLE STRATEGY" button in index.html
   WHAT IT DOES:
   1. Calls greedySchedule() from scheduler.js
   2. Updates the 4 stats (Deployed, Skipped, Time, Efficiency)
   3. Builds the colorful timeline bar
   4. Renders each schedule slot (or skipped slot)
   5. Shows the algorithm explanation
   6. Reveals the output card (which was hidden)
   ============================================================ */
function generateSchedule() {

  // Guard: can't schedule nothing
  if (tasks.length === 0) {
    alert('Add at least one task first!');
    return;
  }

  // --- RUN THE ALGORITHM ---
  // greedySchedule() is defined in scheduler.js
  // It returns { scheduled: [...], skipped: [...] }
  const { scheduled, skipped } = greedySchedule(tasks);

  // Total time = when the last scheduled task ends (or 0 if nothing scheduled)
  const totalTime = scheduled.length > 0
    ? scheduled[scheduled.length - 1].endTime
    : 0;


  // --- UPDATE STATS BOXES ---
  document.getElementById('stat-scheduled').textContent = scheduled.length;
  document.getElementById('stat-skipped').textContent   = skipped.length;
  document.getElementById('stat-time').textContent      = totalTime.toFixed(1) + 'h';

  // Efficiency = what % of tasks were scheduled successfully
  const efficiency = tasks.length > 0
    ? Math.round((scheduled.length / tasks.length) * 100)
    : 0;
  document.getElementById('stat-score').textContent = efficiency + '%';


  // --- BUILD TIMELINE BAR ---
  // Each task gets a colored block proportional to its duration
  const timelineEl = document.getElementById('timeline');

  if (totalTime > 0) {
    timelineEl.innerHTML = scheduled.map((task, index) => {

      // Width as a percentage of total time
      const widthPercent = (task.duration / totalTime * 100).toFixed(1);

      // Cycle through TIMELINE_COLORS array
      const color = TIMELINE_COLORS[index % TIMELINE_COLORS.length];

      // Show first 8 characters of task name (truncated to fit)
      return `
        <div class='timeline-block'
             style='width:${widthPercent}%; background:${color}; color:#fff; padding: 0 4px;'
             title='${task.name}'>
          ${task.name.slice(0, 8)}
        </div>
      `;
    }).join('');
  }


  // --- BUILD SCHEDULE SLOT LIST ---
  const listEl = document.getElementById('scheduleList');
  let html = '';

  // Render each SCHEDULED task as a slot
  scheduled.forEach((task, index) => {

    // Slack = how much buffer time before deadline
    const slack = task.deadline - task.endTime;

    // Status label and CSS class based on how close the deadline is
    let statusClass, statusLabel;

    if (slack <= 0.5) {
      statusClass = 'status-danger';
      statusLabel = 'CRITICAL'; // Barely made it!
    } else if (slack <= 1.5) {
      statusClass = 'status-warning';
      statusLabel = 'TIGHT';    // Close, but okay
    } else {
      statusClass = 'status-safe';
      statusLabel = 'VICTORY';  // Comfortable margin
    }

    const dc = DIFF_COLORS[task.difficulty];

    html += `
      <div class='schedule-slot'>
        <div class='slot-number'>${index + 1}</div>
        <div class='slot-details'>
          <div class='slot-name'>
            ${task.name}
            <span style='font-size:0.75em; padding:2px 8px; border-radius:10px;
                         background:${dc.bg}; color:${dc.text}; margin-left:8px;'>
              Diff: ${task.difficulty}/5
            </span>
          </div>
          <div class='slot-time'>
            Start: ${task.startTime.toFixed(1)}h |
            End: ${task.endTime.toFixed(1)}h |
            Duration: ${task.duration}h |
            Deadline: ${task.deadline}h |
            Slack: ${slack.toFixed(1)}h
          </div>
        </div>
        <div class='slot-status ${statusClass}'>${statusLabel}</div>
      </div>
    `;
  });

  // Render each SKIPPED task (couldn't fit before deadline)
  skipped.forEach(task => {
    html += `
      <div class='schedule-slot' style='border-left-color: #546e7a; opacity: 0.6;'>
        <div class='slot-number' style='background: #546e7a;'>X</div>
        <div class='slot-details'>
          <div class='slot-name'>${task.name} (INFEASIBLE — Cannot fit before deadline)</div>
          <div class='slot-time'>Deadline: ${task.deadline}h | Duration: ${task.duration}h</div>
        </div>
        <div class='slot-status status-skipped'>SKIPPED</div>
      </div>
    `;
  });

  // If somehow nothing rendered, show fallback message
  listEl.innerHTML = html || `<div class='empty-state'>No schedule generated.</div>`;


  // --- SHOW ALGORITHM EXPLANATION ---
  document.getElementById('algoExplanation').innerHTML = `
    <strong>Algorithm Used:</strong>
    <br><strong>1. Sorting (O(n log n)):</strong>
    Tasks sorted by deadline using Array.sort() with custom comparator.
    Ensures earliest deadlines are considered first.

    <br><br><strong>2. Min-Heap Priority Queue (O(log n) per operation):</strong>
    Custom MinHeap class with bubbleUp and sinkDown operations.
    Root of the heap always = most urgent (earliest deadline) task.

    <br><br><strong>3. Greedy Algorithm (O(n) pass after sort):</strong>
    At each step, extracts the earliest-deadline task and checks:
    can it finish before its deadline? If yes → schedule. If no → skip.

    <br><br><strong>4. Difficulty Balancer:</strong>
    Post-processing pass that inserts easy tasks (difficulty ≤ 2) between
    consecutive hard tasks (difficulty ≥ 4) to prevent cognitive burnout.

    <br><br><strong>Overall Complexity: O(n log n)</strong>
    — dominated by the initial sorting step.
  `;


  // --- REVEAL THE OUTPUT CARD ---
  // The output card starts hidden (class='hidden')
  // We remove the 'hidden' class to show it
  const outputCard = document.getElementById('outputCard');
  outputCard.classList.remove('hidden');

  // Smoothly scroll down so user sees the results
  outputCard.scrollIntoView({ behavior: 'smooth' });
}
