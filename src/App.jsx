import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_GROQ_API_KEY = import.meta.env.VITE_groqApi || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert DSA tutor. Respond ONLY with a valid JSON object, no markdown, no backticks, nothing else.

JSON structure:
{
  "isValid": true,
  "language": "C++",
  "algorithmName": "name",
  "category": "Array/Sorting/Searching/Graph/Tree/Matrix/String/etc",
  "isCorrect": true,
  "bugs": [],
  "correctedCode": "",
  "transpiledSolutions": {
    "cpp": "C++ code",
    "python": "Python code",
    "java": "Java code",
    "javascript": "JavaScript code"
  },
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "complexityBreakdown": {
    "timeBreakdown": "detailed explanation of time complexity",
    "spaceBreakdown": "detailed explanation of space complexity",
    "bestCase": "O(N)",
    "worstCase": "O(N)",
    "averageCase": "O(N)"
  },
  "edgeCases": [
    "empty list",
    "single node"
  ],
  "hints": [
    "conceptual hint 1",
    "conceptual hint 2"
  ],
  "relatedAlgorithms": [
    { 
      "name": "problem/algorithm name", 
      "relation": "brief explanation of connection", 
      "difficulty": "Easy/Medium/Hard", 
      "companies": ["Google", "Amazon", "Meta"] 
    }
  ],
  "explanation": "2-3 sentences",
  "howItWorks": ["step 1", "step 2"],
  "quiz": [ // 3 conceptual, thought-provoking multiple-choice questions designed to test algorithmic thinking
    {
      "question": "question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": "option A",
      "explanation": "detailed explanation of why this answer is correct"
    }
  ],
  "codeLines": [{"line": "code", "explain": "plain english"}], // You MUST include the ENTIRE algorithm code (or the corrected version if there are bugs) line-by-line in this array. Do NOT truncate or omit any lines, braces, returns, or helper functions. Every line of the code must be represented as a separate element in this array, in sequential order.
  "defaultInput": "describe input array, linked list, stack, queue, adjacency graph list, or 2D grid simulated here",
  "graphLayout": { // Present ONLY for Graph/Tree algorithms (omit for Array/Sorting/Searching/Matrix)
    "directed": false,
    "nodes": [{"id": "A", "x": 50, "y": 20}], // coordinates x,y are horizontal/vertical percentages (10 to 90) on a 100x100 space
    "edges": [{"from": "A", "to": "B", "weight": 4}] // edge connections
  },
  "steps": [
    {
      "arr": [1, 2, 3], // Present ONLY for array-based/sorting/searching/string algorithms (omit for Graph/Matrix/List/Stack/Queue)
      "arrStates": {"0": "active/comparing/swapping/done/skipped/idle"}, // Map of array index (string key) to state
      "matrix": [[1, 2], [3, 4]], // Present ONLY for 2D Grid/Matrix algorithms representing the grid state at this step
      "matrixState": {"0-0": "active/visited/done/idle/processing/swap/secondary/eliminated"}, // Cell states mapping "row-col" keys (e.g. "0-0", "1-2") to state strings
      "matrixVals": {"0-0": "val"}, // Optional custom values/labels for grid cells mapping "row-col" keys
      "nodeStates": {"A": "active/visited/done/idle/processing"}, // Present ONLY for Graph/Tree algorithms
      "nodeVals": {"A": "dist=0"}, // Optional node values (e.g. Dijkstra distances or traversal values)
      "edgeStates": {"A-B": "highlighted/visited/idle"}, // Present ONLY for Graph/Tree algorithms (use "from-to" keys)
      "linkedList": [{"id": "A", "val": 10, "state": "active/comparing/swapping/done/idle"}], // Present ONLY for Linked List algorithms representing nodes in logical sequence
      "stack": [{"val": 10, "state": "active/comparing/swapping/done/idle"}], // Present ONLY for Stack algorithms representing stack elements from bottom (index 0) to top (last element)
      "queue": [{"val": 10, "state": "active/comparing/swapping/done/idle"}], // Present ONLY for Queue algorithms representing queue elements from front (index 0) to rear (last element)
      "highlight": [1, 2], // line numbers (0-indexed) of codeLines corresponding to the active lines in this step
      "pointers": {"0": "i"}, // index mapping pointers for arrays/strings or node id mapping pointers for lists
      "activeLine": 0, // primary line of code executing
      "variables": {"parent": "[0, 1, 0]", "size": "[2, 1, 1]", "i": "0"}, // Variable trace mapping. In EACH step, trace the exact values of active variables/arrays/pointers just like a student does on paper.
      "callStack": ["dfs(node='A')", "dfs(node='B')"], // Optional array representing the active function call stack at this step. Put the current call at the top of the stack (index 0).
      "msg": "beginner friendly message explaining this step",
      "isVisualStep": true // Boolean: true if a key transition happens (push/pop, compare/swap, pointer movement, node visit, cell edit), false for minor dry-run steps (loop checks, declarations, returns)
    }
  ]
}

For Array, Sorting, Searching, and String/Character algorithms:
1. If the input is a string, represent it in the 'arr' field of each step as an array of characters: e.g., ['h', 'e', 'l', 'l', 'o'].
2. In each step, you MUST map active indices in 'arrStates' to show visualization states:
   - "active" for target/highlighted elements
   - "comparing" for elements currently compared
   - "swapping" for elements being swapped
   - "done" for elements sorted or confirmed
   - "skipped" for elements eliminated from the search space
3. Use 'pointers' to display indices (e.g., 'i', 'j', 'left', 'right', 'low', 'high') to help visualize sorting/searching bounds and comparisons.

For graph or tree algorithms:
1. "graphLayout" defines the static positions of the nodes and connection edges. Layout trees hierarchically (root at top center, children below) and general graphs circularly or topologically.
2. In each step, you MUST update state properties ("nodeStates", "nodeVals" and "edgeStates") to visually explain/animate the traversal. Ensure states change dynamically step-by-step to reflect BFS/DFS/Dijkstra progression (e.g. active nodes change color, edges change color when traversed, distances update in nodeVals).
3. For algorithms that modify tree or graph structures (e.g., BST insertion, node deletion, AVL rotations, edge insertions): you MUST update the "graphLayout" dynamically step-by-step in the steps array to show the nodes and edges being added, removed, or repositioned in real-time.

For matrix or grid algorithms:
1. "matrix" represents the 2D array grid at this step.
2. In each step, specify cell states in "matrixState" and cell labels/values in "matrixVals" to highlight traversal path, comparisons, or cell values.

For Linked List algorithms:
1. "linkedList" represents the chain of nodes at this step. Each node must have a unique "id" (string/number), a "val" (the node's value/key), a "next" (the "id" of the next node it points to, or null), and a "state" (e.g., "active" for currently accessed/modified node, "comparing" for compared nodes, "swapping" for nodes whose pointers are changing, "done" for processed nodes).
2. The order of nodes in the "linkedList" array MUST reflect the logical sequence of nodes from head to tail at the current step (e.g., if links are reversed, the array order should change to match the new logical traversal path).
3. Use "pointers" to map pointer names (e.g., "head", "tail", "curr", "prev", "nextTemp", "fast", "slow") to the node "id" they point to at this step, e.g. {"A": "head, curr", "B": "nextTemp"}.
4. You MUST trace every single pointer assignment (like nextTemp = curr->next, curr->next = prev, prev = curr, curr = nextTemp) as its own separate step. Do not group them together or skip any pointer moves! Explain clearly what each pointer change accomplishes.
5. For ALL Linked List algorithms (reversing, insertion, deletion, searching, traversal):
   - You MUST explicitly include the "next" pointer for every node in the "linkedList" array.
   - If a node points backward in the array, specify its "next" value as the ID of that previous node.
   - If a link is cut or a node is disconnected, its "next" must be null or show the actual connection.
   - This is critical so the live visualization can render right-pointing, left-pointing, or disconnected arrows dynamically!

For Stack algorithms:
1. "stack" represents the ENTIRE stack state at this step. You MUST include ALL elements currently in the stack (from the bottom-most element at index 0 to the top-most element at the last index). Do NOT just show the top element or the element being modified. The stack beaker needs to display the full stack contents at each step. Each item has a "val" and a "state" ("active" for pushed/popped/accessed in this step, "idle" for other elements).
2. Use "pointers" to point to stack indices or show pointer labels, e.g., mapping index of the top element to "top".

For Queue algorithms:
1. "queue" represents the ENTIRE queue state at this step. You MUST include ALL elements currently in the queue (from the front element at index 0 to the rear element at the last index). Do NOT just show the front element or the element being modified. The queue pipeline needs to display the full queue contents at each step. Each item has a "val" and a "state" ("active" for enqueued/dequeued/accessed in this step, "idle" for other elements).
2. Use "pointers" to map index 0 to "front" and the last index to "rear".

For ALL categories (Array, Matrix, Graph, String, List, Stack, Queue):
- In the "variables" field of each step, you MUST trace the values of all active variables (e.g., loop variables like 'i', pointers like 'left'/'right', state arrays like 'parent' or 'size', or running sums).
- Format array/matrix states inside "variables" as strings, e.g. "parent": "[0, 0, 1, 3]". This creates a dedicated column for each variable in the dry run trace table!
- For recursive algorithms (e.g., DFS, backtracking, tree traversal, recursion), you MUST include a "callStack" array in each step, representing active stack frames from top (current frame, index 0) to bottom (initial call, last index), showing arguments and local scopes.
- If the algorithm uses two or more data structures simultaneously (e.g., an array and a stack, or a grid matrix and a queue), you MUST populate all relevant fields (e.g. both 'arr' and 'stack', or both 'matrix' and 'queue') in each step so they can be visualized together.
- For heap algorithms (e.g., Heapify, Heap Sort, Priority Queue): represent the heap as both an array ('arr') and a hierarchical tree structure using 'graphLayout' in each step so the student can visualize the array indices and the binary tree structure side-by-side in real-time.
- For linked list algorithms: you MUST trace every single pointer modification (e.g., storing next node, changing next pointers, and shifting pointers like prev, curr, nextTemp, fast, slow) as distinct steps. Do NOT combine these pointer assignments or jump over iterations. Every step must display the complete updated linked list node sequence and the exact location of all active pointers. Make sure next pointers are correctly represented for each node to show reversal.
- CRITICAL: You MUST focus on the "crux" (the core algorithmic concept) of the question and explain it properly, step-by-step, and completely. Do NOT truncate or skip loop iterations or recurse states.
- In the "variables" field of each step, track every loop index (e.g., i, j, mid, left, right) and active variable.
Simulate every step carefully on the requested input array, string, graph, or matrix. Keep messages simple and clear.
IMPORTANT: If the user provides a conceptual custom input or edge case description (like 'empty list', 'single node', 'negative numbers', 'duplicate elements'), you MUST translate this description into a concrete, valid data structure value for simulation (e.g. an empty array '[]' for 'empty list', or a single-element array '[5]' for 'single element', or '[-3, 2, -5]' for 'negative numbers'). Do NOT populate the visualizer fields (like 'arr', 'stack', 'queue', 'linkedList', etc.) with the literal string description of the edge case. They must contain actual simulated data elements.
The 'arr' field in each step MUST be a true JSON array of individual elements (e.g. [5, 2, 9]), NOT an array containing a single combined string (e.g. ["5, 2, 9"] is strictly invalid). Each cell in the visualization must represent exactly one element.
CRITICAL: You MUST focus on the "crux" (the core algorithmic concept) of the question and explain it properly, step-by-step, and completely. Do NOT truncate or skip loop iterations. You MUST generate a COMPLETE, EXTREMELY DETAILED, and GRANULAR step-by-step trace of the ENTIRE algorithm execution from the very first line of execution to the final returned result. Do NOT summarize, do NOT truncate, and do NOT skip any loop iterations, recursion levels, or statements. If the algorithm execution takes 20, 40, or 60 steps to finish on the input, you MUST output all 20, 40, or 60 steps in the 'steps' array. Every single comparison, variable update, pointer movement, or push/pop must be represented as a separate step. Students must be able to follow the algorithm from the very first line of execution to the final return statement, step-by-step, without any jumps. The "msg" field in each step should explain what is happening in plain beginner-friendly English (e.g., "Comparing arr[0]=5 with arr[1]=3. Since 5 > 3, we swap them."). Each step must update the visualization state (arrStates, matrixState, nodeStates, etc.) to reflect exactly what changed. For linked list reversal, you MUST visualize the reversed pointers (using node next pointers pointing backwards) and explain the link-reversal action of each pointer reassignment in plain English in the "msg" field.
If the pasted code is a class constructor or query-based class implementation (e.g. NumMatrix, SegmentTree, Trie, UnionFind) that does not have a main driver or is missing trailing braces (incomplete brackets/braces), do NOT flag it as invalid. Instead, set "isValid": true, specify "isCorrect": false, list the compilation/structural bugs (e.g., "missing closing braces", "no query function"), and generate a complete, corrected version in "correctedCode". Simulate a complete dry-run trace sequence of building the structure step-by-step in the "steps" array (representing row-by-row matrix initialization, tree node insertion, or parent array union actions) so the student can visualize it.
If invalid/not DSA: isValid=false, steps=[].
If bugs: isCorrect=false, list bugs, correctedCode, simulate corrected version.
In "transpiledSolutions", provide clean, working, equivalent implementations of the algorithm in C++ ("cpp"), Python ("python"), Java ("java"), and JavaScript ("javascript"). Transpile the original code if it is correct, or the corrected code if it has bugs.
Formatting of code fields in JSON: In "correctedCode" and all fields under "transpiledSolutions" ("cpp", "python", "java", "javascript"), you MUST format the code with clean, standard spacing, indentation, and newlines ("\n" characters). Do NOT compress the code into a single line or use semicolons to squash blocks of code.
In "quiz", generate exactly 3 thought-provoking, conceptual multiple-choice questions to test the student's high-level algorithmic mindset (e.g., potential bugs, edge cases, loop invariants, or complexity reasoning). Each question must have exactly 4 choices, a correct answer that matches one of the choices exactly, and a helpful explanation.
Formatting of codeLines: You MUST include the complete, line-by-line representation of the user-submitted code (or the corrected version if there are bugs) in the "codeLines" array. Every line of code, including helper function headers, loop headers, variable declarations, branch conditions, inside statements, closing braces, and return statements, must be its own separate element in the "codeLines" array. Do NOT truncate, summarize, or omit any parts of the code. The length of "codeLines" must match the full length of the algorithm code.`;

const DEMOS = {
  remove_dup: {
    label: "C++ Remove Duplicates",
    code: `// C++ - Remove Duplicates from Sorted Array
int removeDuplicates(vector<int>& nums) {
    int count = 1;
    for (int i = 1; i < nums.size(); i++) {
        if (nums[i] != nums[i-1]) {
            nums[count] = nums[i];
            count++;
        }
    }
    return count;
}`
  },
  bubble: {
    label: "C++ Bubble Sort",
    code: `// C++ - Bubble Sort
void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n-1; i++) {
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
}`
  },
  binary: {
    label: "Python Binary Search",
    code: `# Python - Binary Search
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`
  },
  two_sum: {
    label: "JS Two Pointers",
    code: `// JavaScript - Two Pointers
function twoSum(arr, target) {
    let left = 0, right = arr.length - 1;
    while (left < right) {
        let sum = arr[left] + arr[right];
        if (sum === target) return [left, right];
        else if (sum < target) left++;
        else right--;
    }
    return [-1, -1];
}`
  },
  selection: {
    label: "Java Selection Sort",
    code: `// Java - Selection Sort
void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n-1; i++) {
        int minIdx = i;
        for (int j = i+1; j < n; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        int temp = arr[minIdx];
        arr[minIdx] = arr[i];
        arr[i] = temp;
    }
}`
  },
  flood_fill: {
    label: "Python Flood Fill",
    code: `# Python - Flood Fill (Grid DFS)
def floodFill(image, sr, sc, newColor):
    color = image[sr][sc]
    if color == newColor: return image
    def dfs(r, c):
        if image[r][c] == color:
            image[r][c] = newColor
            if r >= 1: dfs(r-1, c)
            if r+1 < len(image): dfs(r+1, c)
            if c >= 1: dfs(r, c-1)
            if c+1 < len(image[0]): dfs(r, c+1)
    dfs(sr, sc)
    return image`
  },
  palindrome: {
    label: "JS Palindrome Check",
    code: `// JavaScript - Palindrome Check (Two Pointers)
function isPalindrome(str) {
    let left = 0;
    let right = str.length - 1;
    while (left < right) {
        if (str[left] !== str[right]) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}`
  },
  reverse_linked_list: {
    label: "C++ Reverse Linked List",
    code: `// C++ - Reverse a Singly Linked List
ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    while (curr != nullptr) {
        ListNode* nextTemp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`
  },
  valid_parentheses: {
    label: "JS Valid Parentheses (Stack)",
    code: `// JavaScript - Check for Valid Parentheses
function isValid(s) {
    let stack = [];
    for (let char of s) {
        if (char === '(' || char === '{' || char === '[') {
            stack.push(char);
        } else {
            if (stack.length === 0) return false;
            let top = stack.pop();
            if (char === ')' && top !== '(') return false;
            if (char === '}' && top !== '{') return false;
            if (char === ']' && top !== '[') return false;
        }
    }
    return stack.length === 0;
}`
  },
  queue_bfs: {
    label: "Python BFS Traversal (Queue)",
    code: `# Python - Breadth First Search using a Queue
def bfs(graph, start_node):
    visited = set([start_node])
    queue = [start_node]
    traversal_order = []
    
    while len(queue) > 0:
        curr = queue.pop(0) # dequeue
        traversal_order.append(curr)
        for neighbor in graph[curr]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor) # enqueue
    return traversal_order`
  }
};

const COLORS = {
  active: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  comparing: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  secondary: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  processing: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  done: { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
  visited: { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
  swapping: { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6" },
  swap: { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6" },
  completed: { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6" },
  skipped: { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
  eliminated: { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
  idle: { bg: "#ffffff", border: "#dadce0", text: "#3c4043" },
};

function cellState(idx, step) {
  if (!step) return "idle";

  // Prioritize explicit arrStates if present
  if (step.arrStates && step.arrStates[idx] !== undefined) {
    return step.arrStates[idx];
  }
  if (step.arrStates && step.arrStates[String(idx)] !== undefined) {
    return step.arrStates[String(idx)];
  }

  // Fallback to legacy arrays
  const i = Number(idx);
  if (step.swap?.includes(i)) return "swapping";
  if (step.swapping?.includes(i)) return "swapping";
  if (step.comparing?.includes(i)) return "comparing";
  if (step.secondary?.includes(i)) return "comparing";
  if (step.eliminated?.includes(i)) return "skipped";
  if (step.skipped?.includes(i)) return "skipped";
  if (step.done?.includes(i)) return "done";
  if (step.active?.includes(i)) return "active";

  return "idle";
}

function getElementColors(val, idx, step, arrayData) {
  const state = cellState(idx, step);
  const s = COLORS[state] || COLORS.idle;

  // Only apply value-based colors if the state is "idle"
  if (state !== "idle") {
    return s;
  }

  // Extract clean value in case it is an object
  const cleanVal = val && typeof val === 'object' && val.val !== undefined ? val.val : val;

  // Check if array is numeric
  const numericValues = arrayData
    .map(v => {
      const cleanV = v && typeof v === 'object' && v.val !== undefined ? v.val : v;
      return typeof cleanV === 'number' ? cleanV : parseFloat(cleanV);
    })
    .filter(v => !isNaN(v));
  const isNumeric = numericValues.length === arrayData.length && arrayData.length > 0;

  if (isNumeric) {
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    if (min !== max) {
      const num = typeof cleanVal === 'number' ? cleanVal : parseFloat(cleanVal);
      const ratio = (num - min) / (max - min);
      // Nice blue-to-indigo-to-purple spectrum (hue 210 to 280)
      const hue = 210 + ratio * 70;
      return {
        bg: `hsl(${hue}, 90%, 96%)`,
        border: `hsl(${hue}, 65%, 82%)`,
        text: `hsl(${hue}, 85%, 25%)`
      };
    }
  } else {
    // Character / String value color hashing
    const strVal = String(cleanVal);
    if (strVal.length > 0) {
      let charCode = strVal.charCodeAt(0);
      // Map closing brackets to opening brackets for color symmetry in matching algorithms
      if (strVal === '}') charCode = '{'.charCodeAt(0);
      if (strVal === ']') charCode = '['.charCodeAt(0);
      if (strVal === ')') charCode = '('.charCodeAt(0);
      if (strVal === '>') charCode = '<'.charCodeAt(0);

      const hue = (charCode * 67) % 360;
      return {
        bg: `hsl(${hue}, 90%, 96%)`,
        border: `hsl(${hue}, 65%, 82%)`,
        text: `hsl(${hue}, 85%, 25%)`
      };
    }
  }

  return s;
}

function ArrayViz({ arr, step, onEdit }) {
  if (!arr) return null;
  const arrayData = Array.isArray(arr)
    ? arr
    : (typeof arr === "string" ? arr.split("") : []);

  const handleCellClick = (idx, val) => {
    if (!onEdit) return;
    const cleanVal = getElementVal(val);
    const newVal = prompt(`Edit cell at index [${idx}]:`, cleanVal);
    if (newVal !== null) {
      onEdit(idx, newVal, arrayData);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-end", minHeight: 84, padding: "6px 0" }}>
      {arrayData.map((item, idx) => {
        const val = getElementVal(item);
        const s = getElementColors(item, idx, step, arrayData);
        const ptr = step.pointers?.[idx] || step.pointers?.[String(idx)];
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: ptr ? "#3b82f6" : "transparent", fontFamily: "monospace", minHeight: 12 }}>{ptr || "."}</span>
            <div
              onClick={() => handleCellClick(idx, item)}
              title="Click to edit value"
              style={{
                width: 42,
                height: 42,
                borderRadius: 9,
                border: `2px solid ${s.border}`,
                background: s.bg,
                color: s.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "monospace",
                transition: "all 0.3s",
                cursor: onEdit ? "pointer" : "default"
              }}
            >
              {val}
            </div>
            <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>[{idx}]</span>
          </div>
        );
      })}
    </div>
  );
}

function BarViz({ arr, step }) {
  if (!arr) return null;
  const values = Array.isArray(arr)
    ? arr
    : (typeof arr === "string" ? arr.split("") : []);

  const cleanValues = values.map(getElementVal);
  const numericValues = cleanValues.map(v => typeof v === 'number' ? v : (typeof v === 'string' && !isNaN(v) && !isNaN(parseFloat(v)) ? parseFloat(v) : 1));
  const maxVal = Math.max(...numericValues, 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, height: 140, padding: "10px 0", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
      {values.map((item, idx) => {
        const val = getElementVal(item);
        const numVal = typeof val === 'number' ? val : (typeof val === 'string' && !isNaN(val) && !isNaN(parseFloat(val)) ? parseFloat(val) : 1);
        const percent = Math.max(10, (numVal / maxVal) * 100);
        const s = getElementColors(item, idx, step, values);

        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: 36, height: "100%", justifyContent: "flex-end" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: s.text, fontFamily: "monospace", marginBottom: 2 }}>{val}</span>
            <div
              style={{
                width: "100%",
                height: `${percent}%`,
                borderRadius: "4px 4px 0 0",
                background: s.bg,
                border: `2px solid ${s.border}`,
                borderBottom: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            />
            <span style={{ fontSize: 8, color: "#94a3b8", fontFamily: "monospace", marginTop: 3 }}>[{idx}]</span>
          </div>
        );
      })}
    </div>
  );
}

function Legend({ category }) {
  const cat = String(category || "").toLowerCase();
  const isGraph = cat.includes("graph") || cat.includes("tree");
  const isMatrix = cat.includes("matrix") || cat.includes("grid");

  let items = [];
  if (isGraph) {
    items = [
      { label: "current / active", ...COLORS.active },
      { label: "processing / neighbors", ...COLORS.secondary },
      { label: "visited / queued", ...COLORS.done },
      { label: "completed / done", ...COLORS.completed },
      { label: "unvisited", ...COLORS.idle }
    ];
  } else if (isMatrix) {
    items = [
      { label: "current / active", ...COLORS.active },
      { label: "processing / next", ...COLORS.secondary },
      { label: "visited", ...COLORS.done },
      { label: "completed / path", ...COLORS.completed },
      { label: "blocked / obstacle", ...COLORS.eliminated }
    ];
  } else {
    items = [
      { label: "active / target", ...COLORS.active },
      { label: "comparing", ...COLORS.secondary },
      { label: "swapping", ...COLORS.swap },
      { label: "sorted / done", ...COLORS.done },
      { label: "skipped / eliminated", ...COLORS.eliminated }
    ];
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 11, height: 11, borderRadius: 3, background: item.bg, border: `1.5px solid ${item.border}` }} />
          <span style={{ fontSize: 10, color: "#64748b", textTransform: "capitalize" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function RecursionStackPanel({ callStack }) {
  if (!callStack || !Array.isArray(callStack) || callStack.length === 0) return null;

  return (
    <div style={{
      marginTop: 12,
      background: "#fafafa",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: "12px 14px",
      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>🥞</span>
        <span>Recursion Call Stack (Depth: {callStack.length})</span>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column-reverse", // Bottom of stack (initial call) at bottom, top of stack (active) at top.
        gap: 4,
        borderLeft: "3px double #cbd5e1",
        paddingLeft: 10,
        maxHeight: 200,
        overflowY: "auto"
      }}>
        {callStack.map((frame, idx) => {
          const isTop = idx === 0;
          return (
            <div
              key={idx}
              style={{
                background: isTop ? "#eff6ff" : "white",
                border: isTop ? "1.5px solid #3b82f6" : "1px solid #e2e8f0",
                borderRadius: 6,
                padding: "6px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.3s",
                boxShadow: isTop ? "0 2px 4px rgba(59,130,246,0.1)" : "none"
              }}
            >
              <span style={{
                fontFamily: "var(--font-code)",
                fontSize: 11,
                fontWeight: isTop ? 700 : 500,
                color: isTop ? "#1d4ed8" : "#334155"
              }}>
                {frame}
              </span>
              <span style={{
                fontSize: 8.5,
                color: isTop ? "#3b82f6" : "#94a3b8",
                fontWeight: 700,
                textTransform: "uppercase"
              }}>
                {isTop ? "⚡ Active" : `depth ${callStack.length - 1 - idx}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GraphViz({ nodeStates = {}, nodeVals = {}, edgeStates = {}, graphLayout, graphEditMode, setCustomInput }) {
  if (!graphLayout) return null;

  const [layout, setLayout] = useState(graphLayout);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    setLayout(graphLayout);
    setSelectedNodeId(null);
  }, [graphLayout]);

  const { nodes = [], edges = [], directed = false } = layout || {};

  const combinedNodes = (nodes || []).map(n => ({
    ...n,
    state: nodeStates[n.id] || "idle",
    val: nodeVals[n.id] || ""
  }));

  let allEdges = [...(edges || [])];
  if (edgeStates) {
    Object.keys(edgeStates).forEach(key => {
      const parts = key.split("-");
      if (parts.length === 2) {
        const from = parts[0];
        const to = parts[1];
        const exists = allEdges.some(e =>
          (e.from === from && e.to === to) || (!directed && e.from === to && e.to === from)
        );
        if (!exists) {
          allEdges.push({ from, to });
        }
      }
    });
  }

  const combinedEdges = allEdges.map(e => {
    const key1 = `${e.from}-${e.to}`;
    const key2 = `${e.to}-${e.from}`;
    const state = edgeStates[key1] || edgeStates[key2] || "idle";
    return {
      ...e,
      state
    };
  });

  function getCoords(pctX, pctY) {
    const x = 30 + (pctX / 100) * 440;
    const y = 30 + (pctY / 100) * 240;
    return { x, y };
  }

  const syncGraphToInput = (updatedLayout) => {
    if (!updatedLayout || !updatedLayout.edges) return;
    const edgeStrings = updatedLayout.edges.map(e => {
      const weightStr = e.weight !== undefined && e.weight !== null ? `(${e.weight})` : "";
      return `${e.from}-${e.to}${weightStr}`;
    });
    setCustomInput(`Graph: ${edgeStrings.join(", ")}`);
  };

  const handleCanvasClick = (e) => {
    if (!graphEditMode) return;
    if (e.target.tagName === "circle" || e.target.tagName === "text") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const pctX = ((mouseX - 30) / 440) * 100;
    const pctY = ((mouseY - 30) / 240) * 100;

    const nodeId = prompt("Enter new Node ID (single letter or number, e.g., D):");
    if (!nodeId) return;
    const cleanId = nodeId.trim().toUpperCase();
    if (cleanId.length === 0) return;

    const currentNodes = nodes || [];
    if (currentNodes.some(n => n.id === cleanId)) {
      alert(`Node ${cleanId} already exists!`);
      return;
    }

    const updated = {
      ...layout,
      nodes: [...currentNodes, { id: cleanId, x: Math.max(5, Math.min(95, pctX)), y: Math.max(5, Math.min(95, pctY)) }]
    };
    setLayout(updated);
    syncGraphToInput(updated);
  };

  const handleNodeClick = (nodeId) => {
    if (!graphEditMode) return;
    if (selectedNodeId === null) {
      setSelectedNodeId(nodeId);
    } else {
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      } else {
        const weightInput = prompt(`Connect ${selectedNodeId} to ${nodeId}. Enter edge weight (leave empty for none):`);
        if (weightInput !== null) {
          const weightVal = weightInput.trim() === "" ? undefined : parseInt(weightInput, 10);
          const currentEdges = edges || [];
          const exists = currentEdges.some(e =>
            (e.from === selectedNodeId && e.to === nodeId) || (!directed && e.from === nodeId && e.to === selectedNodeId)
          );
          if (exists) {
            alert("Edge already exists!");
            setSelectedNodeId(null);
            return;
          }
          const updated = {
            ...layout,
            edges: [...currentEdges, { from: selectedNodeId, to: nodeId, weight: weightVal }]
          };
          setLayout(updated);
          syncGraphToInput(updated);
        }
        setSelectedNodeId(null);
      }
    }
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    setHasDragged(false);
  };

  const handleCanvasMouseMove = (e) => {
    if (!draggedNodeId) return;
    setHasDragged(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const pctX = Math.max(5, Math.min(95, ((mouseX - 30) / 440) * 100));
    const pctY = Math.max(5, Math.min(95, ((mouseY - 30) / 240) * 100));

    setLayout(prev => {
      if (!prev) return prev;
      const updatedNodes = prev.nodes.map(n =>
        n.id === draggedNodeId ? { ...n, x: pctX, y: pctY } : n
      );
      return { ...prev, nodes: updatedNodes };
    });
  };

  const handleCanvasMouseUp = () => {
    if (draggedNodeId) {
      if (!hasDragged) {
        handleNodeClick(draggedNodeId);
      }
      setDraggedNodeId(null);
    }
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden", padding: 12 }}>
      <svg
        viewBox="0 0 500 300"
        style={{ width: "100%", height: "auto", display: "block", cursor: graphEditMode ? "crosshair" : "default" }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
          </marker>
          <marker id="arrow-highlighted" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
          </marker>
          <marker id="arrow-visited" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
          </marker>
        </defs>

        {/* Render edges */}
        {combinedEdges.map((edge, idx) => {
          const startNode = nodes.find(n => n.id === edge.from);
          const endNode = nodes.find(n => n.id === edge.to);
          if (!startNode || !endNode) return null;

          const p1 = getCoords(startNode.x, startNode.y);
          const p2 = getCoords(endNode.x, endNode.y);

          const isHighlighted = edge.state === "highlighted" || edge.state === "active";
          const isVisited = edge.state === "visited";

          let strokeColor = "#cbd5e1";
          let strokeWidth = "2";
          let marker = directed ? "url(#arrow)" : null;

          if (isHighlighted) {
            strokeColor = "#3b82f6";
            strokeWidth = "3";
            marker = directed ? "url(#arrow-highlighted)" : null;
          } else if (isVisited) {
            strokeColor = "#10b981";
            strokeWidth = "2.5";
            marker = directed ? "url(#arrow-visited)" : null;
          }

          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          return (
            <g key={`edge-${idx}`}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                markerEnd={marker}
                style={{ transition: "all 0.3s" }}
              />
              {edge.weight !== undefined && edge.weight !== null && (
                <g>
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fontWeight="700"
                    fill="#334155"
                    stroke="#ffffff"
                    strokeWidth="3"
                    paintOrder="stroke fill"
                  >
                    {edge.weight}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Render nodes */}
        {combinedNodes.map((node, idx) => {
          const { x, y } = getCoords(node.x, node.y);
          const state = node.state || "idle";

          const normalizedState =
            state === "done" ? "completed" :
              state === "visited" ? "visited" :
                (state === "processing" || state === "secondary") ? "processing" :
                  state;
          const s = COLORS[normalizedState] || COLORS.idle;
          let bgColor = s.bg;
          let borderColor = s.border;
          let textColor = s.text;
          let secTextColor = s.text;

          const isSelected = selectedNodeId === node.id;

          return (
            <g
              key={`node-${node.id}`}
              transform={`translate(${x}, ${y})`}
              style={{ cursor: graphEditMode ? "pointer" : "default" }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              <circle
                r="18"
                fill={bgColor}
                stroke={isSelected ? "#3b82f6" : borderColor}
                strokeWidth={isSelected ? "4.5" : "2.5"}
                style={{ transition: "all 0.3s", filter: (state !== "idle" || isSelected) ? "drop-shadow(0px 2px 4px rgba(0,0,0,0.05))" : "none" }}
              />
              <text
                textAnchor="middle"
                y={node.val ? "-2" : "3"}
                fontSize="10"
                fontWeight="800"
                fill={textColor}
                style={{ fontFamily: "var(--font-ui)", userSelect: "none" }}
              >
                {node.id}
              </text>
              {node.val && (
                <text
                  textAnchor="middle"
                  y="10"
                  fontSize="7"
                  fontWeight="600"
                  fill={secTextColor}
                  style={{ fontFamily: "var(--font-code)", userSelect: "none" }}
                >
                  {node.val}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MatrixViz({ matrix, step, onEdit }) {
  if (!matrix) return null;

  const handleCellClick = (rIdx, cIdx, val) => {
    if (!onEdit) return;
    const isBinary = matrix.every(row => row.every(v => v === 0 || v === 1 || v === "0" || v === "1"));
    if (isBinary) {
      const toggled = Number(val) === 0 ? 1 : 0;
      onEdit(rIdx, cIdx, toggled, matrix);
    } else {
      const newVal = prompt(`Edit cell at [${rIdx}][${cIdx}]:`, val);
      if (newVal !== null) {
        onEdit(rIdx, cIdx, newVal, matrix);
      }
    }
  };
  const matrixState = step.matrixState || {};
  const matrixVals = step.matrixVals || {};

  return (
    <div style={{ padding: "10px 0", overflowX: "auto", width: "100%" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: "4px", margin: "0 auto" }}>
        <thead>
          <tr>
            <th style={{ width: 20 }}></th>
            {matrix[0]?.map((_, cIdx) => (
              <th key={cIdx} style={{ fontSize: 9, color: "#94a3b8", fontFamily: "monospace", fontWeight: 400, textAlign: "center", paddingBottom: 2 }}>
                {cIdx}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rIdx) => (
            <tr key={rIdx}>
              <td style={{ fontSize: 9, color: "#94a3b8", fontFamily: "monospace", textAlign: "right", paddingRight: 6, verticalAlign: "middle" }}>
                {rIdx}
              </td>
              {row.map((val, cIdx) => {
                const key = `${rIdx}-${cIdx}`;
                const state = matrixState[key] || "idle";
                const s = COLORS[state] || COLORS.idle;
                const extraVal = matrixVals[key];
                const displayVal = String(val === undefined || val === null ? "" : val);

                return (
                  <td key={cIdx} style={{ padding: 0 }}>
                    <div
                      onClick={() => handleCellClick(rIdx, cIdx, val)}
                      style={{
                        minWidth: 40,
                        height: 40,
                        padding: "0 6px",
                        borderRadius: 4,
                        border: `2px solid ${s.border}`,
                        background: s.bg,
                        color: s.text,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: displayVal.length > 5 ? 9 : 12,
                        fontWeight: 700,
                        fontFamily: "monospace",
                        position: "relative",
                        transition: "all 0.3s",
                        boxSizing: "border-box",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        cursor: onEdit ? "pointer" : "default"
                      }}
                      title={onEdit ? `Click to edit/toggle [${rIdx}][${cIdx}]` : `Cell [${rIdx}][${cIdx}]: ${displayVal}`}
                    >
                      <span>{displayVal}</span>
                      {extraVal && (
                        <span style={{ fontSize: 7, color: "#94a3b8", position: "absolute", bottom: 1, right: 2 }}>
                          {extraVal}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OperationVisualizer({ stepIdx, steps, currentType, analysis }) {
  if (stepIdx === null || stepIdx === undefined || !steps || steps.length === 0) return null;
  const cur = steps[stepIdx];
  const prev = stepIdx > 0 ? steps[stepIdx - 1] : null;

  let op = "IDLE";
  let val = "";
  let details = "";
  let icon = "⚙️";

  // Determine op & details based on currentType
  if (currentType === "stack") {
    const curStack = cur?.stack || [];
    const prevStack = prev?.stack || [];
    const curLen = curStack.length;
    const prevLen = prevStack.length;

    if (curLen > prevLen) {
      op = "PUSH";
      val = getElementVal(curStack[curLen - 1]);
      details = `Pushing element "${val}" onto the stack.`;
      icon = "📥";
    } else if (curLen < prevLen) {
      op = "POP";
      val = getElementVal(prevStack[prevLen - 1]);
      details = `Popping element "${val}" from the stack.`;
      icon = "📤";
    } else {
      const msgLower = (cur?.msg || "").toLowerCase();
      if (msgLower.includes("push")) {
        op = "PUSH";
        val = curStack.length > 0 ? getElementVal(curStack[curStack.length - 1]) : "";
        details = cur.msg;
        icon = "📥";
      } else if (msgLower.includes("pop")) {
        op = "POP";
        val = prevStack.length > 0 ? getElementVal(prevStack[prevStack.length - 1]) : "";
        details = cur.msg;
        icon = "📤";
      } else if (msgLower.includes("peek") || msgLower.includes("top")) {
        op = "PEEK";
        val = curStack.length > 0 ? getElementVal(curStack[curStack.length - 1]) : "";
        details = `Checking the top element of the stack: "${val}".`;
        icon = "🔍";
      } else {
        op = "TRAVERSE";
        details = cur.msg || "Accessing stack.";
        icon = "👣";
      }
    }
  } else if (currentType === "queue") {
    const curQueue = cur?.queue || [];
    const prevQueue = prev?.queue || [];
    const curLen = curQueue.length;
    const prevLen = prevQueue.length;

    if (curLen > prevLen) {
      op = "ENQUEUE";
      val = getElementVal(curQueue[curLen - 1]);
      details = `Adding value "${val}" to the rear of the queue.`;
      icon = "📥";
    } else if (curLen < prevLen) {
      op = "DEQUEUE";
      val = getElementVal(prevQueue[0]);
      details = `Removing value "${val}" from the front of the queue.`;
      icon = "📤";
    } else {
      const msgLower = (cur?.msg || "").toLowerCase();
      if (msgLower.includes("enqueue") || msgLower.includes("push") || msgLower.includes("add")) {
        op = "ENQUEUE";
        val = curQueue.length > 0 ? getElementVal(curQueue[curQueue.length - 1]) : "";
        details = cur.msg;
        icon = "📥";
      } else if (msgLower.includes("dequeue") || msgLower.includes("pop") || msgLower.includes("remove")) {
        op = "DEQUEUE";
        val = prevQueue.length > 0 ? getElementVal(prevQueue[0]) : "";
        details = cur.msg;
        icon = "📤";
      } else {
        op = "TRAVERSE";
        details = cur.msg || "Accessing queue.";
        icon = "👣";
      }
    }
  } else if (currentType === "linkedlist") {
    const curList = cur?.linkedList || [];
    const prevList = prev?.linkedList || [];
    const curLen = curList.length;
    const prevLen = prevList.length;

    if (curLen > prevLen) {
      op = "INSERT";
      const prevIds = prevList.map(n => n.id);
      const insertedNode = curList.find(n => !prevIds.includes(n.id)) || curList[curList.length - 1];
      val = getElementVal(insertedNode);
      details = `Inserting node with value "${val}".`;
      icon = "➕";
    } else if (curLen < prevLen) {
      op = "DELETE";
      const curIds = curList.map(n => n.id);
      const deletedNode = prevList.find(n => !curIds.includes(n.id)) || prevList[0];
      val = getElementVal(deletedNode);
      details = `Deleting node with value "${val}".`;
      icon = "➖";
    } else if ((cur?.msg || "").toLowerCase().includes("reverse")) {
      op = "REVERSE";
      details = cur.msg;
      icon = "🔄";
    } else {
      op = "TRAVERSE";
      details = cur.msg || "Traversing linked list.";
      icon = "👣";
    }
  } else if (currentType === "matrix") {
    const activeKey = Object.keys(cur?.matrixState || {}).find(k =>
      cur.matrixState[k] === "active" || cur.matrixState[k] === "processing" || cur.matrixState[k] === "visited"
    );

    let changedKey = null;
    let prevCellVal = undefined;
    let newCellVal = undefined;

    if (cur?.matrix && prev?.matrix) {
      for (let r = 0; r < cur.matrix.length; r++) {
        for (let c = 0; c < (cur.matrix[r]?.length || 0); c++) {
          if (prev.matrix[r]?.[c] !== cur.matrix[r][c]) {
            changedKey = `${r}-${c}`;
            prevCellVal = prev.matrix[r][c];
            newCellVal = cur.matrix[r][c];
            break;
          }
        }
        if (changedKey) break;
      }
    }

    if (changedKey) {
      op = "UPDATE CELL";
      const [r, c] = changedKey.split("-").map(Number);
      val = `[${r}][${c}]`;
      details = `Updated cell grid[${r}][${c}] from "${prevCellVal}" to "${newCellVal}".`;
      icon = "✏️";
    } else if (activeKey) {
      op = "VISIT CELL";
      const [r, c] = activeKey.split("-").map(Number);
      val = `[${r}][${c}]`;
      const cellVal = cur.matrixVals?.[activeKey] !== undefined ? cur.matrixVals[activeKey] : (cur.matrix?.[r]?.[c] !== undefined ? cur.matrix[r][c] : "");
      details = `Visiting cell grid[${r}][${c}] with value "${cellVal}".`;
      icon = "🔍";
    } else {
      op = "TRAVERSE";
      details = cur?.msg || "Processing grid matrix.";
      icon = "👣";
    }
  } else if (currentType === "graph") {
    const activeEdgeKey = Object.keys(cur?.edgeStates || {}).find(k =>
      cur.edgeStates[k] === "highlighted" || cur.edgeStates[k] === "visited"
    );
    const activeNodeKey = Object.keys(cur?.nodeStates || {}).find(k =>
      cur.nodeStates[k] === "active" || cur.nodeStates[k] === "processing" || cur.nodeStates[k] === "visited"
    );

    if (activeEdgeKey) {
      op = "TRAVERSE EDGE";
      val = activeEdgeKey;
      details = `Traversing edge ${activeEdgeKey} in graph.`;
      icon = "🔄";
    } else if (activeNodeKey) {
      op = "VISIT NODE";
      val = activeNodeKey;
      details = `Visiting node ${activeNodeKey} in graph.`;
      icon = "🟢";
    } else {
      op = "TRAVERSE";
      details = cur?.msg || "Traversing graph structures.";
      icon = "👣";
    }
  } else {
    const comparingIdxs = [];
    if (cur?.arrStates) {
      Object.entries(cur.arrStates).forEach(([idx, state]) => {
        if (state === "comparing") {
          comparingIdxs.push(Number(idx));
        }
      });
    }

    const swappingIdxs = [];
    if (cur?.arrStates) {
      Object.entries(cur.arrStates).forEach(([idx, state]) => {
        if (state === "swapping" || state === "swap") {
          swappingIdxs.push(Number(idx));
        }
      });
    }

    let changedIdx = -1;
    if (cur?.arr && prev?.arr && cur.arr.length === prev.arr.length) {
      changedIdx = cur.arr.findIndex((v, i) => prev.arr[i] !== v);
    }

    const msgLower = (cur?.msg || "").toLowerCase();

    if (swappingIdxs.length >= 2) {
      op = "SWAP";
      details = `Swapping element at index ${swappingIdxs[0]} and ${swappingIdxs[1]}.`;
      icon = "🔄";
    } else if (comparingIdxs.length >= 2) {
      op = "COMPARE";
      details = `Comparing element at index ${comparingIdxs[0]} and ${comparingIdxs[1]}.`;
      icon = "🔍";
    } else if (changedIdx !== -1) {
      op = "UPDATE";
      details = `Updated index ${changedIdx} value to "${cur.arr[changedIdx]}".`;
      icon = "✏️";
    } else if (msgLower.includes("swap")) {
      op = "SWAP";
      details = cur.msg;
      icon = "🔄";
    } else if (msgLower.includes("compare") || msgLower.includes("check")) {
      op = "COMPARE";
      details = cur.msg;
      icon = "🔍";
    } else if (msgLower.includes("update") || msgLower.includes("set") || msgLower.includes("assign")) {
      op = "UPDATE";
      details = cur.msg;
      icon = "✏️";
    } else {
      const activeIdx = cur?.arrStates ? Object.keys(cur.arrStates).find(k => cur.arrStates[k] === "active") : null;
      if (activeIdx !== null && activeIdx !== undefined) {
        op = "TRAVERSE";
        details = `Accessing element at index ${activeIdx}.`;
        icon = "👣";
      } else {
        op = "TRAVERSE";
        details = cur?.msg || "Processing array elements.";
        icon = "👣";
      }
    }
  }

  const renderStackSchematic = (stackItems, action, actionItem) => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 30, padding: 10 }}>
        <div style={{
          position: "relative",
          width: 80,
          height: 110,
          borderLeft: "3.5px solid #475569",
          borderRight: "3.5px solid #475569",
          borderBottom: "3.5px solid #475569",
          borderRadius: "0 0 8px 8px",
          background: "rgba(241, 245, 249, 0.5)",
          display: "flex",
          flexDirection: "column-reverse",
          justifyContent: "flex-start",
          padding: 4,
          gap: 4
        }}>
          {stackItems.length === 0 && action !== "push" ? (
            <div style={{ fontSize: 8, color: "#94a3b8", textAlign: "center", marginTop: 45, textTransform: "uppercase" }}>Empty</div>
          ) : (
            stackItems.map((v, idx) => (
              <div key={idx} style={{
                width: "100%",
                height: 22,
                borderRadius: 4,
                border: "1.5px solid #cbd5e1",
                background: "white",
                color: "#334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 800,
                fontFamily: "monospace"
              }}>
                {v}
              </div>
            ))
          )}
        </div>

        {action === "push" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#16a34a" }}>PUSHING</span>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ transform: "rotate(90deg)" }}>
                <path d="M5 12h14M13 5l7 7-7 7" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "2px solid #22c55e",
              background: "#f0fdf4",
              color: "#16a34a",
              fontWeight: 800,
              fontSize: 12,
              fontFamily: "monospace",
              boxShadow: "0 4px 6px -1px rgba(34,197,94,0.2)"
            }}>
              {actionItem}
            </div>
          </div>
        )}

        {action === "pop" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#dc2626" }}>POPPED</span>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ transform: "rotate(-90deg)" }}>
                <path d="M5 12h14M13 5l7 7-7 7" stroke="#dc2626" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "2px solid #ef4444",
              background: "#fef2f2",
              color: "#dc2626",
              fontWeight: 800,
              fontSize: 12,
              fontFamily: "monospace",
              boxShadow: "0 4px 6px -1px rgba(239,68,68,0.2)"
            }}>
              {actionItem}
            </div>
          </div>
        )}

        {action === "peek" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#2563eb" }}>PEEKING</span>
              <span style={{ fontSize: 12 }}>👁️</span>
            </div>
            <div style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "2px solid #3b82f6",
              background: "#eff6ff",
              color: "#2563eb",
              fontWeight: 800,
              fontSize: 12,
              fontFamily: "monospace",
              boxShadow: "0 4px 6px -1px rgba(59,130,246,0.2)"
            }}>
              {actionItem}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQueueSchematic = (queueItems, action, actionItem) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 10, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", justifyContent: "center" }}>
          {action === "dequeue" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "2px solid #ef4444",
                background: "#fef2f2",
                color: "#dc2626",
                fontWeight: 800,
                fontSize: 11,
                fontFamily: "monospace",
                boxShadow: "0 2px 4px rgba(239,68,68,0.15)"
              }}>
                {actionItem}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#dc2626" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 8, fontWeight: 700, color: "#dc2626" }}>DEQUEUED</span>
              </div>
            </div>
          )}

          <div style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            height: 46,
            minWidth: 120,
            borderTop: "3px solid #475569",
            borderBottom: "3px solid #475569",
            background: "rgba(241, 245, 249, 0.5)",
            padding: "0 8px",
            gap: 6,
            borderRadius: 4
          }}>
            {queueItems.length === 0 ? (
              <div style={{ fontSize: 8, color: "#94a3b8", width: "100%", textAlign: "center", textTransform: "uppercase" }}>Empty</div>
            ) : (
              queueItems.map((v, idx) => (
                <div key={idx} style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  border: "1.5px solid #cbd5e1",
                  background: "white",
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: "monospace"
                }}>
                  {v}
                </div>
              ))
            )}
          </div>

          {action === "enqueue" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "2px solid #22c55e",
                background: "#f0fdf4",
                color: "#16a34a",
                fontWeight: 800,
                fontSize: 11,
                fontFamily: "monospace",
                boxShadow: "0 2px 4px rgba(34,197,94,0.15)"
              }}>
                {actionItem}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" style={{ transform: "rotate(180deg)", transformOrigin: "center" }} />
                </svg>
                <span style={{ fontSize: 8, fontWeight: 700, color: "#16a34a" }}>ENQUEUING</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderListSchematic = (listNodes, action, actionItem, metadata = {}) => {
    if (action === "reverse") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 8, color: "#64748b", fontFamily: "monospace", fontWeight: 700 }}>PREV</span>
            <div style={{ padding: "4px 8px", border: "1.5px solid #cbd5e1", borderRadius: 6, background: "white", fontSize: 11, fontWeight: 800, fontFamily: "monospace" }}>
              {metadata.prevVal || "NULL"}
            </div>
          </div>

          <svg width="34" height="24" viewBox="0 0 34 24">
            <path d="M28 12H6M11 7l-5 5 5 5" stroke="#a855f7" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x="10" y="22" fill="#a855f7" fontSize="8" fontWeight="800" fontFamily="monospace">new</text>
          </svg>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 8, color: "#a855f7", fontFamily: "monospace", fontWeight: 800 }}>CURR</span>
            <div style={{ padding: "4px 8px", border: "2px solid #a855f7", borderRadius: 6, background: "#f3e8ff", color: "#6b21a8", fontSize: 11, fontWeight: 800, fontFamily: "monospace" }}>
              {metadata.currVal || "?"}
            </div>
          </div>

          <svg width="34" height="24" viewBox="0 0 34 24" style={{ opacity: 0.5 }}>
            <path d="M6 12h22M23 7l5 5-5 5" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 6l10 12" stroke="#ef4444" strokeWidth="2" />
            <text x="10" y="22" fill="#ef4444" fontSize="8" fontWeight="800" fontFamily="monospace">cut</text>
          </svg>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.6 }}>
            <span style={{ fontSize: 8, color: "#64748b", fontFamily: "monospace", fontWeight: 700 }}>NEXTTEMP</span>
            <div style={{ padding: "4px 8px", border: "1.5px solid #cbd5e1", borderRadius: 6, background: "white", fontSize: 11, fontWeight: 800, fontFamily: "monospace" }}>
              {metadata.nextTempVal || "NULL"}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 0", alignItems: "center", justifyContent: "center", padding: 8, width: "100%" }}>
        {listNodes.map((node, idx) => {
          const vText = getElementVal(node);
          const nodeId = node && typeof node === "object" ? node.id : idx;
          const isTarget = String(nodeId) === String(actionItem) || String(vText) === String(actionItem);

          let borderStyle = "1.5px solid #cbd5e1";
          let bgStyle = "white";
          let colorStyle = "#334155";
          let scale = "1";

          if (isTarget) {
            if (action === "insert") {
              borderStyle = "2px solid #22c55e";
              bgStyle = "#f0fdf4";
              colorStyle = "#16a34a";
              scale = "1.05";
            } else if (action === "delete") {
              borderStyle = "2px dashed #ef4444";
              bgStyle = "#fef2f2";
              colorStyle = "#dc2626";
              scale = "0.95";
            } else {
              borderStyle = "2px solid #3b82f6";
              bgStyle = "#e8f0fe";
              colorStyle = "#1a73e8";
              scale = "1.05";
            }
          }

          return (
            <div key={idx} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                display: "flex",
                borderRadius: 6,
                border: borderStyle,
                background: bgStyle,
                color: colorStyle,
                overflow: "hidden",
                boxShadow: isTarget ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                transform: `scale(${scale})`,
                transition: "all 0.2s"
              }}>
                <div style={{ padding: "4px 8px", fontSize: 11, fontWeight: 800, fontFamily: "monospace" }}>
                  {vText}
                </div>
                <div style={{
                  padding: "4px 5px",
                  background: "rgba(0,0,0,0.03)",
                  borderLeft: borderStyle,
                  fontSize: 8,
                  fontFamily: "monospace"
                }}>
                  next
                </div>
              </div>

              {idx < listNodes.length - 1 ? (
                <svg width="20" height="16" viewBox="0 0 20 16" style={{ margin: "0 2px" }}>
                  <path d="M2 8h14M10 3l5 5-5 5" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              ) : (
                <span style={{ fontSize: 8, color: "#94a3b8", marginLeft: 4, fontWeight: 700, fontFamily: "monospace" }}>➔ NULL</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCompareSchematic = (valA, valB, ptrA, ptrB, idxA, idxB, operator = "==") => {
    let result = null;
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);
    if (!isNaN(numA) && !isNaN(numB)) {
      if (operator === "==") result = numA === numB;
      else if (operator === ">") result = numA > numB;
      else if (operator === "<") result = numA < numB;
      else if (operator === ">=") result = numA >= numB;
      else if (operator === "<=") result = numA <= numB;
      else if (operator === "!=") result = numA !== numB;
    } else if (valA !== undefined && valB !== undefined) {
      if (operator === "==") result = String(valA) === String(valB);
      else if (operator === "!=") result = String(valA) !== String(valB);
    }

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 8.5, color: "#64748b", fontFamily: "monospace", fontWeight: 700 }}>
            {ptrA ? `${ptrA} (arr[${idxA}])` : `arr[${idxA}]`}
          </span>
          <div style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "2px solid #f59e0b",
            background: "#fffbeb",
            color: "#b45309",
            fontWeight: 800,
            fontSize: 13,
            fontFamily: "monospace"
          }}>
            {valA}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#fef3c7",
            border: "1.5px solid #f59e0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 12,
            color: "#d97706",
            fontFamily: "monospace"
          }}>
            {operator}
          </div>
          {result !== null && (
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              padding: "2px 6px",
              borderRadius: 4,
              background: result ? "#e6f4ea" : "#fce8e6",
              color: result ? "#137333" : "#c5221f"
            }}>
              {result ? "True" : "False"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 8.5, color: "#64748b", fontFamily: "monospace", fontWeight: 700 }}>
            {ptrB ? `${ptrB} (arr[${idxB}])` : `arr[${idxB}]`}
          </span>
          <div style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "2px solid #f59e0b",
            background: "#fffbeb",
            color: "#b45309",
            fontWeight: 800,
            fontSize: 13,
            fontFamily: "monospace"
          }}>
            {valB}
          </div>
        </div>
      </div>
    );
  };

  const renderSwapSchematic = (valA, valB, ptrA, ptrB, idxA, idxB) => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 8.5, color: "#64748b", fontFamily: "monospace", fontWeight: 700 }}>
            {ptrA ? `${ptrA} (arr[${idxA}])` : `arr[${idxA}]`}
          </span>
          <div style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "2px solid #a855f7",
            background: "#f3e8ff",
            color: "#6b21a8",
            fontWeight: 800,
            fontSize: 13,
            fontFamily: "monospace",
            boxShadow: "0 0 10px rgba(168,85,247,0.15)"
          }}>
            {valA}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <svg width="36" height="24" viewBox="0 0 36 24">
            <path d="M4 8c8-6 20-6 28 0M32 16C24 22 12 22 4 16" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M28 8h4V4M8 16H4v4" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 8, fontWeight: 800, color: "#a855f7", letterSpacing: 0.5 }}>SWAPPING</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 8.5, color: "#64748b", fontFamily: "monospace", fontWeight: 700 }}>
            {ptrB ? `${ptrB} (arr[${idxB}])` : `arr[${idxB}]`}
          </span>
          <div style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "2px solid #a855f7",
            background: "#f3e8ff",
            color: "#6b21a8",
            fontWeight: 800,
            fontSize: 13,
            fontFamily: "monospace",
            boxShadow: "0 0 10px rgba(168,85,247,0.15)"
          }}>
            {valB}
          </div>
        </div>
      </div>
    );
  };

  const renderUpdateSchematic = (idx, prevVal, newVal, ptrText) => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 8.5, color: "#64748b", fontFamily: "monospace", fontWeight: 700 }}>
            {ptrText ? `${ptrText} (arr[${idx}])` : `arr[${idx}]`}
          </span>
          <div style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1.5px solid #cbd5e1",
            background: "#f8fafc",
            color: "#64748b",
            fontWeight: 800,
            fontSize: 12,
            fontFamily: "monospace"
          }}>
            {prevVal !== undefined ? prevVal : "?"}
          </div>
        </div>

        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M5 12h14M13 5l7 7-7 7" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 8.5, color: "#3b82f6", fontFamily: "monospace", fontWeight: 800 }}>NEW VALUE</span>
          <div style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: "2px solid #3b82f6",
            background: "#e8f0fe",
            color: "#1a73e8",
            fontWeight: 800,
            fontSize: 13,
            fontFamily: "monospace",
            boxShadow: "0 0 8px rgba(59,130,246,0.2)"
          }}>
            {newVal}
          </div>
        </div>
      </div>
    );
  };

  const renderTraverseSchematic = (idx, val, ptrText) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 0" }}>
        <span style={{ fontSize: 9, color: "#2563eb", fontFamily: "monospace", fontWeight: 800 }}>
          {ptrText ? `VISITING: ${ptrText} (Index ${idx})` : `VISITING: Index ${idx}`}
        </span>
        <div style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "2px solid #3b82f6",
          background: "#e8f0fe",
          color: "#1a73e8",
          fontWeight: 800,
          fontSize: 14,
          fontFamily: "monospace"
        }}>
          {val}
        </div>
      </div>
    );
  };

  const renderMatrixCellSchematic = (row, col, prevVal, newVal, action) => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 8.5, color: "#64748b", fontFamily: "monospace", fontWeight: 700 }}>
            CELL [{row}][{col}]
          </span>
          <div style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: action === "update" ? "1.5px solid #cbd5e1" : "2px solid #3b82f6",
            background: action === "update" ? "#f8fafc" : "#e8f0fe",
            color: action === "update" ? "#64748b" : "#1a73e8",
            fontWeight: 800,
            fontSize: 12,
            fontFamily: "monospace"
          }}>
            {prevVal !== undefined ? prevVal : "?"}
          </div>
        </div>

        {action === "update" && (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 8.5, color: "#22c55e", fontFamily: "monospace", fontWeight: 800 }}>UPDATED</span>
              <div style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "2px solid #22c55e",
                background: "#f0fdf4",
                color: "#16a34a",
                fontWeight: 800,
                fontSize: 12,
                fontFamily: "monospace",
                boxShadow: "0 0 8px rgba(34,197,94,0.15)"
              }}>
                {newVal}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderGraphSchematic = (nodeU, nodeV, edgeWeight, activeNode, nodeValU, nodeValV, action) => {
    if (action === "edge") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "2px solid #3b82f6",
              background: "#e8f0fe",
              color: "#1a73e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              fontFamily: "monospace"
            }}>
              {nodeU}
            </div>
            {nodeValU !== undefined && (
              <span style={{ fontSize: 8, color: "#64748b", fontFamily: "monospace" }}>{nodeValU}</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", width: 60 }}>
            {edgeWeight !== undefined && (
              <span style={{ fontSize: 8.5, background: "white", padding: "1px 4px", border: "1px solid #cbd5e1", borderRadius: 4, position: "absolute", top: -14, fontWeight: 700, fontFamily: "monospace" }}>
                w={edgeWeight}
              </span>
            )}
            <svg width="60" height="12" viewBox="0 0 60 12">
              <path d="M2 6h56M50 2l6 4-6 4" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 7, fontWeight: 800, color: "#3b82f6", letterSpacing: 0.5 }}>TRAVERSING</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "2px solid #cbd5e1",
              background: "white",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              fontFamily: "monospace"
            }}>
              {nodeV}
            </div>
            {nodeValV !== undefined && (
              <span style={{ fontSize: 8, color: "#64748b", fontFamily: "monospace" }}>{nodeValV}</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 0" }}>
        <span style={{ fontSize: 8.5, color: "#16a34a", fontFamily: "monospace", fontWeight: 800 }}>VISITING NODE</span>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          border: "2.5px solid #22c55e",
          background: "#f0fdf4",
          color: "#16a34a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 800,
          fontFamily: "monospace",
          boxShadow: "0 0 10px rgba(34,197,94,0.2)"
        }}>
          {activeNode}
        </div>
        {nodeValU !== undefined && (
          <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", fontFamily: "monospace" }}>Value: {nodeValU}</span>
        )}
      </div>
    );
  };

  if (op === "IDLE") return null;

  const renderVisual = () => {
    const cardStyle = {
      padding: "6px 12px",
      borderRadius: 6,
      background: "#3b82f6",
      color: "white",
      fontWeight: 700,
      fontFamily: "monospace",
      boxShadow: "0 2px 4px rgba(59,130,246,0.2)"
    };

    const containerStyle = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      background: "white",
      padding: "12px 18px",
      borderRadius: 8,
      border: "1px solid #cbd5e1",
      width: "100%",
      minHeight: 110
    };

    if (currentType === "stack") {
      const curStack = cur?.stack || [];
      if (op === "PUSH") {
        const itemsBefore = curStack.slice(0, curStack.length - 1).map(getElementVal);
        return (
          <div style={containerStyle}>
            {renderStackSchematic(itemsBefore, "push", val)}
          </div>
        );
      } else if (op === "POP") {
        const itemsAfter = curStack.map(getElementVal);
        return (
          <div style={containerStyle}>
            {renderStackSchematic(itemsAfter, "pop", val)}
          </div>
        );
      } else if (op === "PEEK") {
        const items = curStack.map(getElementVal);
        return (
          <div style={containerStyle}>
            {renderStackSchematic(items, "peek", val)}
          </div>
        );
      } else {
        const items = curStack.map(getElementVal);
        return (
          <div style={containerStyle}>
            {renderStackSchematic(items, "idle", "")}
          </div>
        );
      }
    }

    if (currentType === "queue") {
      const curQueue = cur?.queue || [];
      if (op === "ENQUEUE") {
        const itemsBefore = curQueue.slice(0, curQueue.length - 1).map(getElementVal);
        return (
          <div style={containerStyle}>
            {renderQueueSchematic(itemsBefore, "enqueue", val)}
          </div>
        );
      } else if (op === "DEQUEUE") {
        const itemsAfter = curQueue.map(getElementVal);
        return (
          <div style={containerStyle}>
            {renderQueueSchematic(itemsAfter, "dequeue", val)}
          </div>
        );
      } else {
        const items = curQueue.map(getElementVal);
        return (
          <div style={containerStyle}>
            {renderQueueSchematic(items, "idle", "")}
          </div>
        );
      }
    }

    if (currentType === "linkedlist") {
      const curList = cur?.linkedList || [];
      const prevList = prev?.linkedList || [];

      if (op === "INSERT") {
        return (
          <div style={containerStyle}>
            {renderListSchematic(curList, "insert", val)}
          </div>
        );
      } else if (op === "DELETE") {
        return (
          <div style={containerStyle}>
            {renderListSchematic(prevList, "delete", val)}
          </div>
        );
      } else if (op === "REVERSE") {
        const prevVarVal = cur?.variables?.["prev"] || "";
        const currVarVal = cur?.variables?.["curr"] || "";
        const nextTempVarVal = cur?.variables?.["nextTemp"] || "";
        return (
          <div style={containerStyle}>
            {renderListSchematic([], "reverse", "", {
              prevVal: prevVarVal,
              currVal: currVarVal,
              nextTempVal: nextTempVarVal
            })}
          </div>
        );
      } else {
        const activeNode = curList.find(n => n.state === "active" || n.state === "comparing");
        const activeVal = activeNode ? getElementVal(activeNode) : "";
        return (
          <div style={containerStyle}>
            {renderListSchematic(curList, "traverse", activeVal)}
          </div>
        );
      }
    }

    if (currentType === "matrix") {
      const activeKey = Object.keys(cur?.matrixState || {}).find(k =>
        cur.matrixState[k] === "active" || cur.matrixState[k] === "processing" || cur.matrixState[k] === "visited"
      );

      let changedKey = null;
      let prevCellVal = undefined;
      let newCellVal = undefined;

      if (cur?.matrix && prev?.matrix) {
        for (let r = 0; r < cur.matrix.length; r++) {
          for (let c = 0; c < (cur.matrix[r]?.length || 0); c++) {
            if (prev.matrix[r]?.[c] !== cur.matrix[r][c]) {
              changedKey = `${r}-${c}`;
              prevCellVal = prev.matrix[r][c];
              newCellVal = cur.matrix[r][c];
              break;
            }
          }
          if (changedKey) break;
        }
      }

      if (op === "UPDATE CELL" && changedKey) {
        const [r, c] = changedKey.split("-").map(Number);
        return (
          <div style={containerStyle}>
            {renderMatrixCellSchematic(r, c, prevCellVal, newCellVal, "update")}
          </div>
        );
      } else if (activeKey) {
        const [r, c] = activeKey.split("-").map(Number);
        const cellVal = cur.matrixVals?.[activeKey] !== undefined ? cur.matrixVals[activeKey] : (cur.matrix?.[r]?.[c] !== undefined ? cur.matrix[r][c] : "");
        return (
          <div style={containerStyle}>
            {renderMatrixCellSchematic(r, c, cellVal, undefined, "visit")}
          </div>
        );
      } else {
        return (
          <div style={{ ...containerStyle, fontSize: 11, color: "#64748b", fontWeight: 700, fontFamily: "monospace" }}>
            {details || "Processing Grid Matrix..."}
          </div>
        );
      }
    }

    if (currentType === "graph") {
      const activeEdgeKey = Object.keys(cur?.edgeStates || {}).find(k =>
        cur.edgeStates[k] === "highlighted" || cur.edgeStates[k] === "visited"
      );
      const activeNodeKey = Object.keys(cur?.nodeStates || {}).find(k =>
        cur.nodeStates[k] === "active" || cur.nodeStates[k] === "processing" || cur.nodeStates[k] === "visited"
      );

      if (op === "TRAVERSE EDGE" && activeEdgeKey) {
        const [u, v] = activeEdgeKey.split("-");
        const layoutEdge = analysis?.graphLayout?.edges?.find(e =>
          (e.from === u && e.to === v) || (e.from === v && e.to === u)
        );
        const weight = layoutEdge?.weight;
        const valU = cur.nodeVals?.[u];
        const valV = cur.nodeVals?.[v];
        return (
          <div style={containerStyle}>
            {renderGraphSchematic(u, v, weight, undefined, valU, valV, "edge")}
          </div>
        );
      } else if (activeNodeKey) {
        const valU = cur.nodeVals?.[activeNodeKey];
        return (
          <div style={containerStyle}>
            {renderGraphSchematic(undefined, undefined, undefined, activeNodeKey, valU, undefined, "node")}
          </div>
        );
      } else {
        return (
          <div style={{ ...containerStyle, fontSize: 11, color: "#64748b", fontWeight: 700, fontFamily: "monospace" }}>
            {details || "Traversing Graph Nodes..."}
          </div>
        );
      }
    }

    // Default Array/String
    const arr = cur?.arr || [];
    const pointers = cur?.pointers || {};

    const comparingIdxs = [];
    if (cur?.arrStates) {
      Object.entries(cur.arrStates).forEach(([idx, state]) => {
        if (state === "comparing") {
          comparingIdxs.push(Number(idx));
        }
      });
    }

    const swappingIdxs = [];
    if (cur?.arrStates) {
      Object.entries(cur.arrStates).forEach(([idx, state]) => {
        if (state === "swapping" || state === "swap") {
          swappingIdxs.push(Number(idx));
        }
      });
    }

    let changedIdx = -1;
    if (cur?.arr && prev?.arr && cur.arr.length === prev.arr.length) {
      changedIdx = cur.arr.findIndex((v, i) => prev.arr[i] !== v);
    }

    if (op === "SWAP" && (swappingIdxs.length >= 2 || (prev && cur?.msg?.toLowerCase().includes("swap")))) {
      let idxA = swappingIdxs[0];
      let idxB = swappingIdxs[1];
      if (idxA === undefined || idxB === undefined) {
        const pointerKeys = Object.keys(pointers).map(Number).filter(k => !isNaN(k));
        if (pointerKeys.length >= 2) {
          idxA = pointerKeys[0];
          idxB = pointerKeys[1];
        } else {
          idxA = 0;
          idxB = 1;
        }
      }

      const valA = prev?.arr?.[idxA] !== undefined ? prev.arr[idxA] : arr[idxB];
      const valB = prev?.arr?.[idxB] !== undefined ? prev.arr[idxB] : arr[idxA];
      const ptrA = pointers[idxA] || pointers[String(idxA)] || "";
      const ptrB = pointers[idxB] || pointers[String(idxB)] || "";

      return (
        <div style={containerStyle}>
          {renderSwapSchematic(valA, valB, ptrA, ptrB, idxA, idxB)}
        </div>
      );
    }

    if (op === "COMPARE" && (comparingIdxs.length >= 2 || cur?.msg?.toLowerCase().includes("compare"))) {
      let idxA = comparingIdxs[0];
      let idxB = comparingIdxs[1];
      if (idxA === undefined || idxB === undefined) {
        const pointerKeys = Object.keys(pointers).map(Number).filter(k => !isNaN(k));
        if (pointerKeys.length >= 2) {
          idxA = pointerKeys[0];
          idxB = pointerKeys[1];
        } else {
          idxA = 0;
          idxB = 1;
        }
      }

      const valA = arr[idxA];
      const valB = arr[idxB];
      const ptrA = pointers[idxA] || pointers[String(idxA)] || "";
      const ptrB = pointers[idxB] || pointers[String(idxB)] || "";

      let opSym = "==";
      const msg = cur?.msg || "";
      if (msg.includes(">=")) opSym = ">=";
      else if (msg.includes("<=")) opSym = "<=";
      else if (msg.includes(">")) opSym = ">";
      else if (msg.includes("<")) opSym = "<";
      else if (msg.includes("!=")) opSym = "!=";

      return (
        <div style={containerStyle}>
          {renderCompareSchematic(valA, valB, ptrA, ptrB, idxA, idxB, opSym)}
        </div>
      );
    }

    if (op === "UPDATE" && changedIdx !== -1) {
      const prevVal = prev?.arr?.[changedIdx];
      const newVal = arr[changedIdx];
      const ptrText = pointers[changedIdx] || pointers[String(changedIdx)] || "";
      return (
        <div style={containerStyle}>
          {renderUpdateSchematic(changedIdx, prevVal, newVal, ptrText)}
        </div>
      );
    }

    const activeIdx = cur?.arrStates ? Object.keys(cur.arrStates).find(k => cur.arrStates[k] === "active") : null;
    if (activeIdx !== null && activeIdx !== undefined) {
      const idxNum = Number(activeIdx);
      const valText = arr[idxNum];
      const ptrText = pointers[activeIdx] || pointers[String(activeIdx)] || "";
      return (
        <div style={containerStyle}>
          {renderTraverseSchematic(idxNum, valText, ptrText)}
        </div>
      );
    }

    return (
      <div style={{ ...containerStyle, padding: "8px 12px", background: "#f1f5f9", border: "none", color: "#475569", fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>
        {details || "Accessing structure..."}
      </div>
    );
  };

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(226, 232, 240, 0.8)",
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase" }}>
          Active Operation Monitor
        </span>
        <span style={{
          marginLeft: "auto",
          fontSize: 9.5,
          fontWeight: 850,
          background: op.includes("INSERT") || op === "PUSH" || op === "ENQUEUE" || op === "INSERT" ? "#e6f4ea" : op.includes("POP") || op === "POP" || op === "DEQUEUE" || op === "DELETE" ? "#fce8e6" : "#eff6ff",
          color: op.includes("INSERT") || op === "PUSH" || op === "ENQUEUE" || op === "INSERT" ? "#137333" : op.includes("POP") || op === "POP" || op === "DEQUEUE" || op === "DELETE" ? "#c5221f" : "#1a73e8",
          padding: "2.5px 10px",
          borderRadius: 20,
          fontFamily: "monospace"
        }}>
          {op}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: 10 }}>
        {renderVisual()}
      </div>

      <div style={{
        fontSize: 11,
        color: "#475569",
        lineHeight: 1.45,
        background: "rgba(248, 250, 252, 0.6)",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid rgba(226, 232, 240, 0.5)"
      }}>
        💡 <strong>Step Action:</strong> {details}
      </div>
    </div>
  );
}

function getStepType(cur, prev, isGraphMode, isMatrixMode, isLinkedListMode, isStackMode, isQueueMode) {
  if (!cur) return "array";
  const msg = (cur.msg || "").toLowerCase();

  // 1. Stack: check for changes in stack length or stack operations in step message
  if (cur.stack) {
    const curLen = cur.stack.length;
    const prevLen = prev?.stack?.length || 0;
    if (curLen !== prevLen || msg.includes("push") || msg.includes("pop") || msg.includes("peek") || msg.includes("top")) {
      return "stack";
    }
  }

  // 2. Queue: check for changes in queue length or queue operations in step message
  if (cur.queue) {
    const curLen = cur.queue.length;
    const prevLen = prev?.queue?.length || 0;
    if (curLen !== prevLen || msg.includes("enqueue") || msg.includes("dequeue") || msg.includes("add") || msg.includes("remove")) {
      return "queue";
    }
  }

  // 3. LinkedList: check for changes in linkedList length or linkedList operations in step message
  if (cur.linkedList) {
    const curLen = cur.linkedList.length;
    const prevLen = prev?.linkedList?.length || 0;
    if (curLen !== prevLen || msg.includes("insert") || msg.includes("delete") || msg.includes("reverse")) {
      return "linkedlist";
    }
  }

  // 4. Matrix: check for matrixState changes or processing cells
  if (cur.matrixState && Object.keys(cur.matrixState).length > 0) {
    return "matrix";
  }

  // 5. Graph: check for node/edge highlights
  if ((cur.nodeStates && Object.keys(cur.nodeStates).length > 0) || (cur.edgeStates && Object.keys(cur.edgeStates).length > 0)) {
    return "graph";
  }

  // Fallback priorities based on active mode types
  if (isStackMode && cur.stack) return "stack";
  if (isQueueMode && cur.queue) return "queue";
  if (isLinkedListMode && cur.linkedList) return "linkedlist";
  if (isGraphMode) return "graph";
  if (isMatrixMode && cur.matrix) return "matrix";
  return "array";
}

function VisualizerHUD({ stepIdx, steps, currentType }) {
  if (stepIdx === null || stepIdx === undefined || !steps || steps.length === 0) return null;
  const cur = steps[stepIdx];
  const prev = stepIdx > 0 ? steps[stepIdx - 1] : null;

  let actionText = "";
  let actionColor = "#475569";
  let actionBg = "#f1f5f9";
  let actionBorder = "#cbd5e1";

  if (currentType === "stack") {
    const curStack = cur?.stack || [];
    const prevStack = prev?.stack || [];
    const curLen = curStack.length;
    const prevLen = prevStack.length;

    if (curLen > prevLen) {
      const pushedVal = getElementVal(curStack[curLen - 1]);
      actionText = `🟢 PUSH: ${pushedVal}`;
      actionColor = "#15803d";
      actionBg = "#f0fdf4";
      actionBorder = "#bbf7d0";
    } else if (curLen < prevLen) {
      const poppedVal = getElementVal(prevStack[prevLen - 1]);
      actionText = `🔴 POP: ${poppedVal}`;
      actionColor = "#b91c1c";
      actionBg = "#fef2f2";
      actionBorder = "#fecaca";
    } else if (cur?.msg?.toLowerCase().includes("peek") || cur?.msg?.toLowerCase().includes("top")) {
      actionText = `🔍 PEEK / TOP`;
      actionColor = "#2563eb";
      actionBg = "#eff6ff";
      actionBorder = "#bfdbfe";
    }
  } else if (currentType === "queue") {
    const curQueue = cur?.queue || [];
    const prevQueue = prev?.queue || [];
    const curLen = curQueue.length;
    const prevLen = prevQueue.length;

    if (curLen > prevLen) {
      const enqueuedVal = getElementVal(curQueue[curLen - 1]);
      actionText = `🟢 ENQUEUE: ${enqueuedVal}`;
      actionColor = "#15803d";
      actionBg = "#f0fdf4";
      actionBorder = "#bbf7d0";
    } else if (curLen < prevLen) {
      const dequeuedVal = getElementVal(prevQueue[0]);
      actionText = `🔴 DEQUEUE: ${dequeuedVal}`;
      actionColor = "#b91c1c";
      actionBg = "#fef2f2";
      actionBorder = "#fecaca";
    }
  } else if (currentType === "linkedlist") {
    const curList = cur?.linkedList || [];
    const prevList = prev?.linkedList || [];
    const curLen = curList.length;
    const prevLen = prevList.length;

    if (curLen > prevLen) {
      actionText = `🟢 INSERT NODE`;
      actionColor = "#15803d";
      actionBg = "#f0fdf4";
      actionBorder = "#bbf7d0";
    } else if (curLen < prevLen) {
      actionText = `🔴 DELETE NODE`;
      actionColor = "#b91c1c";
      actionBg = "#fef2f2";
      actionBorder = "#fecaca";
    } else if (cur?.msg?.toLowerCase().includes("reverse")) {
      actionText = `🔄 REVERSING LINKS`;
      actionColor = "#7c3aed";
      actionBg = "#f5f3ff";
      actionBorder = "#ddd6fe";
    }
  } else if (currentType === "matrix") {
    let hasChange = false;
    if (cur?.matrix && prev?.matrix) {
      for (let r = 0; r < cur.matrix.length; r++) {
        for (let c = 0; c < (cur.matrix[r]?.length || 0); c++) {
          if (prev.matrix[r]?.[c] !== cur.matrix[r][c]) {
            hasChange = true;
            break;
          }
        }
      }
    }
    if (hasChange) {
      actionText = `✏️ UPDATE CELL`;
      actionColor = "#16a34a";
      actionBg = "#f0fdf4";
      actionBorder = "#bbf7d0";
    } else {
      const activeKey = Object.keys(cur?.matrixState || {}).find(k =>
        cur.matrixState[k] === "active" || cur.matrixState[k] === "processing" || cur.matrixState[k] === "visited"
      );
      if (activeKey) {
        actionText = `🔍 VISITED CELL`;
        actionColor = "#2563eb";
        actionBg = "#eff6ff";
        actionBorder = "#bfdbfe";
      }
    }
  } else if (currentType === "graph") {
    const activeEdgeKey = Object.keys(cur?.edgeStates || {}).find(k =>
      cur.edgeStates[k] === "highlighted" || cur.edgeStates[k] === "visited"
    );
    const activeNodeKey = Object.keys(cur?.nodeStates || {}).find(k =>
      cur.nodeStates[k] === "active" || cur.nodeStates[k] === "processing" || cur.nodeStates[k] === "visited"
    );
    if (activeEdgeKey) {
      actionText = `🔄 TRAVERSING EDGE`;
      actionColor = "#2563eb";
      actionBg = "#eff6ff";
      actionBorder = "#bfdbfe";
    } else if (activeNodeKey) {
      actionText = `🟢 VISITED NODE`;
      actionColor = "#16a34a";
      actionBg = "#f0fdf4";
      actionBorder = "#bbf7d0";
    }
  }

  if (!actionText && cur?.msg) {
    const msgLower = cur.msg.toLowerCase();
    if (msgLower.includes("push") || msgLower.includes("insert")) {
      actionText = `🟢 INSERT / PUSH`;
      actionColor = "#15803d";
      actionBg = "#f0fdf4";
      actionBorder = "#bbf7d0";
    } else if (msgLower.includes("pop") || msgLower.includes("remove") || msgLower.includes("delete")) {
      actionText = `🔴 POP / REMOVE`;
      actionColor = "#b91c1c";
      actionBg = "#fef2f2";
      actionBorder = "#fecaca";
    } else if (msgLower.includes("compare") || msgLower.includes("check")) {
      actionText = `🔍 COMPARING`;
      actionColor = "#b45309";
      actionBg = "#fffbeb";
      actionBorder = "#fde68a";
    } else if (msgLower.includes("swap")) {
      actionText = `🔄 SWAPPING`;
      actionColor = "#7c3aed";
      actionBg = "#f5f3ff";
      actionBorder = "#ddd6fe";
    }
  }

  if (!actionText) return null;

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 14px",
      borderRadius: 20,
      background: actionBg,
      color: actionColor,
      border: `1.5px solid ${actionBorder}`,
      fontSize: 11,
      fontWeight: 800,
      fontFamily: "monospace",
      marginBottom: 14,
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      animation: "pulseGlow 2s infinite ease-in-out"
    }}>
      {actionText}
    </div>
  );
}

function getElementVal(item) {
  if (item === null || item === undefined) return "";
  if (typeof item === "object" && item.val !== undefined) return item.val;
  return String(item);
}

function getLinkedListNodeState(node, idx, step) {
  if (node && typeof node === "object" && node.state !== undefined) {
    return node.state;
  }
  const nodeId = (node && typeof node === "object" && node.id !== undefined) ? node.id : idx;
  const ptrText = step?.pointers?.[nodeId] || step?.pointers?.[String(nodeId)] || step?.pointers?.[idx] || step?.pointers?.[String(idx)] || "";
  if (ptrText) {
    const p = ptrText.toLowerCase();
    if (p.includes("curr") || p.includes("active") || p.includes("temp")) return "active";
    if (p.includes("prev") || p.includes("slow")) return "secondary";
    if (p.includes("done")) return "done";
  }
  return "idle";
}

function getStackItemState(item, idx, stackLength, step) {
  if (item && typeof item === "object" && item.state !== undefined) {
    return item.state;
  }
  const isTop = idx === stackLength - 1;
  const ptrText = step?.pointers?.[idx] || step?.pointers?.[String(idx)] || (isTop ? "top" : "");
  if (ptrText) {
    const p = ptrText.toLowerCase();
    if (p.includes("top") || p.includes("active") || p.includes("pop") || p.includes("push")) return "active";
  }
  return "idle";
}

function getQueueItemState(item, idx, queueLength, step) {
  if (item && typeof item === "object" && item.state !== undefined) {
    return item.state;
  }
  const isFront = idx === 0;
  const isRear = idx === queueLength - 1;
  let defaultPtr = "";
  if (isFront && isRear) defaultPtr = "front, rear";
  else if (isFront) defaultPtr = "front";
  else if (isRear) defaultPtr = "rear";

  const ptrText = step?.pointers?.[idx] || step?.pointers?.[String(idx)] || defaultPtr;
  if (ptrText) {
    const p = ptrText.toLowerCase();
    if (p.includes("front") || p.includes("rear") || p.includes("active")) return "active";
  }
  return "idle";
}

function LinkedListViz({ list, step, onEdit, category }) {
  if (!list) return null;
  const listData = Array.isArray(list) ? list : [];
  const isDoubly = String(category || "").toLowerCase().includes("doubly");

  const handleCellClick = (idx, val) => {
    if (!onEdit) return;
    const newVal = prompt(`Edit node value at index [${idx}]:`, val);
    if (newVal !== null) {
      onEdit(idx, newVal, listData);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 0", alignItems: "center", minHeight: 120, padding: "16px 0", overflowX: "auto" }}>
      {listData.map((node, idx) => {
        const state = getLinkedListNodeState(node, idx, step);
        const s = COLORS[state] || COLORS.idle;

        const nodeId = (node && typeof node === "object" && node.id !== undefined) ? node.id : idx;
        const ptrText = step.pointers?.[nodeId] || step.pointers?.[String(nodeId)] || step.pointers?.[idx] || step.pointers?.[String(idx)] || "";
        const nodePointers = ptrText ? ptrText.split(",").map(p => p.trim()) : [];
        const hasPointers = nodePointers.length > 0;
        const displayVal = getElementVal(node);

        return (
          <div key={idx} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              {/* Pointers with visual down arrow indicator */}
              <div style={{ display: "flex", flexDirection: "column-reverse", gap: 2, minHeight: 45, justifyContent: "flex-end", alignItems: "center" }}>
                {hasPointers && (
                  <svg width="10" height="8" viewBox="0 0 10 8" style={{ marginTop: 2, zIndex: 10 }}>
                    <path d="M5 8V0M5 8L2 5M5 8L8 5" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {nodePointers.map((p, pIdx) => (
                  <span
                    key={pIdx}
                    style={{
                      fontSize: 9,
                      fontWeight: 850,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "#3b82f6",
                      color: "white",
                      fontFamily: "monospace",
                      boxShadow: "0 1.5px 3px rgba(59,130,246,0.3)"
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Memory Node Block with state scaling and glowing effects */}
              <div
                onClick={() => handleCellClick(idx, displayVal)}
                title="Click to edit node value"
                style={{
                  display: "flex",
                  borderRadius: 8,
                  border: `2px solid ${s.border}`,
                  background: s.bg,
                  color: s.text,
                  overflow: "hidden",
                  cursor: onEdit ? "pointer" : "default",
                  boxShadow: state !== "idle" ? `0 0 12px ${s.border}` : "0 2px 4px rgba(0,0,0,0.02)",
                  transform: state !== "idle" ? "scale(1.06)" : "scale(1)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <div style={{
                  padding: "8px 12px",
                  fontWeight: 800,
                  fontSize: 14,
                  minWidth: 36,
                  textAlign: "center",
                  fontFamily: "monospace"
                }}>
                  {displayVal}
                </div>
                <div style={{
                  padding: "8px 8px",
                  background: "rgba(0,0,0,0.04)",
                  borderLeft: `1.5px solid ${s.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9.5,
                  fontWeight: 600,
                  color: s.text
                }}>
                  next
                </div>
              </div>

              <span style={{ fontSize: 8.5, color: "#94a3b8", fontFamily: "monospace" }}>[{idx}]</span>
            </div>

            {idx < listData.length - 1 ? (() => {
              const nodeA = listData[idx];
              const nodeB = listData[idx + 1];
              const idA = nodeA && typeof nodeA === "object" ? nodeA.id : null;
              const idB = nodeB && typeof nodeB === "object" ? nodeB.id : null;
              const nextA = nodeA && typeof nodeA === "object" ? nodeA.next : undefined;
              const nextB = nodeB && typeof nodeB === "object" ? nodeB.next : undefined;

              const isReversed = idA !== null && idB !== null && nextB !== undefined && String(nextB) === String(idA);
              const isDisconnected = idA !== null && idB !== null && nextA !== undefined && nextB !== undefined && String(nextA) !== String(idB) && String(nextB) !== String(idA);

              return (
                <div style={{ display: "flex", alignItems: "center", alignSelf: "center", marginTop: 15 }}>
                  {isDoubly ? (
                    <svg width="34" height="24" viewBox="0 0 34 24" style={{ margin: "0 4px" }}>
                      <path d="M6 12h22M10 7l-5 5 5 5M24 17l5-5-5-5" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isReversed ? (
                    <svg width="28" height="24" viewBox="0 0 28 24" style={{ margin: "0 4px" }} title="Link reversed (pointing left)">
                      <path d="M24 12H4M11 5l-7 7 7 7" stroke="#a855f7" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isDisconnected ? (
                    <svg width="28" height="24" viewBox="0 0 28 24" style={{ margin: "0 4px" }} title="No pointer connection between these nodes">
                      <path d="M4 12h20" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                      <path d="M12 8l4 8M16 8l-4 8" stroke="#ef4444" strokeWidth="1.5" />
                    </svg>
                  ) : (
                    <svg width="28" height="24" viewBox="0 0 28 24" style={{ margin: "0 4px" }}>
                      <path d="M4 12h20M16 5l7 7-7 7" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              );
            })() : (
              <div style={{ display: "flex", alignItems: "center", alignSelf: "center", marginTop: 15 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" style={{ margin: "0 2px" }}>
                  <path d="M4 12h14M11 6l7 6-7 6" stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
                <div style={{
                  padding: "4px 8px",
                  borderRadius: 5,
                  border: "1.5px solid #cbd5e1",
                  background: "#f1f5f9",
                  color: "#475569",
                  fontSize: 9.5,
                  fontWeight: 800,
                  fontFamily: "monospace",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}>
                  NULL
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StackViz({ stack, step, onEdit }) {
  if (!stack) return null;
  const stackData = Array.isArray(stack) ? stack : [];

  const handleCellClick = (idx, val) => {
    if (!onEdit) return;
    const newVal = prompt(`Edit stack value at index [${idx}]:`, val);
    if (newVal !== null) {
      onEdit(idx, newVal, stackData);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", minHeight: 240 }}>
      <div style={{
        position: "relative",
        width: 150,
        minHeight: 180,
        borderLeft: "4px solid #475569",
        borderRight: "4px solid #475569",
        borderBottom: "4px solid #475569",
        borderRadius: "0 0 12px 12px",
        background: "linear-gradient(to top, rgba(241, 245, 249, 0.6), rgba(255, 255, 255, 0.1))",
        display: "flex",
        flexDirection: "column-reverse",
        justifyContent: "flex-start",
        padding: 6,
        gap: 6
      }}>
        {stackData.length === 0 ? (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#94a3b8",
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1,
            width: "100%",
            textAlign: "center"
          }}>
            Empty Stack
          </div>
        ) : (
          stackData.map((item, idx) => {
            const state = getStackItemState(item, idx, stackData.length, step);
            const s = COLORS[state] || COLORS.idle;
            const isTop = idx === stackData.length - 1;
            const ptrText = step.pointers?.[idx] || step.pointers?.[String(idx)] || (isTop ? "top" : "");
            const itemPointers = ptrText ? ptrText.split(",").map(p => p.trim()) : [];
            const displayVal = getElementVal(item);

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(idx, displayVal)}
                style={{
                  position: "relative",
                  width: "100%",
                  height: 36,
                  borderRadius: 6,
                  border: `2px solid ${s.border}`,
                  background: s.bg,
                  color: s.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 13,
                  fontFamily: "monospace",
                  cursor: onEdit ? "pointer" : "default",
                  boxShadow: state !== "idle" ? `0 0 12px ${s.border}` : "0 1px 3px rgba(0,0,0,0.02)",
                  transform: state !== "idle" ? "scale(1.04)" : "scale(1)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                {displayVal}

                {/* Visual horizontal pointer arrow indicator pointing left */}
                {itemPointers.length > 0 && (
                  <div style={{
                    position: "absolute",
                    left: 148,
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    zIndex: 10
                  }}>
                    <svg width="22" height="12" viewBox="0 0 22 12">
                      <path d="M22 6H2M2 6L7 2M2 6L7 10" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {itemPointers.map((p, pIdx) => (
                      <span
                        key={pIdx}
                        style={{
                          background: "#3b82f6",
                          color: "white",
                          fontSize: 9.5,
                          fontWeight: 850,
                          padding: "2.5px 6px",
                          borderRadius: 4.5,
                          fontFamily: "monospace",
                          boxShadow: "0 1.5px 3px rgba(59,130,246,0.3)"
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{
                  position: "absolute",
                  right: 148,
                  color: "#94a3b8",
                  fontSize: 8.5,
                  fontFamily: "monospace"
                }}>
                  [{idx}]
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
        Stack (Last In, First Out)
      </div>
    </div>
  );
}

function QueueViz({ queue, step, onEdit }) {
  if (!queue) return null;
  const queueData = Array.isArray(queue) ? queue : [];

  const handleCellClick = (idx, val) => {
    if (!onEdit) return;
    const newVal = prompt(`Edit queue value at index [${idx}]:`, val);
    if (newVal !== null) {
      onEdit(idx, newVal, queueData);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", minHeight: 180 }}>
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        minWidth: 260,
        height: 60,
        borderTop: "3px solid #475569",
        borderBottom: "3px solid #475569",
        background: "linear-gradient(to bottom, rgba(241, 245, 249, 0.4), rgba(255, 255, 255, 0.1))",
        padding: "0 16px",
        gap: 8,
        justifyContent: "center"
      }}>
        <div style={{
          position: "absolute",
          left: -44,
          fontSize: 9,
          color: "#dc2626",
          fontWeight: 900,
          textTransform: "uppercase",
          fontFamily: "monospace"
        }}>
          Exit ◄
        </div>
        <div style={{
          position: "absolute",
          right: -60,
          fontSize: 9,
          color: "#16a34a",
          fontWeight: 900,
          textTransform: "uppercase",
          fontFamily: "monospace"
        }}>
          ◄ Enter
        </div>

        {queueData.length === 0 ? (
          <div style={{
            color: "#94a3b8",
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1
          }}>
            Empty Queue
          </div>
        ) : (
          queueData.map((item, idx) => {
            const state = getQueueItemState(item, idx, queueData.length, step);
            const s = COLORS[state] || COLORS.idle;
            const isFront = idx === 0;
            const isRear = idx === queueData.length - 1;

            let defaultPtr = "";
            if (isFront && isRear) defaultPtr = "front, rear";
            else if (isFront) defaultPtr = "front";
            else if (isRear) defaultPtr = "rear";

            const ptrText = step.pointers?.[idx] || step.pointers?.[String(idx)] || defaultPtr;
            const itemPointers = ptrText ? ptrText.split(",").map(p => p.trim()) : [];
            const displayVal = getElementVal(item);

            return (
              <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
                {/* Visual down-pointing arrow connecting floating labels directly onto the queue node */}
                {itemPointers.length > 0 && (
                  <div style={{
                    position: "absolute",
                    bottom: 44,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    zIndex: 10
                  }}>
                    <div style={{ display: "flex", gap: 2, whiteSpace: "nowrap" }}>
                      {itemPointers.map((p, pIdx) => (
                        <span
                          key={pIdx}
                          style={{
                            background: "#3b82f6",
                            color: "white",
                            fontSize: 9,
                            fontWeight: 850,
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontFamily: "monospace",
                            boxShadow: "0 1.5px 3px rgba(59,130,246,0.3)"
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                    <svg width="10" height="8" viewBox="0 0 10 8">
                      <path d="M5 8V0M5 8L2 5M5 8L8 5" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                <div
                  onClick={() => handleCellClick(idx, displayVal)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 6,
                    border: `2px solid ${s.border}`,
                    background: s.bg,
                    color: s.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    fontFamily: "monospace",
                    cursor: onEdit ? "pointer" : "default",
                    boxShadow: state !== "idle" ? `0 0 12px ${s.border}` : "0 1px 3px rgba(0,0,0,0.02)",
                    transform: state !== "idle" ? "scale(1.06)" : "scale(1)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                >
                  {displayVal}
                </div>

                <span style={{ fontSize: 8.5, color: "#94a3b8", fontFamily: "monospace" }}>[{idx}]</span>
              </div>
            );
          })
        )}
      </div>
      <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 14, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
        Queue (First In, First Out)
      </div>
    </div>
  );
}

function DryRunSheet({ analysis, stepIdx, onRowClick }) {
  if (!analysis || !analysis.steps || analysis.steps.length === 0) return null;

  const activeRowRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const focusActiveStep = () => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Gather unique variables/pointers dynamically across all steps
  const varColumns = [];
  analysis.steps.forEach(step => {
    // Add from pointers
    if (step.pointers) {
      Object.values(step.pointers).forEach(name => {
        if (name && !varColumns.includes(name)) {
          varColumns.push(name);
        }
      });
    }
    // Add from variables
    if (step.variables) {
      Object.keys(step.variables).forEach(name => {
        if (name && !varColumns.includes(name)) {
          varColumns.push(name);
        }
      });
    }
  });

  const hasArray = analysis.steps.some(s => s.arr);
  const hasMatrix = analysis.steps.some(s => s.matrix);
  const hasLinkedList = analysis.steps.some(s => s.linkedList);
  const hasStack = analysis.steps.some(s => s.stack);
  const hasQueue = analysis.steps.some(s => s.queue);
  const useFallback = varColumns.length === 0 && !hasArray && !hasMatrix && !hasLinkedList && !hasStack && !hasQueue;

  return (
    <div style={{
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)",
      overflow: "hidden",
      marginBottom: 20
    }} id="dry-run-sheet-print-area">
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid #f1f5f9",
        background: "#fafafa",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: 1,
            textTransform: "uppercase"
          }}>Dry Run Trace Sheet</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
            ⚡ {analysis.algorithmName} State Tracker
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }} className="no-print">
          <button
            onClick={focusActiveStep}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "white",
              color: "#475569",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.15s"
            }}
          >
            🎯 Focus Active Row
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s"
            }}
          >
            🖨️ Download PDF / Print
          </button>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        {/* Quick Summary Header */}
        <div style={{ display: "flex", gap: 24, marginBottom: 16, borderBottom: "1px dashed #e2e8f0", paddingBottom: 12, fontSize: 11, color: "#475569" }}>
          <div><strong>Complexity:</strong> Time: {analysis.timeComplexity} | Space: {analysis.spaceComplexity}</div>
          <div><strong>Language:</strong> {analysis.language}</div>
          <div><strong>Category:</strong> {analysis.category}</div>
        </div>

        {/* Print-only Notes Section */}
        <div className="print-only" style={{ borderBottom: "1px dashed #e2e8f0", paddingBottom: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
            📝 Algorithm Analysis & Notes
          </h3>

          {analysis.explanation && (
            <p style={{ fontSize: 11, color: "#334155", lineHeight: 1.5, marginBottom: 12 }}>
              <strong>Explanation:</strong> {analysis.explanation}
            </p>
          )}

          {analysis.howItWorks && analysis.howItWorks.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>How it Works:</h4>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 10.5, color: "#334155", lineHeight: 1.5 }}>
                {analysis.howItWorks.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {!analysis.isCorrect && (
            <div style={{ marginTop: 12, padding: 10, background: "#fdf2f2", border: "1px solid #fde8e8", borderRadius: 6 }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: "#9b1c1c", marginBottom: 6 }}>Detected Bugs / Issues:</h4>
              <ul style={{ margin: "0 0 10px 0", paddingLeft: 20, fontSize: 10.5, color: "#9b1c1c", lineHeight: 1.5 }}>
                {(analysis.bugs || []).map((bug, idx) => (
                  <li key={idx}>{bug}</li>
                ))}
              </ul>
              {analysis.correctedCode && (
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Corrected Code:</h4>
                  <pre style={{
                    margin: 0,
                    padding: 8,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 4,
                    fontFamily: "monospace",
                    fontSize: 9.5,
                    color: "#1f2937",
                    overflowX: "auto",
                    overflowY: "auto",
                    maxHeight: "200px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.4
                  }}>
                    {analysis.correctedCode}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trace Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "10px 8px", textAlign: "left", width: 45, color: "#475569", fontWeight: 700 }}>Step</th>
                <th style={{ padding: "10px 8px", textAlign: "left", width: 180, color: "#475569", fontWeight: 700 }}>Line Executed</th>

                {/* Render dynamic columns for variables */}
                {varColumns.map(colName => (
                  <th key={colName} style={{ padding: "10px 8px", textAlign: "center", minWidth: 60, color: "#2563eb", fontWeight: 700, fontFamily: "monospace" }}>
                    {colName}
                  </th>
                ))}
                {hasArray && (
                  <th style={{ padding: "10px 8px", textAlign: "left", minWidth: 120, color: "#475569", fontWeight: 700 }}>Array</th>
                )}
                {hasMatrix && (
                  <th style={{ padding: "10px 8px", textAlign: "left", minWidth: 120, color: "#475569", fontWeight: 700 }}>Matrix</th>
                )}
                {hasLinkedList && (
                  <th style={{ padding: "10px 8px", textAlign: "left", minWidth: 120, color: "#475569", fontWeight: 700 }}>Linked List</th>
                )}
                {hasStack && (
                  <th style={{ padding: "10px 8px", textAlign: "left", minWidth: 120, color: "#475569", fontWeight: 700 }}>Stack</th>
                )}
                {hasQueue && (
                  <th style={{ padding: "10px 8px", textAlign: "left", minWidth: 120, color: "#475569", fontWeight: 700 }}>Queue</th>
                )}

                {/* Fallback column */}
                {useFallback && (
                  <th style={{ padding: "10px 8px", textAlign: "left", width: 180, color: "#475569", fontWeight: 700 }}>Variables</th>
                )}

                <th style={{ padding: "10px 8px", textAlign: "left", color: "#475569", fontWeight: 700 }}>Explanation / Action</th>
              </tr>
            </thead>
            <tbody>
              {analysis.steps.map((step, idx) => {
                const codeLineObj = analysis.codeLines?.[step.activeLine];
                const codeLineText = codeLineObj ? codeLineObj.line.trim() : "";
                const isActive = idx === stepIdx;

                return (
                  <tr
                    key={idx}
                    ref={isActive ? activeRowRef : null}
                    onClick={() => onRowClick && onRowClick(idx)}
                    title="Click to jump to this step in visualization"
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      verticalAlign: "top",
                      background: isActive ? "#f0f7ff" : "transparent",
                      transition: "all 0.2s ease-in-out",
                      boxShadow: isActive ? "inset 4px 0 0 #3b82f6" : "none",
                      cursor: "pointer"
                    }}
                  >
                    {/* Step # */}
                    <td style={{
                      padding: "12px 8px",
                      fontWeight: 700,
                      color: isActive ? "#1e40af" : "#64748b",
                      fontFamily: "monospace"
                    }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {isActive && <span style={{ color: "#3b82f6", fontWeight: "900", animation: "pulseGlow 2s infinite ease-in-out" }}>➜</span>}
                        <span>#{idx + 1}</span>
                      </span>
                    </td>

                    {/* Line Executed */}
                    <td style={{ padding: "12px 8px", fontFamily: "monospace", color: isActive ? "#1e293b" : "#0f172a", background: isActive ? "#eaf2ff" : "#fafafa", fontWeight: isActive ? 600 : 400 }}>
                      {codeLineText ? (
                        <div>
                          <div style={{ fontSize: 8.5, color: isActive ? "#3b82f6" : "#94a3b8", marginBottom: 2 }}>Line {step.activeLine + 1}:</div>
                          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.35 }}>{codeLineText}</div>
                        </div>
                      ) : (
                        <em style={{ color: "#94a3b8" }}>N/A</em>
                      )}
                    </td>

                    {/* Dynamic Variables Columns values */}
                    {varColumns.map(colName => {
                      let value = "-";
                      if (step.variables && step.variables[colName] !== undefined) {
                        value = typeof step.variables[colName] === 'object' ? JSON.stringify(step.variables[colName]) : String(step.variables[colName]);
                      } else if (step.pointers) {
                        // Find if pointers maps an index to this colName
                        const ptrIdx = Object.keys(step.pointers).find(k => step.pointers[k] === colName);
                        if (ptrIdx !== undefined) {
                          value = ptrIdx;
                        }
                      }
                      return (
                        <td key={colName} style={{ padding: "12px 8px", textAlign: "center", fontFamily: "monospace", color: isActive ? "#1e40af" : "#2563eb", fontWeight: isActive ? 800 : 600 }}>
                          {value}
                        </td>
                      );
                    })}

                    {/* Array visual column */}
                    {hasArray && (
                      <td style={{ padding: "12px 8px", fontFamily: "monospace", color: isActive ? "#1e293b" : "#0f172a", fontWeight: isActive ? 600 : 400 }}>
                        {step.arr ? (
                          `[${(Array.isArray(step.arr) ? step.arr : step.arr.split("")).join(", ")}]`
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                    )}

                    {/* Matrix visual column */}
                    {hasMatrix && (
                      <td style={{ padding: "12px 8px", fontFamily: "monospace", color: isActive ? "#1e293b" : "#0f172a", fontWeight: isActive ? 600 : 400 }}>
                        {step.matrix ? (
                          step.matrix.map(row => `[${row.join(",")}]`).join(", ")
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                    )}

                    {/* Linked List visual column */}
                    {hasLinkedList && (
                      <td style={{ padding: "12px 8px", fontFamily: "monospace", color: isActive ? "#1e293b" : "#0f172a", fontWeight: isActive ? 600 : 400 }}>
                        {step.linkedList ? (
                          step.linkedList.map(n => n.val).join(" → ")
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                    )}

                    {/* Stack visual column */}
                    {hasStack && (
                      <td style={{ padding: "12px 8px", fontFamily: "monospace", color: isActive ? "#1e293b" : "#0f172a", fontWeight: isActive ? 600 : 400 }}>
                        {step.stack ? (
                          `[${step.stack.map(n => n.val).join(", ")}] (top: ${step.stack[step.stack.length - 1]?.val ?? "none"})`
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                    )}

                    {/* Queue visual column */}
                    {hasQueue && (
                      <td style={{ padding: "12px 8px", fontFamily: "monospace", color: isActive ? "#1e293b" : "#0f172a", fontWeight: isActive ? 600 : 400 }}>
                        {step.queue ? (
                          `[${step.queue.map(n => n.val).join(", ")}]`
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                    )}

                    {/* Fallback column */}
                    {useFallback && (
                      <td style={{ padding: "12px 8px", fontFamily: "monospace", color: "#64748b" }}>
                        None
                      </td>
                    )}

                    {/* Explanation / Action */}
                    <td style={{ padding: "12px 8px", color: isActive ? "#1e293b" : "#334155", fontWeight: isActive ? 700 : 400, lineHeight: 1.45 }}>
                      {step.msg}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CodePanel({ lines, activeLine }) {
  const containerRef = useRef(null);
  const activeLineRef = useRef(null);

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeLineRef.current;

      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const elementTop = element.offsetTop;
      const elementBottom = elementTop + element.clientHeight;

      if (elementTop < containerTop) {
        container.scrollTo({ top: elementTop, behavior: "smooth" });
      } else if (elementBottom > containerBottom) {
        container.scrollTo({ top: elementBottom - container.clientHeight, behavior: "smooth" });
      }
    }
  }, [activeLine]);

  return (
    <div style={{ background: "#0d1117", borderRadius: 10, overflow: "hidden", fontSize: 12, fontFamily: "monospace" }}>
      <div style={{ padding: "7px 12px", background: "#161b22", borderBottom: "1px solid #30363d", display: "flex", gap: 5 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
        <span style={{ marginLeft: 8, fontSize: 10, color: "#8b949e" }}>algorithm</span>
      </div>
      <div ref={containerRef} style={{ padding: "6px 0", maxHeight: 240, overflow: "auto", position: "relative" }}>
        {(lines || []).map((item, i) => (
          <div key={i} ref={i === activeLine ? activeLineRef : null} style={{ padding: "3px 12px", background: i === activeLine ? "rgba(59,130,246,0.18)" : "transparent", borderLeft: `3px solid ${i === activeLine ? "#3b82f6" : "transparent"}`, display: "flex", gap: 10, alignItems: "center", transition: "all 0.2s" }}>
            <span style={{ color: "#4b5563", fontSize: 10, minWidth: 16, textAlign: "right" }}>{i + 1}</span>
            <span style={{ color: i === activeLine ? "#e2e8f0" : "#8b949e", flex: 1, whiteSpace: "pre" }}>{item.line}</span>
            {i === activeLine && item.explain && <span style={{ fontSize: 10, color: "#34d399", borderLeft: "1px solid #1f4a3a", paddingLeft: 8, whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{"<- "}{item.explain}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Dots({ label }) {
  const [d, setD] = useState(".");
  useEffect(() => { const t = setInterval(() => setD(p => p.length >= 3 ? "." : p + "."), 400); return () => clearInterval(t); }, []);
  return <span style={{ color: "#94a3b8", fontSize: 13 }}>{label}{d}</span>;
}

function StudentHintsPanel({ analysis, hintsExpanded, setHintsExpanded, activeHintIdx, setActiveHintIdx }) {
  if (!analysis || !analysis.hints || analysis.hints.length === 0) return null;

  return (
    <div style={{
      background: "#fffbeb",
      border: "1px solid #fef3c7",
      borderRadius: 12,
      padding: "16px",
      marginBottom: 16,
      boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.05), 0 2px 4px -1px rgba(245, 158, 11, 0.03)",
      width: "100%",
      transition: "all 0.3s ease"
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rotatebulb {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>

      <div 
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} 
        onClick={() => setHintsExpanded(!hintsExpanded)}
      >
        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#b45309", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "16px",
            display: "inline-block",
            animation: hintsExpanded ? "rotatebulb 0.5s ease" : "none"
          }}>💡</span>
          Stuck? Conceptual Hints ({activeHintIdx + 2} of {analysis.hints.length + 1})
        </span>
        <span style={{ 
          fontSize: "9.5px", 
          fontWeight: 700, 
          color: "#d97706", 
          background: "#fff7ed", 
          padding: "3px 10px", 
          borderRadius: 12,
          border: "1px solid #ffedd5"
        }}>
          {hintsExpanded ? "Hide ➖" : "Show ➕"}
        </span>
      </div>

      {hintsExpanded && (
        <div style={{ marginTop: 14 }}>
          {/* Stepper Progress Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, padding: "0 4px" }}>
            {/* Step 0: Base Problem */}
            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#f59e0b",
                color: "white",
                fontSize: 10,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 3px #fef3c7"
              }}>✓</div>
              <div style={{ flex: 1, height: 2, background: activeHintIdx >= 0 ? "#f59e0b" : "#e2e8f0", margin: "0 4px" }} />
            </div>

            {/* Hint Steps */}
            {analysis.hints.map((h, idx) => {
              const isRevealed = activeHintIdx >= idx;
              const isCurrent = activeHintIdx === idx - 1;
              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", flex: idx === analysis.hints.length - 1 ? "none" : 1 }}>
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: isRevealed ? "#f59e0b" : (isCurrent ? "#fef3c7" : "#f1f5f9"),
                    color: isRevealed ? "white" : "#94a3b8",
                    border: isCurrent ? "1.5px solid #d97706" : "1.5px solid transparent",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease"
                  }}>
                    {idx + 1}
                  </div>
                  {idx < analysis.hints.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: activeHintIdx >= idx + 1 ? "#f59e0b" : "#e2e8f0", margin: "0 4px" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Stepper Label */}
          <div style={{ fontSize: 10, color: "#78350f", fontWeight: 650, marginBottom: 12, paddingBottom: 6, borderBottom: "1px dashed #fed7aa" }}>
            {activeHintIdx === -1 ? "Start exploring clues to guide your algorithm design!" : `Displaying Clue ${activeHintIdx + 1} of ${analysis.hints.length}:`}
          </div>

          {/* Hint Cards Container */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Base Case context always shown */}
            <div style={{ 
              fontSize: 11.5, 
              color: "#451a03", 
              background: "white", 
              padding: "10px 12px", 
              borderRadius: 8, 
              borderLeft: "4px solid #d97706",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              lineHeight: 1.5
            }}>
              <strong>💡 Base Verification:</strong> Ensure your function handles standard base conditions (e.g. size &lt;= 1, empty collections, nulls) before running optimization.
            </div>

            {analysis.hints.slice(0, activeHintIdx + 1).map((hint, idx) => (
              <div 
                key={idx} 
                style={{ 
                  fontSize: 11.5, 
                  color: "#78350f", 
                  background: "white", 
                  padding: "10px 12px", 
                  borderRadius: 8, 
                  borderLeft: "4px solid #f59e0b",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  lineHeight: 1.5,
                  animation: "fadeIn 0.4s ease-out"
                }}
              >
                <strong>💡 Clue {idx + 1}:</strong> {hint}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {activeHintIdx < analysis.hints.length - 1 ? (
              <button
                onClick={() => setActiveHintIdx(prev => prev + 1)}
                style={{
                  padding: "6px 14px",
                  background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(180,83,9,0.2)",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(180,83,9,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(180,83,9,0.2)";
                }}
              >
                Reveal Next Hint 🔍
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 700 }}>✓ All hints revealed!</span>
                <span style={{ fontSize: 9.5, color: "#78350f" }}>Look closely at the execution trace or corrected code to debug details.</span>
              </div>
            )}

            {activeHintIdx >= 0 && (
              <button
                onClick={() => setActiveHintIdx(-1)}
                style={{
                  padding: "6px 10px",
                  background: "white",
                  color: "#9a3412",
                  border: "1px solid #ffedd5",
                  borderRadius: 6,
                  fontSize: 9.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#fff7ed";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "white";
                }}
              >
                Reset Clues ↩
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ComplexityDashboard({ analysis, setCustomInput, onSimulate }) {
  if (!analysis) return null;

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "oj" | "toolbox"
  const [hoverN, setHoverN] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [customN, setCustomN] = useState(10000); 

  // Student Toolbox States
  const [spaceTimeTradeoff, setSpaceTimeTradeoff] = useState("balanced"); 
  const [checklist, setChecklist] = useState({
    hash: false,
    sort: false,
    twoPointers: false,
    heap: false,
    inplace: false,
  });

  const rawTime = String(analysis.timeComplexity || "").toLowerCase();
  
  let activeComplexity = "unknown";
  if (rawTime.includes("1")) activeComplexity = "o_1";
  else if (rawTime.includes("log") && !rawTime.includes("n*log") && !rawTime.includes("n log")) activeComplexity = "o_log";
  else if (rawTime.includes("n*log") || rawTime.includes("n log")) activeComplexity = "o_nlog";
  else if (rawTime.includes("n^2") || rawTime.includes("n2") || rawTime.includes("n*n") || rawTime.includes("n*m")) activeComplexity = "o_n2";
  else if (rawTime.includes("n") || rawTime.includes("m")) activeComplexity = "o_n";

  const getYVal = (key, n) => {
    const pct = (n - 1) / 99;
    if (key === "o_1") return 95;
    if (key === "o_log") return 95 - 18 * Math.log2(n) / Math.log2(100);
    if (key === "o_n") return 95 - 45 * pct;
    if (key === "o_nlog") {
      const val = n * Math.log2(n);
      const maxVal = 100 * Math.log2(100);
      return 95 - 72 * val / maxVal;
    }
    if (key === "o_n2") return 95 - 85 * (n * n) / 10000;
    return 95;
  };

  const getHoverVal = (key, n) => {
    if (key === "o_1") return "1";
    if (key === "o_log") return String(Math.ceil(Math.log2(n)));
    if (key === "o_n") return String(n);
    if (key === "o_nlog") return String(Math.ceil(n * Math.log2(n)));
    if (key === "o_n2") return String(n * n);
    return "0";
  };

  const generatePath = (key) => {
    const points = [];
    for (let n = 1; n <= 100; n++) {
      const x = 20 + ((n - 1) / 99) * 160;
      const y = getYVal(key, n);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return `M ${points.join(" L ")}`;
  };

  const complexities = [
    { key: "o_1", label: "O(1) - Constant", color: "#10b981", d: generatePath("o_1") },
    { key: "o_log", label: "O(log N) - Logarithmic", color: "#06b6d4", d: generatePath("o_log") },
    { key: "o_n", label: "O(N) - Linear", color: "#3b82f6", d: generatePath("o_n") },
    { key: "o_nlog", label: "O(N log N) - Linearithmic", color: "#f59e0b", d: generatePath("o_nlog") },
    { key: "o_n2", label: "O(N²) - Quadratic", color: "#ef4444", d: generatePath("o_n2") }
  ];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = 8;
    const svgWidth = rect.width;
    const plotWidth = (svgWidth - 2 * padding) * (160 / 200);
    const plotStart = padding + (svgWidth - 2 * padding) * (20 / 200);
    
    let pct = (x - plotStart) / plotWidth;
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    
    const N = Math.max(1, Math.min(100, Math.round(pct * 99 + 1)));
    setHoverN(N);
    setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setHoverN(null);
  };

  const xSvg = hoverN ? 20 + ((hoverN - 1) / 99) * 160 : null;

  const getOpResult = (key, N) => {
    if (key === "o_1") return 1;
    if (key === "o_log") return Math.round(Math.log2(N));
    if (key === "o_n") return N;
    if (key === "o_nlog") return Math.round(N * Math.log2(N));
    if (key === "o_n2") return N * N;
    return 0;
  };

  const getSafetyBadge = (ops) => {
    if (ops <= 5 * 10000000) {
      return { text: "🟢 SAFE (~10ms)", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
    } else if (ops <= 2 * 100000000) {
      return { text: "🟡 RISK (~300ms)", bg: "#fffbeb", color: "#b45309", border: "#fde68a" };
    } else {
      return { text: "🔴 TLE (>1.5s)", bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" };
    }
  };

  const getDsaPatternInfo = () => {
    const category = String(analysis.category || "").toLowerCase();
    const name = String(analysis.algorithmName || "").toLowerCase();

    if (category.includes("heap") || category.includes("priority queue")) {
      return {
        title: "👑 Top K Elements / Heap Pattern",
        desc: "Uses a heap to keep track of the min/max element in a stream of elements. Ideal for keeping operations at O(log K) rather than O(K log K) sorting.",
        tip: "Consider if you can limit heap size to K to keep space O(K) and push/pop times at O(log K)."
      };
    } else if (category.includes("linked list")) {
      return {
        title: "🔗 Fast & Slow Pointers / Multi-Track",
        desc: "Traverses linked lists at different speeds or uses dummy header nodes. Crucial for loop-detection, middle-node search, and node merging.",
        tip: "Initialize a dummy node (dummy = new ListNode(-1)) to easily merge or structure results without null pointer errors."
      };
    } else if (category.includes("sort") || name.includes("sort")) {
      return {
        title: "📊 Divide & Conquer / Sorting Bars Pattern",
        desc: "Partitions search spaces into halves recursively (like Merge/Quick sort) or sorts lists to enable efficient Binary Search.",
        tip: "Sorting takes O(N log N) time, but it allows for quick Two Pointers scan O(N) or Binary Search O(log N)."
      };
    } else if (category.includes("graph") || category.includes("tree")) {
      return {
        title: "🌳 Tree & Graph Traversal (DFS/BFS)",
        desc: "Explores nodes level-by-level (BFS) or depth-by-depth (DFS). BFS uses a Queue (shortest path), DFS uses recursion or a Stack.",
        tip: "Always maintain a visited set (e.g. Set/Array) to prevent cycles or infinite loops when running graph traversals."
      };
    } else if (category.includes("hashmap") || category.includes("frequency")) {
      return {
        title: "🔑 Frequency Counter / Hash Map Cache",
        desc: "Stores elements as keys and counts/indices as values. Converts nested search loops (O(N^2)) to fast hash table lookups (O(1)).",
        tip: "Use Map or Object keys to count occurrences, store active element index, or cache calculations."
      };
    } else {
      return {
        title: "⚡ Sliding Window / Two Pointers Pattern",
        desc: "Scans arrays or strings using moving boundaries. Two pointers scan from outer edges inward, while Sliding Window maintains a dynamic contiguous slice.",
        tip: "Use Two Pointers when the array is sorted. Use Sliding Window for finding contiguous subarrays meeting constraints."
      };
    }
  };

  const pattern = getDsaPatternInfo();

  return (
    <div style={{
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.02)",
      overflow: "hidden",
      marginBottom: 20
    }}>
      <style>{`
        .dash-tab-btn {
          padding: 8px 14px;
          font-size: 11px;
          font-weight: 700;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dash-tab-btn.active {
          color: #3b82f6;
          border-bottom: 2.5px solid #3b82f6;
        }
        .dash-tab-btn:hover {
          color: #2563eb;
          background: #f8fafc;
        }
        .ec-sim-card {
          flex: 1;
          min-width: 200px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.2s ease;
        }
        .ec-sim-card:hover {
          transform: translateY(-1.5px);
          border-color: #cbd5e1;
          box-shadow: 0 4px 6px rgba(0,0,0,0.04);
        }
        .sim-btn {
          width: 100%;
          margin-top: 8px;
          padding: 5px 8px;
          background: white;
          border: 1px solid #3b82f6;
          color: #3b82f6;
          font-size: 9px;
          font-weight: 750;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }
        .sim-btn:hover {
          background: #3b82f6;
          color: white;
          box-shadow: 0 2px 4px rgba(59,130,246,0.15);
        }
      `}</style>

      {/* Modern Dashboard Header */}
      <div style={{
        background: "#fafafa",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        padding: "0 12px"
      }}>
        <span style={{ padding: "10px 4px", fontSize: 11, fontWeight: 800, color: "#475569", letterSpacing: 0.5, textTransform: "uppercase" }}>
          📊 Complexity & Student Guidance
        </span>
        <div style={{ display: "flex" }}>
          <button 
            className={`dash-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            📈 Scale & Profile
          </button>
          <button 
            className={`dash-tab-btn ${activeTab === "oj" ? "active" : ""}`}
            onClick={() => setActiveTab("oj")}
          >
            🚦 OJ Calculator
          </button>
          <button 
            className={`dash-tab-btn ${activeTab === "toolbox" ? "active" : ""}`}
            onClick={() => setActiveTab("toolbox")}
          >
            🎓 Student Toolbox
          </button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Tab 1: Profile & Scale */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {/* Left SVG Chart */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>Complexity Growth Curve</div>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 12 }}>💡 Move mouse across curve to compare operations for input size N.</div>
                
                <div 
                  style={{ position: "relative", cursor: "crosshair" }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <svg viewBox="0 0 200 120" style={{ width: "100%", height: "auto", background: "#f8fafc", borderRadius: 8, padding: 8 }}>
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Grid lines */}
                    <line x1="20" y1="95" x2="180" y2="95" stroke="#cbd5e1" strokeWidth="0.8" />
                    <line x1="20" y1="77" x2="180" y2="77" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="20" y1="50" x2="180" y2="50" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="20" y1="23" x2="180" y2="23" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="20" y1="10" x2="180" y2="10" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,2" />
                    
                    <line x1="60" y1="10" x2="60" y2="95" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="100" y1="10" x2="100" y2="95" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="140" y1="10" x2="140" y2="95" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="180" y1="10" x2="180" y2="95" stroke="#cbd5e1" strokeWidth="0.8" />

                    <line x1="20" y1="10" x2="20" y2="95" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="15" y="95" fontSize="7" fill="#64748b" textAnchor="end" dominantBaseline="middle">0</text>
                    <text x="15" y="10" fontSize="7" fill="#64748b" textAnchor="end" dominantBaseline="middle">Time</text>
                    <text x="180" y="103" fontSize="7" fill="#64748b" textAnchor="middle">N (Input)</text>

                    {/* Chart curves */}
                    {complexities.map(c => {
                      const isActive = activeComplexity === c.key;
                      return (
                        <g key={c.key}>
                          <path
                            d={c.d}
                            fill="none"
                            stroke={c.color}
                            strokeWidth={isActive ? 2.8 : 1.2}
                            strokeDasharray={isActive ? "none" : "3,3"}
                            filter={isActive ? "url(#glow)" : "none"}
                            style={{ transition: "all 0.3s" }}
                          />
                          {isActive && !hoverN && (
                            <g>
                              <circle cx={150} cy={getYVal(c.key, 80)} r="4.5" fill={c.color} stroke="white" strokeWidth="1.5" />
                              <text
                                x={155}
                                y={getYVal(c.key, 80) - 5}
                                fontSize="7"
                                fontWeight="800"
                                fill={c.color}
                                textAnchor="start"
                              >
                                ⚡ Your Code ({analysis.timeComplexity})
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Interactive hover line & dots */}
                    {hoverN && (
                      <>
                        <line x1={xSvg} y1="10" x2={xSvg} y2="95" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2,2" />
                        {complexities.map(c => {
                          const yVal = getYVal(c.key, hoverN);
                          const isActive = activeComplexity === c.key;
                          return (
                            <g key={c.key}>
                              <circle
                                cx={xSvg}
                                cy={yVal}
                                r={isActive ? 4 : 2.5}
                                fill={c.color}
                                stroke="white"
                                strokeWidth={isActive ? 1.5 : 1}
                                style={{ transition: "cy 0.1s, cx 0.1s" }}
                              />
                            </g>
                          );
                        })}
                      </>
                    )}
                  </svg>

                  {/* Tooltip Card */}
                  {hoverN && (
                    <div style={{
                      position: "absolute",
                      top: Math.max(5, hoverPos.y - 120),
                      left: Math.min(hoverPos.x + 12, 140),
                      background: "rgba(15, 23, 42, 0.94)",
                      backdropFilter: "blur(6px)",
                      color: "white",
                      padding: "8px 10px",
                      borderRadius: 6,
                      fontSize: 9.5,
                      pointerEvents: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
                      zIndex: 10,
                      border: "1px solid rgba(255,255,255,0.1)",
                      width: 150
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 4, marginBottom: 5, fontWeight: "bold" }}>
                        <span style={{ color: "#94a3b8" }}>Input size N:</span>
                        <span style={{ color: "#38bdf8" }}>{hoverN}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {complexities.map(c => {
                          const isActive = activeComplexity === c.key;
                          const ops = getHoverVal(c.key, hoverN);
                          return (
                            <div key={c.key} style={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              color: isActive ? "#38bdf8" : "#cbd5e1", 
                              fontWeight: isActive ? "800" : "400",
                              fontSize: 9
                            }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color }} />
                                {c.label.split(" - ")[0]}
                              </span>
                              <span>{ops} {isActive ? "⚡" : ""}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Detailed Profile Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Big-O Breakdown</div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                    border: "1px solid #bfdbfe",
                    borderRadius: 10,
                    padding: 10
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8.5, color: "#1d4ed8", fontWeight: 750, textTransform: "uppercase" }}>
                      <span>⚙️</span> Time complexity
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#1e40af", marginTop: 4 }}>{analysis.timeComplexity}</div>
                    <div style={{ fontSize: 9.5, color: "#1e40af", marginTop: 6, opacity: 0.85 }}>
                      Worst: {analysis.complexityBreakdown?.worstCase || analysis.timeComplexity}
                    </div>
                    <div style={{ fontSize: 9.5, color: "#1e40af", opacity: 0.85 }}>
                      Average: {analysis.complexityBreakdown?.averageCase || analysis.timeComplexity}
                    </div>
                  </div>

                  <div style={{
                    background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)",
                    border: "1px solid #a5f3fc",
                    borderRadius: 10,
                    padding: 10
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8.5, color: "#0891b2", fontWeight: 750, textTransform: "uppercase" }}>
                      <span>💾</span> Space Complexity
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#155e75", marginTop: 4 }}>{analysis.spaceComplexity}</div>
                    <div style={{ fontSize: 9.5, color: "#155e75", marginTop: 6, opacity: 0.85 }}>
                      Auxiliary Storage: {analysis.spaceComplexity === "O(1)" ? "Constant" : "Linear / Heap"}
                    </div>
                    <div style={{ fontSize: 9.5, color: "#155e75", opacity: 0.85 }}>
                      Max Stack Depth: {analysis.category?.toLowerCase().includes("recursion") ? "O(N)" : "O(1)"}
                    </div>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", padding: 10, fontSize: 10, lineHeight: 1.5, color: "#334155" }}>
                  <strong>💡 Time Strategy:</strong> {analysis.complexityBreakdown?.timeBreakdown || analysis.explanation}
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", padding: 10, fontSize: 10, lineHeight: 1.5, color: "#334155" }}>
                  <strong>📂 Space Strategy:</strong> {analysis.complexityBreakdown?.spaceBreakdown || "No auxiliary space used."}
                </div>
              </div>
            </div>

            {/* Edge Cases Simulator (Interactive layout) */}
            {analysis.edgeCases && analysis.edgeCases.length > 0 && (
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#334155", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚠️</span> Interactive Edge Case Diagnostics
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {analysis.edgeCases.map((ec, idx) => {
                    let label = "Edge Case";
                    let desc = ec;
                    if (ec.toLowerCase().includes("empty") || ec.toLowerCase().includes("null")) {
                      label = "Empty / Null Input 🧊";
                    } else if (ec.toLowerCase().includes("single") || ec.toLowerCase().includes("one")) {
                      label = "Single Element 🎯";
                    } else if (ec.toLowerCase().includes("negative") || ec.toLowerCase().includes("less")) {
                      label = "Negative Values ➖";
                    } else if (ec.toLowerCase().includes("large") || ec.toLowerCase().includes("overflow")) {
                      label = "Integer Limit / Large Inputs 🚀";
                    } else if (ec.toLowerCase().includes("duplicate") || ec.toLowerCase().includes("repeating")) {
                      label = "Duplicate Elements 👥";
                    }
                    
                    return (
                      <div className="ec-sim-card" key={idx}>
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 750, color: "#b91c1c", marginBottom: 4 }}>{label}</div>
                          <div style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.4 }}>{desc}</div>
                        </div>
                        <button
                          className="sim-btn"
                          onClick={() => {
                            if (onSimulate) {
                              onSimulate(ec);
                            } else {
                              setCustomInput(ec);
                            }
                          }}
                        >
                          Simulate Case ⚡
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: OJ constraints */}
        {activeTab === "oj" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Interactive Constraint Calculator */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e3a8a", marginBottom: 4 }}>⏱️ Interactive Constraints Simulator</div>
              <p style={{ fontSize: 10.5, color: "#3b82f6", margin: "0 0 10px 0", lineHeight: 1.4 }}>
                Online Judges (LeetCode, Codeforces) allocate <strong>1 second (~10^8 operations)</strong>. Select an input size <strong>N</strong> to test which complexities will pass without throwing <strong>Time Limit Exceeded (TLE)</strong>!
              </p>
              
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {[10, 100, 1000, 10000, 100000, 10000000].map(val => (
                  <button
                    key={val}
                    onClick={() => setCustomN(val)}
                    style={{
                      padding: "5px 10px",
                      background: customN === val ? "#2563eb" : "white",
                      color: customN === val ? "white" : "#1e40af",
                      border: "1px solid #bfdbfe",
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    N = {val.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Operations calculator cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                {complexities.map(c => {
                  const ops = getOpResult(c.key, customN);
                  const isUserComplexity = activeComplexity === c.key;
                  const badge = getSafetyBadge(ops);
                  
                  return (
                    <div 
                      key={c.key} 
                      style={{ 
                        background: "white", 
                        border: isUserComplexity ? `2px solid ${c.color}` : "1px solid #e2e8f0", 
                        borderRadius: 8, 
                        padding: "8px 10px",
                        position: "relative"
                      }}
                    >
                      {isUserComplexity && (
                        <span style={{ position: "absolute", top: -8, right: 6, background: c.color, color: "white", fontSize: 6.5, padding: "1px 4px", borderRadius: 4, fontWeight: "bold" }}>YOUR CODE</span>
                      )}
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: c.color }}>{c.label.split(" - ")[0]}</div>
                      <div style={{ fontSize: 11, fontWeight: 750, color: "#1e293b", margin: "4px 0" }}>
                        {ops >= 1000000 ? `${(ops / 1000000).toFixed(1)}M ops` : `${ops.toLocaleString()} ops`}
                      </div>
                      <span style={{ 
                        fontSize: 8, 
                        fontWeight: 700, 
                        background: badge.bg, 
                        color: badge.color, 
                        border: `1.5px solid ${badge.border}`, 
                        padding: "2px 6px", 
                        borderRadius: 4,
                        display: "inline-block" 
                      }}>
                        {badge.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Standard constraints guide */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 750, color: "#334155", textTransform: "uppercase", marginBottom: 6 }}>💡 LeetCode Input-to-Complexity Mappings</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "6px 12px", fontSize: 9.5, borderTop: "1px dashed #cbd5e1", paddingTop: 8 }}>
                  <div style={{ fontWeight: 700, color: "#475569" }}>Max constraint limit N</div>
                  <div style={{ fontWeight: 700, color: "#475569" }}>Acceptable Big-O</div>

                  <div style={{ color: "#ef4444", fontWeight: 600 }}>N ≤ 10</div>
                  <div style={{ color: "#1e293b" }}>O(N!) or O(2^N) - Permutations / Backtracking</div>

                  <div style={{ color: "#f59e0b", fontWeight: 600 }}>N ≤ 20</div>
                  <div style={{ color: "#1e293b" }}>O(2^N) - Subsets / Subsequences DFS</div>

                  <div style={{ color: "#06b6d4", fontWeight: 600 }}>N ≤ 500</div>
                  <div style={{ color: "#1e293b" }}>O(N³) - Floyd-Warshall / 3 nested loops</div>

                  <div style={{ color: "#3b82f6", fontWeight: 600 }}>N ≤ 5000</div>
                  <div style={{ color: "#1e293b" }}>O(N²) - Nested loops / Matrix operations</div>

                  <div style={{ color: "#10b981", fontWeight: 600 }}>N ≤ 10^5</div>
                  <div style={{ color: "#1e293b", fontWeight: 700 }}>O(N log N) - Sorting, Merge/Quick Sort, Heap</div>

                  <div style={{ color: "#059669", fontWeight: 600 }}>N ≤ 10^7</div>
                  <div style={{ color: "#1e293b" }}>O(N) - Linear loops, Two Pointers, HashMap lookup</div>

                  <div style={{ color: "#7c3aed", fontWeight: 600 }}>N ≥ 10^8</div>
                  <div style={{ color: "#1e293b" }}>O(log N) or O(1) - Binary Search, Math / Formulas</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, fontWeight: 750, color: "#334155", textTransform: "uppercase", marginBottom: 6 }}>⏱️ Big-O Scalability Table</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5 }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #cbd5e1", color: "#64748b" }}>
                      <th style={{ padding: "4px 2px", textAlign: "left" }}>Complexity</th>
                      <th style={{ padding: "4px 2px", textAlign: "left" }}>N = 100</th>
                      <th style={{ padding: "4px 2px", textAlign: "left" }}>N = 10k</th>
                      <th style={{ padding: "4px 2px", textAlign: "left" }}>N = 1M</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "O(1)", values: ["<1 ms", "<1 ms", "<1 ms"], active: activeComplexity === "o_1", color: "#10b981" },
                      { label: "O(log N)", values: ["<1 ms", "<1 ms", "<1 ms"], active: activeComplexity === "o_log", color: "#06b6d4" },
                      { label: "O(N)", values: ["<1 ms", "<1 ms", "1 ms"], active: activeComplexity === "o_n", color: "#3b82f6" },
                      { label: "O(N log N)", values: ["<1 ms", "<1 ms", "20 ms"], active: activeComplexity === "o_nlog", color: "#f59e0b" },
                      { label: "O(N²)", values: ["<1 ms", "100 ms", "1.6 mins ⚠️"], active: activeComplexity === "o_n2", color: "#ef4444" }
                    ].map((row, idx) => (
                      <tr key={idx} style={{ 
                        borderBottom: "1px solid #f1f5f9", 
                        background: row.active ? `${row.color}08` : "transparent",
                        fontWeight: row.active ? "700" : "normal"
                      }}>
                        <td style={{ padding: "6px 2px", color: row.color }}>
                          {row.label} {row.active && "⚡"}
                        </td>
                        {row.values.map((v, vIdx) => (
                          <td key={vIdx} style={{ padding: "6px 2px", color: v.includes("⚠️") ? "#ef4444" : "#334155" }}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Student Toolbox */}
        {activeTab === "toolbox" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {/* Pattern Recognition Card */}
              <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 9.5, color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>🧭 AI Algorithmic Pattern Matcher</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#1e293b", marginTop: 4, marginBottom: 6 }}>{pattern.title}</div>
                <p style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.4, margin: "0 0 10px 0" }}>{pattern.desc}</p>
                <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 10px", fontSize: 9.5, color: "#7c2d12", lineHeight: 1.4 }}>
                  <strong>🎯 Strategy Recommendation:</strong> {pattern.tip}
                </div>
              </div>

              {/* Space-Time Tradeoff Selector */}
              <div style={{ background: "#fcf8ff", border: "1px solid #ebd5ff", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#581c87", marginBottom: 6 }}>⚖️ DSA Space-Time Tradeoff Guide</div>
                <div style={{ display: "flex", background: "#f3e8ff", padding: 3, borderRadius: 8, gap: 4 }}>
                  {["space", "balanced", "time"].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSpaceTimeTradeoff(mode)}
                      style={{
                        flex: 1,
                        padding: "5px 8px",
                        border: "none",
                        borderRadius: 6,
                        background: spaceTimeTradeoff === mode ? "white" : "transparent",
                        color: spaceTimeTradeoff === mode ? "#581c87" : "#7b39ed",
                        fontWeight: 700,
                        fontSize: 9.5,
                        cursor: "pointer",
                        boxShadow: spaceTimeTradeoff === mode ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                        textTransform: "uppercase"
                      }}
                    >
                      {mode === "space" ? "Space Opt" : (mode === "time" ? "Time Opt" : "Balanced")}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 10 }}>
                  {spaceTimeTradeoff === "space" && (
                    <div style={{ fontSize: 10, color: "#581c87", lineHeight: 1.4 }}>
                      <strong>🎯 Focus: O(1) Auxiliary Space</strong>
                      <p style={{ margin: "4px 0" }}>Maintain pointers (like `left` and `right`) and perform modifications in-place. Avoid creating new arrays or lists.</p>
                      <span style={{ color: "#d97706", fontWeight: "bold" }}>⚠️ Tradeoff:</span> May raise operations count to O(N^2) or require pre-sorting list O(N log N).
                    </div>
                  )}
                  {spaceTimeTradeoff === "balanced" && (
                    <div style={{ fontSize: 10, color: "#581c87", lineHeight: 1.4 }}>
                      <strong>🎯 Focus: Optimized Hybrid Strategy</strong>
                      <p style={{ margin: "4px 0" }}>Balance memory with operations speed. E.g. Sorting lists to use Binary Search later, or keeping a heap bounded to size K.</p>
                      <span style={{ color: "#059669", fontWeight: "bold" }}>✓ Best for:</span> General interview cases where O(N) space is acceptable for O(N) or O(N log N) runtimes.
                    </div>
                  )}
                  {spaceTimeTradeoff === "time" && (
                    <div style={{ fontSize: 10, color: "#581c87", lineHeight: 1.4 }}>
                      <strong>🎯 Focus: O(1) Hash Table Lookup</strong>
                      <p style={{ margin: "4px 0" }}>Use HashMaps, sets, or frequency arrays to cache lookup variables. Reduces search time from O(N) loops to O(1) cache hits.</p>
                      <span style={{ color: "#d97706", fontWeight: "bold" }}>⚠️ Tradeoff:</span> Cost is O(N) memory storage for storing the table elements.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Optimization Student Checklist */}
            <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#334155", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6 }}>
                🛠️ Student Code Optimizer Checklist
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                {[
                  {
                    id: "hash",
                    label: "Can we use a HashMap / Set cache?",
                    desc: "Reduces nested loop searches from O(N²) to linear O(N) by saving elements.",
                    reward: "Awesome! Replacing search loops with key lookups saves enormous time."
                  },
                  {
                    id: "sort",
                    label: "Can pre-sorting simplify the list?",
                    desc: "Sorting takes O(N log N) but allows two-pointer merges O(N) or binary searches O(log N).",
                    reward: "Perfect! Sorted lists are super easy to process with pointers."
                  },
                  {
                    id: "twoPointers",
                    label: "Can we use Two Pointers or Sliding Window?",
                    desc: "Use boundaries to scan arrays in a single pass instead of double nested loops.",
                    reward: "Excellent! Keeps space O(1) and runtime O(N)."
                  },
                  {
                    id: "heap",
                    label: "Should we use a Heap / Priority Queue?",
                    desc: "Perfect if you constantly need the minimum or maximum element in O(1) time.",
                    reward: "Great choice! Pushing and popping is lightning fast at O(log K)."
                  },
                  {
                    id: "inplace",
                    label: "Can we do this in-place to save space?",
                    desc: "Use index swapping inside the original array to achieve O(1) memory usage.",
                    reward: "Brilliant! Zero additional storage keeps memory footprint minimal."
                  }
                ].map(item => (
                  <label 
                    key={item.id} 
                    style={{ 
                      display: "flex", 
                      gap: 8, 
                      background: checklist[item.id] ? "#f0fdf4" : "white",
                      border: checklist[item.id] ? "1px solid #bbf7d0" : "1px solid #e2e8f0", 
                      borderRadius: 8, 
                      padding: 10,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checklist[item.id]}
                      onChange={(e) => setChecklist(p => ({ ...p, [item.id]: e.target.checked }))}
                      style={{ marginTop: 2, cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: checklist[item.id] ? "#166534" : "#1e293b", textDecoration: checklist[item.id] ? "line-through" : "none" }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: 9.5, color: checklist[item.id] ? "#15803d" : "#64748b", marginTop: 2 }}>
                        {checklist[item.id] ? `🎉 ${item.reward}` : item.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Similar Interview Questions & Company Tags */}
            <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#334155", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6 }}>
                🏢 Similar Interview Questions & Company Tags
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analysis.relatedAlgorithms && analysis.relatedAlgorithms.length > 0 ? (
                  analysis.relatedAlgorithms.map((algo, idx) => {
                    const diffColors = {
                      Easy: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
                      Medium: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
                      Hard: { bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5" }
                    };
                    const diff = algo.difficulty || "Medium";
                    const colors = diffColors[diff] || diffColors.Medium;

                    const companies = Array.isArray(algo.companies) && algo.companies.length > 0
                      ? algo.companies
                      : ["Google", "Meta", "Amazon", "Microsoft", "Uber", "Apple", "Netflix", "Adobe"].slice(idx * 2, idx * 2 + 3);

                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          background: "#fafafa", 
                          border: "1px solid #e2e8f0", 
                          borderRadius: 8, 
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                            🔗 {algo.name}
                          </span>
                          <span style={{ 
                            fontSize: 8.5, 
                            fontWeight: 700, 
                            background: colors.bg, 
                            color: colors.text, 
                            border: `1.5px solid ${colors.border}`, 
                            padding: "2px 6px", 
                            borderRadius: 4
                          }}>
                            {diff}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.4 }}>
                          <strong>Connection:</strong> {algo.relation || "Applies a similar algorithmic approach."}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", marginTop: 2 }}>
                          <span style={{ fontSize: 8.5, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginRight: 4 }}>Asked By:</span>
                          {companies.map((c, cIdx) => (
                            <span 
                              key={cIdx} 
                              style={{ 
                                fontSize: 8.5, 
                                fontWeight: 650, 
                                background: "white", 
                                color: "#1e3a8a", 
                                border: "1.5px solid #dbeafe", 
                                padding: "2px 6px", 
                                borderRadius: 6
                              }}
                            >
                              💼 {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: 10, color: "#64748b" }}>
                    No related algorithms simulated.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Scaling Insight */}
      <div style={{ 
        borderTop: "1px solid #f1f5f9", 
        padding: "12px 16px", 
        background: "#fafafa",
        fontSize: 10,
        color: "#64748b",
        display: "flex",
        alignItems: "center",
        gap: 6
      }}>
        <span>💡</span>
        <strong>Big-O scaling tip:</strong> Choose your algorithms based on the constraints limit N. When in doubt, O(N) and O(N log N) are safe for almost all interview constraints!
      </div>
    </div>
  );
}

function getActiveArray(steps, stepIdx) {
  for (let i = stepIdx; i >= 0; i--) {
    if (steps[i]?.arr) return steps[i].arr;
  }
  return null;
}

function getActiveMatrix(steps, stepIdx) {
  for (let i = stepIdx; i >= 0; i--) {
    if (steps[i]?.matrix) return steps[i].matrix;
  }
  return null;
}

function getActiveNodeStates(steps, stepIdx) {
  for (let i = stepIdx; i >= 0; i--) {
    if (steps[i]?.nodeStates && Object.keys(steps[i].nodeStates).length > 0) {
      return steps[i].nodeStates;
    }
  }
  return {};
}

function getActiveNodeVals(steps, stepIdx) {
  for (let i = stepIdx; i >= 0; i--) {
    if (steps[i]?.nodeVals && Object.keys(steps[i].nodeVals).length > 0) {
      return steps[i].nodeVals;
    }
  }
  return {};
}

function getActiveEdgeStates(steps, stepIdx) {
  for (let i = stepIdx; i >= 0; i--) {
    if (steps[i]?.edgeStates && Object.keys(steps[i].edgeStates).length > 0) {
      return steps[i].edgeStates;
    }
  }
  return {};
}

function getActiveLinkedList(steps, stepIdx) {
  for (let i = stepIdx; i >= 0; i--) {
    if (steps[i]?.linkedList) return steps[i].linkedList;
    if (steps[i]?.arr) {
      return steps[i].arr.map((val, idx) => ({ id: idx, val, state: "idle" }));
    }
  }
  return null;
}

function getActiveStack(steps, stepIdx) {
  for (let i = stepIdx; i >= 0; i--) {
    if (steps[i]?.stack) return steps[i].stack;
    if (steps[i]?.arr) return steps[i].arr;
  }
  return null;
}

function getActiveQueue(steps, stepIdx) {
  for (let i = stepIdx; i >= 0; i--) {
    if (steps[i]?.queue) return steps[i].queue;
    if (steps[i]?.arr) return steps[i].arr;
  }
  return null;
}

function processParsedAnalysis(parsed, originalCode) {
  if (!parsed) return parsed;
  if (parsed.isValid === false) return parsed;
  if (parsed.isProcessed) return parsed;

  // Clone parsed object to avoid mutations
  const result = { ...parsed };
  if (result.transpiledSolutions) {
    result.transpiledSolutions = { ...result.transpiledSolutions };
  }
  if (result.quiz) {
    result.quiz = result.quiz.map(q => ({ ...q }));
  }

  const actualCode = (!result.isCorrect && result.correctedCode) ? result.correctedCode : originalCode;
  if (!actualCode) return result;

  const actualLines = actualCode.split('\n');
  const codeLines = result.codeLines || [];
  const reconstructedCodeLines = actualLines.map(lineText => ({
    line: lineText,
    explain: ""
  }));

  const codeLineToReconstructedMap = {};
  let codeLinesIdx = 0;

  for (let i = 0; i < reconstructedCodeLines.length; i++) {
    const actualClean = reconstructedCodeLines[i].line.trim();
    if (!actualClean) continue;

    for (let j = codeLinesIdx; j < codeLines.length; j++) {
      const candidateClean = (codeLines[j]?.line || "").trim();
      if (actualClean === candidateClean || actualClean.includes(candidateClean) || candidateClean.includes(actualClean)) {
        reconstructedCodeLines[i].explain = codeLines[j].explain || "";
        codeLineToReconstructedMap[j] = i;
        codeLinesIdx = j + 1;
        break;
      }
    }
  }

  // Update activeLine and highlight refs in steps
  if (result.steps && Array.isArray(result.steps)) {
    result.steps = result.steps.map(step => {
      if (!step) return step;
      let updatedStep = { ...step };
      if (step.activeLine !== undefined && step.activeLine !== null) {
        const mappedIdx = codeLineToReconstructedMap[step.activeLine];
        updatedStep.activeLine = mappedIdx !== undefined ? mappedIdx : step.activeLine;
      }
      if (Array.isArray(step.highlight)) {
        updatedStep.highlight = step.highlight.map(idx => {
          const mappedIdx = codeLineToReconstructedMap[idx];
          return mappedIdx !== undefined ? mappedIdx : idx;
        });
      }
      return updatedStep;
    });
  }

  result.codeLines = reconstructedCodeLines;
  result.isProcessed = true;
  result.visualizerCode = actualCode;

  return result;
}

export default function DSAAnalyzer() {
  const [code, setCode] = useState(DEMOS.remove_dup.code);
  const [activeDemo, setActiveDemo] = useState("remove_dup");
  const [phase, setPhase] = useState("idle");
  const [analysis, setAnalysis] = useState(null);
  const [hintsExpanded, setHintsExpanded] = useState(false);
  const [activeHintIdx, setActiveHintIdx] = useState(-1);
  const [error, setError] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [customInput, setCustomInput] = useState("");
  const [vizMode, setVizMode] = useState("cells");
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedLangTab, setSelectedLangTab] = useState("cpp");
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem("groq_api_key") || "");
  const [showKey, setShowKey] = useState(false);
  const [isDefaultKeyExhausted, setIsDefaultKeyExhausted] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizExplanationShown, setQuizExplanationShown] = useState(false);
  const [quizAnswerResults, setQuizAnswerResults] = useState([]);
  const [graphEditMode, setGraphEditMode] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dsa_history")) || [];
    } catch (e) {
      return [];
    }
  });
  const timerRef = useRef(null);
  const SPEEDS = [1600, 900, 500, 220, 80];
  const SLABELS = ["Slowest", "Slow", "Normal", "Fast", "Fastest"];

  function loadDemo(key) {
    setCode(DEMOS[key].code);
    setActiveDemo(key);
    setCustomInput("");
    setAnalysis(null);
    setPhase("idle");
    setError("");
    setPlaying(false);
    clearTimeout(timerRef.current);
    setHintsExpanded(false);
    setActiveHintIdx(-1);
  }

  function saveToHistory(parsedData) {
    const newEntry = {
      id: Date.now(),
      algorithmName: parsedData.algorithmName || "Custom Algorithm",
      category: parsedData.category || "Unknown",
      code: code,
      customInput: customInput,
      analysis: parsedData
    };
    setHistory(prev => {
      const filtered = prev.filter(item => item.code !== code);
      const updated = [newEntry, ...filtered].slice(0, 5);
      localStorage.setItem("dsa_history", JSON.stringify(updated));
      return updated;
    });
  }

  function generateQuizQuestion(index) {
    if (!analysis || !steps || steps.length <= 1) return null;
    const curStep = steps[index];
    const nextStep = steps[index + 1] || steps[0];
    const roll = Math.random() > 0.5;

    if (roll && curStep.variables && nextStep.variables) {
      const changedVarName = Object.keys(curStep.variables).find(
        key => curStep.variables[key] !== nextStep.variables[key]
      );
      if (changedVarName) {
        const correctVal = nextStep.variables[changedVarName];
        const oldVal = curStep.variables[changedVarName];
        const options = [correctVal, oldVal];
        let distractor = String(isNaN(correctVal) ? "null" : Number(correctVal) + 1);
        if (options.includes(distractor)) distractor = String(Number(correctVal) - 1);
        options.push(distractor);
        const shuffled = [...new Set(options)].sort(() => Math.random() - 0.5);

        return {
          type: "variable",
          question: `What will the value of variable '${changedVarName}' be in the next step?`,
          options: shuffled,
          correct: correctVal
        };
      }
    }

    const correctLine = nextStep.activeLine + 1;
    const currentLine = curStep.activeLine + 1;
    const options = [correctLine, currentLine];
    const totalLines = analysis.codeLines?.length || 10;
    while (options.length < 4) {
      const randLine = Math.floor(Math.random() * totalLines) + 1;
      if (!options.includes(randLine)) options.push(randLine);
    }
    const shuffled = options.sort(() => Math.random() - 0.5);
    return {
      type: "line",
      question: `Which line of code will execute next?`,
      options: shuffled.map(l => ({ lineNum: l, text: `Line ${l}: ${analysis.codeLines?.[l - 1]?.line?.trim() || "..."}` })),
      correct: correctLine
    };
  }

  function getFallbackConceptualQuestions() {
    const category = analysis?.category || "Array";
    const complexity = analysis?.timeComplexity || "O(N)";
    const name = analysis?.algorithmName || "this algorithm";

    return [
      {
        question: `What is the primary factor determining the time complexity of ${name}?`,
        options: [
          `The number of operations proportional to the input size, yielding ${complexity}`,
          "The recursion stack depth only",
          "The number of variable initializations",
          "The language compiler optimizations"
        ],
        correct: `The number of operations proportional to the input size, yielding ${complexity}`,
        explanation: `The time complexity ${complexity} is determined by the main loops or operations executed as the input size scales.`
      },
      {
        question: `How does the space complexity of ${name} scale with larger inputs?`,
        options: [
          `It scales according to ${analysis?.spaceComplexity || "O(1)"} based on auxiliary storage allocated`,
          "It doubles every time input size doubles regardless of algorithm design",
          "It decreases as input size grows due to garbage collection",
          "It is always O(N^2) for array operations"
        ],
        correct: `It scales according to ${analysis?.spaceComplexity || "O(1)"} based on auxiliary storage allocated`,
        explanation: `Space complexity measures the extra memory utilized by the algorithm, excluding the input itself.`
      },
      {
        question: `Which of the following describes a potential boundary or edge case for ${name}?`,
        options: [
          "An empty input or single-element input where loop conditions might terminate immediately",
          "An input containing only negative values",
          "Running the code on a mobile device instead of a desktop",
          "The variables having different variable names in transpiled code"
        ],
        correct: "An empty input or single-element input where loop conditions might terminate immediately",
        explanation: "Edge cases like empty arrays or single element lists are critical check-points since incorrect pointer/index checking can lead to index out of bounds exceptions."
      }
    ];
  }

  const loadQuizQuestion = (idx, currentAnalysis) => {
    const activeAnalysis = currentAnalysis || analysis;
    if (activeAnalysis?.quiz && Array.isArray(activeAnalysis.quiz) && activeAnalysis.quiz.length > 0) {
      setQuizQuestion(activeAnalysis.quiz[idx]);
    } else {
      const fallbacks = getFallbackConceptualQuestions();
      setQuizQuestion(fallbacks[idx]);
    }
    setQuizSelected(null);
    setQuizFeedback("");
    setQuizExplanationShown(false);
  };

  const toggleQuizMode = () => {
    if (!quizActive) {
      setPlaying(false);
      setQuizQuestionIdx(0);
      setQuizScore(0);
      setQuizFinished(false);
      setQuizSelected(null);
      setQuizFeedback("");
      setQuizExplanationShown(false);
      setQuizAnswerResults([]);
      loadQuizQuestion(0, analysis);
    }
    setQuizActive(!quizActive);
  };

  const handleAnswerClick = (option) => {
    if (quizExplanationShown) return;

    const correctAns = quizQuestion.correct;
    const isCorrect = String(option).trim() === String(correctAns).trim();

    setQuizSelected(option);
    setQuizExplanationShown(true);

    if (isCorrect) {
      setQuizFeedback("correct");
      setQuizScore(s => s + 1);
      setQuizAnswerResults(prev => [...prev, true]);
    } else {
      setQuizFeedback("wrong");
      setQuizAnswerResults(prev => [...prev, false]);
    }
  };

  const handleNextQuizQuestion = () => {
    const totalQ = (analysis?.quiz && Array.isArray(analysis.quiz) && analysis.quiz.length > 0)
      ? analysis.quiz.length
      : 3;

    if (quizQuestionIdx < totalQ - 1) {
      const nextIdx = quizQuestionIdx + 1;
      setQuizQuestionIdx(nextIdx);
      loadQuizQuestion(nextIdx);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setQuizQuestionIdx(0);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizSelected(null);
    setQuizFeedback("");
    setQuizExplanationShown(false);
    setQuizAnswerResults([]);
    loadQuizQuestion(0);
  };

  useEffect(() => {
    if (quizActive && analysis) {
      setQuizQuestionIdx(0);
      setQuizScore(0);
      setQuizFinished(false);
      setQuizSelected(null);
      setQuizFeedback("");
      setQuizExplanationShown(false);
      setQuizAnswerResults([]);
      loadQuizQuestion(0, analysis);
    }
  }, [quizActive, analysis]);

  function loadHistoryItem(item) {
    setCode(item.code);
    setCustomInput(item.customInput || "");
    const processed = processParsedAnalysis(item.analysis, item.code);
    setAnalysis(processed);
    setStepIdx(0);
    setPhase("done");
    setError("");
    setPlaying(false);
    clearTimeout(timerRef.current);
    setHintsExpanded(false);
    setActiveHintIdx(-1);

    if (processed) {
      const detectedLang = String(processed.language || "").toLowerCase();
      if (detectedLang.includes("c++") || detectedLang.includes("cpp")) setSelectedLangTab("cpp");
      else if (detectedLang.includes("python")) setSelectedLangTab("python");
      else if (detectedLang.includes("java") && !detectedLang.includes("script")) setSelectedLangTab("java");
      else if (detectedLang.includes("javascript") || detectedLang.includes("js")) setSelectedLangTab("javascript");
    }
  }

  function clearHistory() {
    localStorage.removeItem("dsa_history");
    setHistory([]);
  }

  async function analyze(overrideInput) {
    if (!code.trim()) return;
    const activeKey = customApiKey.trim() || DEFAULT_GROQ_API_KEY;
    if (!activeKey) {
      setError("Groq API Key is not configured. Please add one in Settings or .env file.");
      setPhase("error");
      return;
    }
    setPhase("analyzing"); setAnalysis(null); setError(""); setPlaying(false);
    setHintsExpanded(false);
    setActiveHintIdx(-1);
    setIsDefaultKeyExhausted(false);
    clearTimeout(timerRef.current);

    const targetInput = typeof overrideInput === "string" ? overrideInput : customInput;

    let userPrompt = "Analyze this code and return JSON:\n\n" + code + "\n\n";
    if (targetInput.trim()) {
      userPrompt += "Simulate the execution step-by-step using this custom input structure: " + targetInput.trim() + "\n\n";
    }
    userPrompt += `CRITICAL SIMULATION INSTRUCTIONS:
- You MUST generate the complete, non-truncated execution trace from the first line of execution all the way to the final return statement. Do NOT summarize the iterations, do NOT use shortcuts (like "repeating steps 4-8..."), and do NOT skip any steps. If the execution requires 30, 40, or 60 steps on the input, you MUST output every single step in the 'steps' array.
- For each step, you MUST set the boolean field "isVisualStep". Set it to true if this step represents a major visual state transition (like a push/pop, enqueue/dequeue, index compare/swap, node visit, cell edit, or pointer shift). Set it to false for intermediate steps (such as entering loop headers, variable declarations, or entry braces). This is critical so the visualizer can skip minor lines while the Dry Run table shows the entire complete trace.
- Each individual comparison, swap, pointer movement, recursive call, or variable update must be its own separate step.
- For sorting/array algorithms: every single element comparison and swap must be animated. The array state ('arr') in each step must show the exact array elements at that moment, and the 'arrStates' must highlight the indices currently being compared (comparing), swapped (swapping), or sorted (done).
- For graph/tree algorithms: show each node visited (visited) and active edge traversed (highlighted) step by step. If nodes or edges are inserted, deleted, or shifted (e.g., BST insertion), update the "graphLayout" dynamically in the steps to reflect structure changes in real-time.
- For grid/matrix algorithms: show cell-by-cell movements.
- For stack algorithms: the 'stack' array MUST contain the entire list of elements currently in the stack (from index 0 at the bottom to the top-most element), not just the top element.
- For queue algorithms: the 'queue' array MUST contain the entire list of elements currently in the queue (from index 0 at the front to the rear element), not just the front element.
- If the algorithm uses two or more data structures simultaneously (e.g., an array and a stack, or a grid matrix and a queue), you MUST populate all relevant fields (e.g. both 'arr' and 'stack', or both 'matrix' and 'queue') in each step so they can be visualized together.
- For heap algorithms: represent the heap as both an array ('arr') and a tree ('graphLayout') simultaneously in each step to visualize them side-by-side.
- For linked list algorithms: you MUST trace every single pointer modification (e.g., storing next node, changing next pointers, and shifting pointers like prev, curr, nextTemp, fast, slow) as distinct steps. Do NOT combine these pointer assignments or jump over iterations. Every step must display the complete updated linked list node sequence and the exact location of all active pointers. Make sure next pointers are correctly represented for each node to show reversal.
- CRITICAL: You MUST focus on the "crux" (the core algorithmic concept) of the question and explain it properly, step-by-step, and completely. Do NOT truncate or skip loop iterations or recurse states.
- In the "variables" field of each step, track every loop index (e.g., i, j, mid, left, right) and active variable.
- Explain what happens in the "msg" field in beginner-friendly language.
- For "codeLines": You MUST include the complete, line-by-line representation of the ENTIRE algorithm (from the first line of code to the very last line, including helper functions, headers, declarations, all loop blocks, closing braces, and return statements). Do NOT skip any lines or truncate the code. The visualizer needs the entire code to show the line highlighting correctly.
- Ensure that "activeLine" in each step points EXACTLY to the 0-indexed index of the line in "codeLines" that is currently executing (e.g., if you are comparing elements, "activeLine" must be the index of the comparison statement/if-statement line, NOT the loop header or initialization line). Do not shift or offset these index pointers.`;

    const candidates = [
      { id: "llama-3.3-70b-versatile", jsonMode: true },
      { id: "openai/gpt-oss-120b", jsonMode: true },
      { id: "llama-3.1-8b-instant", jsonMode: true }
    ];

    let lastError = null;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      try {
        const reqBody = {
          model: candidate.id,
          temperature: 0.1,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ]
        };
        if (candidate.maxTokens) {
          reqBody.max_tokens = candidate.maxTokens;
        }
        if (candidate.jsonMode) {
          reqBody.response_format = { type: "json_object" };
        }

        const res = await fetch(GROQ_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + activeKey },
          body: JSON.stringify(reqBody)
        });

        if (!res.ok) {
          if (res.status === 413) {
            throw new Error("Request Entity Too Large: The code or custom test input is too large to analyze. Please shorten it.");
          }
          const d = await res.json().catch(() => ({}));
          const msg = d?.error?.message || `Groq API error ${res.status}`;
          throw new Error(msg);
        }

        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content || "";
        const clean = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        const processedParsed = processParsedAnalysis(parsed, code);

        setAnalysis(processedParsed);
        setStepIdx(0);
        setPhase("done");

        const detectedLang = String(processedParsed.language || "").toLowerCase();
        if (detectedLang.includes("c++") || detectedLang.includes("cpp")) setSelectedLangTab("cpp");
        else if (detectedLang.includes("python")) setSelectedLangTab("python");
        else if (detectedLang.includes("java") && !detectedLang.includes("script")) setSelectedLangTab("java");
        else if (detectedLang.includes("javascript") || detectedLang.includes("js")) setSelectedLangTab("javascript");

        if (processedParsed.isValid !== false) {
          saveToHistory(processedParsed);
        }
        return; // Success, exit function
      } catch (e) {
        console.warn(`Model candidate ${candidate.id} failed:`, e);
        lastError = e;
      }
    }

    // If all candidates failed
    const errMsg = lastError?.message?.toLowerCase() || "";
    const isRateLimitOrAuth = errMsg.includes("rate limit") ||
      errMsg.includes("rate_limit") ||
      errMsg.includes("quota") ||
      errMsg.includes("balance") ||
      errMsg.includes("auth") ||
      errMsg.includes("unauthorized") ||
      errMsg.includes("key");

    if (errMsg.includes("too large") || errMsg.includes("413")) {
      setError("The code or custom test input you provided is too large to analyze. Please shorten your code snippet or simplify your custom test input.");
    } else if (isRateLimitOrAuth && !customApiKey.trim()) {
      setIsDefaultKeyExhausted(true);
      setError("The default shared API key has reached its rate limit or run out of quota.");
    } else {
      setError(lastError?.message || "Failed to analyze. Check your code and try again.");
    }
    setPhase("error");
  }

  const steps = analysis?.steps || [];
  const cur = steps[stepIdx] || null;
  const prev = stepIdx > 0 ? steps[stepIdx - 1] : null;

  // Determine active visualizer mode based on category & layout fields
  const categoryLower = String(analysis?.category || "").toLowerCase();
  const isGraphMode = !!analysis?.graphLayout || categoryLower.includes("graph") || categoryLower.includes("tree");
  const isMatrixMode = categoryLower.includes("matrix") || categoryLower.includes("grid") || steps.some(s => s?.matrix);
  const isLinkedListMode = categoryLower.includes("linked") || steps.some(s => s?.linkedList);
  const isStackMode = categoryLower.includes("stack") || steps.some(s => s?.stack);
  const isQueueMode = categoryLower.includes("queue") || steps.some(s => s?.queue);
  const isArrayMode = categoryLower.includes("array") || 
                       categoryLower.includes("string") || 
                       categoryLower.includes("sort") || 
                       categoryLower.includes("search") || 
                       categoryLower.includes("two pointer") || 
                       categoryLower.includes("sliding window") ||
                       categoryLower.includes("character") ||
                       categoryLower.includes("vector");

  // Fallback states resolver
  const activeArr = getActiveArray(steps, stepIdx);
  const activeMatrix = getActiveMatrix(steps, stepIdx);
  const activeNodeStates = getActiveNodeStates(steps, stepIdx);
  const activeNodeVals = getActiveNodeVals(steps, stepIdx);
  const activeEdgeStates = getActiveEdgeStates(steps, stepIdx);
  const activeLinkedList = getActiveLinkedList(steps, stepIdx);
  const activeStack = getActiveStack(steps, stepIdx);
  const activeQueue = getActiveQueue(steps, stepIdx);

  const tick = useCallback(() => {
    setStepIdx(p => {
      if (p >= steps.length - 1) { setPlaying(false); return p; }
      for (let i = p + 1; i < steps.length; i++) {
        if (steps[i]?.isVisualStep !== false || i === steps.length - 1) return i;
      }
      setPlaying(false);
      return p;
    });
  }, [steps]);

  useEffect(() => {
    if (playing) { timerRef.current = setTimeout(tick, SPEEDS[speed - 1]); }
    return () => clearTimeout(timerRef.current);
  }, [playing, stepIdx, speed, tick]);

  function handlePlay() {
    if (stepIdx >= steps.length - 1) { setStepIdx(0); setPlaying(true); return; }
    setPlaying(p => !p);
  }

  const pb = {
    idle: { label: "Idle", bg: "#f1f3f4", color: "#5f6368" },
    analyzing: { label: "Analyzing...", bg: "#e8f0fe", color: "#1a73e8" },
    done: { label: "Ready", bg: "#e6f4ea", color: "#137333" },
    error: { label: "Error", bg: "#fce8e6", color: "#c5221f" }
  }[phase] || { label: "Idle", bg: "#f1f3f4", color: "#5f6368" };

  const card = {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)",
    overflow: "hidden",
    marginBottom: 20
  };
  const ch = {
    padding: "10px 16px",
    borderBottom: "1px solid #f1f5f9",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  };
  const lbl = {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: 1,
    textTransform: "uppercase"
  };
  const B = {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#334155",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "inherit",
    transition: "all 0.15s"
  };

  return (
    <div style={{ fontFamily: "var(--font-ui), sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#0f172a", position: "relative" }}>

      {/* Main Workspace Body */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px" }}>

        {/* Header Section */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Custom geometric logo icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="5" r="3" fill="#3b82f6" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="5" cy="17" r="3" fill="#0f172a" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="19" cy="17" r="3" fill="#0f172a" stroke="#0f172a" strokeWidth="1.5" />
              <line x1="12" y1="8" x2="5" y2="14" stroke="#64748b" strokeWidth="2" />
              <line x1="12" y1="8" x2="19" y2="14" stroke="#64748b" strokeWidth="2" />
              <line x1="8" y1="17" x2="16" y2="17" stroke="#64748b" strokeWidth="2" />
            </svg>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5, lineHeight: 1.1 }}>
              <span style={{ color: "#3b82f6" }}>Algo</span>Vision
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
            {/* Status pill */}
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20, background: pb.bg, color: pb.color, border: `1px solid ${pb.color}20` }}>
              {pb.label}
            </span>

            {/* Creator Popover Trigger */}
            <button
              onClick={() => setProfileOpen(prev => !prev)}
              style={{
                background: "transparent",
                border: "1px solid #cbd5e1",
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                color: "#64748b",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
                outline: "none"
              }}
            >
              [ Settings / Creator ]
            </button>

            {/* Creator Popover Card */}
            {profileOpen && (
              <>
                <div
                  onClick={() => setProfileOpen(false)}
                  style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050, cursor: "default" }}
                />

                <div style={{
                  position: "absolute",
                  top: "32px",
                  right: "0px",
                  width: "300px",
                  maxWidth: "calc(100vw - 32px)",
                  background: "white",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  padding: "20px",
                  zIndex: 1100,
                  border: "1px solid #cbd5e1",
                  textAlign: "left"
                }}>
                  {/* Settings section */}
                  <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#475569", margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    ⚙️ API Configuration
                  </h3>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
                      Custom Groq API Key:
                    </label>
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        type={showKey ? "text" : "password"}
                        placeholder="gsk_..."
                        value={customApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomApiKey(val);
                          localStorage.setItem("groq_api_key", val);
                        }}
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 11,
                          fontFamily: "monospace",
                          outline: "none"
                        }}
                      />
                      <button
                        onClick={() => setShowKey(!showKey)}
                        title={showKey ? "Hide API Key" : "Show API Key"}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          cursor: "pointer",
                          fontSize: 11,
                          lineHeight: 1
                        }}
                      >
                        {showKey ? "👁️" : "🙈"}
                      </button>
                    </div>
                    {customApiKey && (
                      <button
                        onClick={() => {
                          setCustomApiKey("");
                          localStorage.removeItem("groq_api_key");
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ef4444",
                          fontSize: 9,
                          fontWeight: 750,
                          cursor: "pointer",
                          padding: 0,
                          marginTop: 6,
                          outline: "none"
                        }}
                      >
                        Clear Custom Key
                      </button>
                    )}
                    <p style={{ fontSize: 9.5, color: "#94a3b8", margin: "6px 0 0 0", lineHeight: 1.35 }}>
                      If set, this key overrides the default workspace API key. Stored securely in local storage. Get a free key at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontWeight: 700, textDecoration: "underline" }}>console.groq.com/keys</a>.
                    </p>
                  </div>

                  <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "14px 0" }} />

                  {/* Creator Profile section */}
                  <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#475569", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    👨‍💻 Creator Info
                  </h3>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: "0 0 2px 0" }}>
                    Kalpesh Paliwal
                  </h4>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 16px 0" }}>
                    klpshplwl455@gmail.com
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <a
                      href="https://github.com/Kalpeshcoder18/Kalpeshcoder18"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        textDecoration: "none",
                        color: "#0f172a",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "11px",
                        fontWeight: "600",
                        background: "#f8fafc",
                        textAlign: "center"
                      }}
                    >
                      🐙 GitHub Profile
                    </a>

                    <a
                      href="https://www.linkedin.com/in/kalpesh-paliwal-9a9747279/"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "block",
                        textDecoration: "none",
                        color: "#0f172a",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "11px",
                        fontWeight: "600",
                        background: "#f8fafc",
                        textAlign: "center"
                      }}
                    >
                      💼 LinkedIn Profile
                    </a>

                    <a
                      href="mailto:klpshplwl455@gmail.com"
                      style={{
                        display: "block",
                        textDecoration: "none",
                        color: "white",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "11px",
                        fontWeight: "600",
                        background: "#3b82f6",
                        textAlign: "center"
                      }}
                    >
                      ✉️ Send Email
                    </a>
                  </div>

                  <hr style={{ border: "0", borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />
                  <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0, textAlign: "center" }}>
                    Built with ❤️ in India • AlgoVision
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Code input */}
        <div style={card}>
          <div style={ch}>
            <span style={lbl}>Paste your code</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>-- C++, Python, Java, JavaScript supported</span>
          </div>

          {/* Try a demo */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginRight: 4 }}>Try a demo:</span>
            {Object.entries(DEMOS).map(([key, d]) => (
              <button key={key} onClick={() => loadDemo(key)} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${activeDemo === key ? "#3b82f6" : "#e2e8f0"}`, background: activeDemo === key ? "#dbeafe" : "white", color: activeDemo === key ? "#1e40af" : "#64748b", cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: activeDemo === key ? 700 : 400, transition: "all 0.15s" }}>{d.label}</button>
            ))}
          </div>

          {/* Custom Test Input */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#fcfdff" }}>
            <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Custom Test Input:</span>
            <input
              type="text"
              placeholder="e.g. Array: [5,2,9] or Graph: A-B(4), B-C(2) or Matrix: [[1,1,1],[1,1,0],[1,0,1]]"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                fontSize: 11,
                fontFamily: "var(--font-code)",
                flex: 1,
                minWidth: 250,
                outline: "none"
              }}
            />
            <span style={{ fontSize: 10, color: "#94a3b8" }}>(Optional)</span>
          </div>

          {/* History Panel */}
          {history.length > 0 && (
            <div style={{ padding: "8px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", background: "#fafafa" }}>
              <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginRight: 4 }}>Recent Runs:</span>
              {history.map(item => (
                <button
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "white",
                    color: "#334155",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 500,
                    fontFamily: "inherit",
                    transition: "all 0.15s"
                  }}
                  title={`${item.category}: click to load`}
                >
                  ⏱️ {item.algorithmName}
                </button>
              ))}
              <button
                onClick={clearHistory}
                style={{
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 600,
                  marginLeft: "auto"
                }}
              >
                Clear
              </button>
            </div>
          )}

          <textarea value={code} onChange={e => setCode(e.target.value)} spellCheck={false} style={{ width: "100%", minHeight: 160, padding: "14px 16px", border: "none", outline: "none", resize: "vertical", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, lineHeight: 1.7, color: "#1e293b", background: "#fafafa", boxSizing: "border-box", display: "block" }} />

          {isDefaultKeyExhausted && (
            <div style={{
              margin: "12px 16px",
              padding: "16px",
              background: "linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%)",
              border: "1.5px solid #fecaca",
              borderRadius: "10px",
              boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.05), 0 2px 4px -1px rgba(239, 68, 68, 0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "flex-start",
              animation: "fadeIn 0.3s ease-out"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#991b1b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Shared API Key Limit Reached
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#7f1d1d", lineHeight: 1.5 }}>
                The shared workspace developer API key is currently rate-limited or out of quota. To continue visualizing, please provide your own personal **Groq API Key** (you can get a free key at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: "#b91c1c", fontWeight: 700, textDecoration: "underline" }}>console.groq.com/keys</a>). Your key will only be used on this browser session and is kept completely private to you.
              </p>
              <button
                onClick={() => setProfileOpen(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)",
                  transition: "all 0.15s"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#b91c1c";
                  e.currentTarget.style.boxShadow = "0 3px 6px rgba(220, 38, 38, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(220, 38, 38, 0.2)";
                }}
              >
                ⚙️ Enter Personal API Key
              </button>
            </div>
          )}

          <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={analyze} disabled={phase === "analyzing" || !code.trim()} style={{ ...B, background: phase === "analyzing" ? "#f1f5f9" : "#0f172a", color: phase === "analyzing" ? "#94a3b8" : "white", border: "none", padding: "10px 24px", fontSize: 14, fontWeight: 700 }}>
              {phase === "analyzing" ? <Dots label="Analyzing" /> : "Analyze + Visualize"}
            </button>
            {error && <span style={{ fontSize: 12, color: "#ef4444", flex: 1 }}>Error: {error}</span>}
          </div>
        </div>

        {/* Results */}
        {analysis && (
          <>
            {analysis.isValid === false ? (
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#9a3412", marginBottom: 3 }}>Invalid or non-DSA code</div>
                <div style={{ fontSize: 12, color: "#c2410c" }}>Please paste a valid DSA algorithm.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 16 }}>
                  {[["Algorithm", analysis.algorithmName, "#0f172a"], ["Category", analysis.category, "#3b82f6"], ["Time", analysis.timeComplexity, "#8b5cf6"], ["Space", analysis.spaceComplexity, "#06b6d4"]].map(([l, v, c]) => (
                    <div key={l} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>{l}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: analysis.isCorrect ? "#f0fdf4" : "#fff7ed", border: `1px solid ${analysis.isCorrect ? "#86efac" : "#fed7aa"}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: analysis.isCorrect ? "#4c1d95" : "#9a3412", marginBottom: 3 }}>{analysis.isCorrect ? "Code is correct!" : "Issues found in your code"}</div>
                  <div style={{ fontSize: 12, color: analysis.isCorrect ? "#166534" : "#c2410c", lineHeight: 1.6 }}>{analysis.isCorrect ? analysis.explanation : (analysis.bugs || []).join(" | ")}</div>
                </div>

                <StudentHintsPanel 
                  analysis={analysis} 
                  hintsExpanded={hintsExpanded} 
                  setHintsExpanded={setHintsExpanded} 
                  activeHintIdx={activeHintIdx} 
                  setActiveHintIdx={setActiveHintIdx} 
                />

                <ComplexityDashboard 
                  analysis={analysis} 
                  setCustomInput={setCustomInput} 
                  onSimulate={(customVal) => {
                    setCustomInput(customVal);
                    analyze(customVal);
                  }}
                />

                {analysis && (
                  <div style={card}>
                    <div style={{
                      ...ch,
                      justifyContent: "space-between",
                      borderBottom: "1px solid #f1f5f9"
                    }}>
                      <span style={lbl}>
                        {analysis.isCorrect ? "🚀 Solution Implementations" : "🛠️ Corrected Code Solutions"}
                      </span>
                      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", padding: 3, borderRadius: 6 }}>
                        {[
                          { key: "cpp", label: "C++" },
                          { key: "python", label: "Python" },
                          { key: "java", label: "Java" },
                          { key: "javascript", label: "JavaScript" }
                        ].map(tab => (
                          <button
                            key={tab.key}
                            onClick={() => setSelectedLangTab(tab.key)}
                            style={{
                              padding: "4px 10px",
                              fontSize: 10,
                              fontWeight: 700,
                              border: "none",
                              borderRadius: 4,
                              background: selectedLangTab === tab.key ? "white" : "transparent",
                              color: selectedLangTab === tab.key ? "#1e293b" : "#64748b",
                              cursor: "pointer",
                              boxShadow: selectedLangTab === tab.key ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                              transition: "all 0.15s"
                            }}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: "14px 16px",
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#1e293b",
                      lineHeight: 1.7,
                      overflowX: "auto",
                      overflowY: "auto",
                      maxHeight: "350px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      background: "#fafafa"
                    }}>
                      {(() => {
                        if (analysis.transpiledSolutions && analysis.transpiledSolutions[selectedLangTab]) {
                          return analysis.transpiledSolutions[selectedLangTab];
                        }
                        if (!analysis.isCorrect && analysis.correctedCode) {
                          return analysis.correctedCode;
                        }
                        return code;
                      })()}
                    </pre>
                  </div>
                )}

                {analysis.howItWorks?.length > 0 && (
                  <div style={card}>
                    <div style={ch}><span style={lbl}>How it works</span></div>
                    <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                      {analysis.howItWorks.map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#dbeafe", color: "#1e40af", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                          <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {steps.length > 0 && (
                  <div style={card}>
                    <div style={{ padding: "10px 16px", background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#58a6ff", letterSpacing: 1, textTransform: "uppercase" }}>Live Visualization</span>
                      <span style={{ fontSize: 11, color: "#6e7681" }}>Step {stepIdx + 1} of {steps.length}</span>
                    </div>
                    <div className="live-viz-grid">
                      <div className="live-viz-left-col">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" }}>
                              Active Visualizations
                            </span>
                          </div>
                        </div>

                        {(() => {
                          const stepType = getStepType(cur, prev, isGraphMode, isMatrixMode, isLinkedListMode, isStackMode, isQueueMode);
                          return (
                            <>
                              <VisualizerHUD stepIdx={stepIdx} steps={steps} currentType={stepType} />
                              <OperationVisualizer stepIdx={stepIdx} steps={steps} currentType={stepType} analysis={analysis} />
                            </>
                          );
                        })()}

                        {(() => {
                          const visualizers = [];
                          const containerStyle = {
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 16,
                            width: "100%",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                          };
                          const labelStyle = {
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            marginBottom: 10,
                            borderBottom: "1px solid #e2e8f0",
                            paddingBottom: 6
                          };

                          const isPureArray = !isGraphMode && !isMatrixMode && !isLinkedListMode && !isStackMode && !isQueueMode;
                          const isStepArrayExplicit = cur && cur.arr !== undefined && cur.arr !== null;

                          if (isGraphMode) {
                            visualizers.push(
                              <div key="graph" style={containerStyle}>
                                <div style={{ ...labelStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <span>Graph Canvas</span>
                                  <button
                                    onClick={() => setGraphEditMode(!graphEditMode)}
                                    style={{
                                      padding: "2px 6px",
                                      fontSize: 8.5,
                                      fontWeight: 700,
                                      background: graphEditMode ? "#eff6ff" : "white",
                                      color: graphEditMode ? "#3b82f6" : "#64748b",
                                      border: `1px solid ${graphEditMode ? "#3b82f6" : "#cbd5e1"}`,
                                      borderRadius: 4,
                                      cursor: "pointer",
                                      transition: "all 0.15s"
                                    }}
                                  >
                                    🛠️ {graphEditMode ? "Editing: ON" : "Edit Graph Sandbox"}
                                  </button>
                                </div>
                                <GraphViz
                                  nodeStates={activeNodeStates}
                                  nodeVals={activeNodeVals}
                                  edgeStates={activeEdgeStates}
                                  graphLayout={analysis.graphLayout}
                                  graphEditMode={graphEditMode}
                                  setCustomInput={setCustomInput}
                                />
                                {graphEditMode && (
                                  <div style={{ fontSize: 9, color: "#2563eb", background: "#eff6ff", padding: "6px 10px", borderRadius: 6, marginTop: 8, border: "1px dashed #bfdbfe", lineHeight: 1.3 }}>
                                    💡 Click empty space to add a node. Click a node, then click another node to draw a connecting edge. Drag nodes to reposition.
                                  </div>
                                )}
                              </div>
                            );
                          }

                          if (isMatrixMode && activeMatrix) {
                            visualizers.push(
                              <div key="matrix" style={containerStyle}>
                                <div style={labelStyle}>Matrix State</div>
                                <MatrixViz matrix={activeMatrix} step={cur} onEdit={(rIdx, cIdx, newVal, currentMatrix) => {
                                  const updated = currentMatrix.map((row, r) =>
                                    row.map((val, c) => {
                                      if (r === rIdx && c === cIdx) {
                                        return isNaN(newVal) || String(newVal).trim() === "" ? newVal : (String(newVal).includes(".") ? parseFloat(newVal) : parseInt(newVal, 10));
                                      }
                                      return val;
                                    })
                                  );
                                  setCustomInput(`Matrix: [${updated.map(row => `[${row.join(",")}]`).join(",")}]`);
                                }} />
                              </div>
                            );
                          }

                          if (isLinkedListMode && activeLinkedList) {
                            visualizers.push(
                              <div key="linkedlist" style={containerStyle}>
                                <div style={labelStyle}>Linked List Canvas</div>
                                <LinkedListViz list={activeLinkedList} step={cur} category={analysis?.category} onEdit={(idx, newVal, currentList) => {
                                  const updated = currentList.map((node, i) => i === idx ? { ...node, val: isNaN(newVal) || String(newVal).trim() === "" ? newVal : (String(newVal).includes(".") ? parseFloat(newVal) : parseInt(newVal, 10)) } : node);
                                  setCustomInput(`LinkedList: [${updated.map(n => typeof n.val === 'string' ? `"${n.val}"` : n.val).join(", ")}]`);
                                }} />
                              </div>
                            );
                          }

                          if (isStackMode && activeStack) {
                            visualizers.push(
                              <div key="stack" style={containerStyle}>
                                <div style={labelStyle}>Stack Beaker</div>
                                <StackViz stack={activeStack} step={cur} onEdit={(idx, newVal, currentStack) => {
                                  const updated = currentStack.map((item, i) => i === idx ? { ...item, val: isNaN(newVal) || String(newVal).trim() === "" ? newVal : (String(newVal).includes(".") ? parseFloat(newVal) : parseInt(newVal, 10)) } : item);
                                  setCustomInput(`Stack: [${updated.map(item => typeof item.val === 'string' ? `"${item.val}"` : item.val).join(", ")}]`);
                                }} />
                              </div>
                            );
                          }

                          if (isQueueMode && activeQueue) {
                            visualizers.push(
                              <div key="queue" style={containerStyle}>
                                <div style={labelStyle}>Queue Pipeline</div>
                                <QueueViz queue={activeQueue} step={cur} onEdit={(idx, newVal, currentQueue) => {
                                  const updated = currentQueue.map((item, i) => i === idx ? { ...item, val: isNaN(newVal) || String(newVal).trim() === "" ? newVal : (String(newVal).includes(".") ? parseFloat(newVal) : parseInt(newVal, 10)) } : item);
                                  setCustomInput(`Queue: [${updated.map(item => typeof item.val === 'string' ? `"${item.val}"` : item.val).join(", ")}]`);
                                }} />
                              </div>
                            );
                          }

                          if (activeArr && (isPureArray || (isArrayMode && isStepArrayExplicit))) {
                            const values = Array.isArray(activeArr)
                              ? activeArr
                              : (typeof activeArr === "string" ? activeArr.split("") : []);
                            const isNumeric = values.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(v) && !isNaN(parseFloat(v))));

                            visualizers.push(
                              <div key="array" style={containerStyle}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", ...labelStyle, borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
                                  <span>Array State</span>
                                  {isNumeric && (
                                    <div style={{ display: "flex", background: "#f1f5f9", padding: 2, borderRadius: 6 }}>
                                      <button onClick={() => setVizMode("cells")} style={{ padding: "2px 6px", fontSize: 8, fontWeight: 700, border: "none", borderRadius: 4, background: vizMode === "cells" ? "white" : "transparent", color: vizMode === "cells" ? "#1e293b" : "#64748b", cursor: "pointer", boxShadow: vizMode === "cells" ? "0 1px 2px rgba(0,0,0,0.05)" : "none", transition: "all 0.15s" }}>Cells</button>
                                      <button onClick={() => setVizMode("bars")} style={{ padding: "2px 6px", fontSize: 8, fontWeight: 700, border: "none", borderRadius: 4, background: vizMode === "bars" ? "white" : "transparent", color: vizMode === "bars" ? "#1e293b" : "#64748b", cursor: "pointer", boxShadow: vizMode === "bars" ? "0 1px 2px rgba(0,0,0,0.05)" : "none", transition: "all 0.15s" }}>Bars</button>
                                    </div>
                                  )}
                                </div>
                                <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: 10, marginTop: 4 }} />
                                {vizMode === "bars" && isNumeric ? (
                                  <BarViz arr={activeArr} step={cur} />
                                ) : (
                                  <ArrayViz arr={activeArr} step={cur} onEdit={(idx, newVal, currentArr) => {
                                    const updated = [...currentArr];
                                    updated[idx] = isNaN(newVal) || newVal.trim() === "" ? newVal : (newVal.includes(".") ? parseFloat(newVal) : parseInt(newVal, 10));
                                    setCustomInput(`Array: [${updated.map(v => typeof v === 'string' ? `"${v}"` : v).join(", ")}]`);
                                  }} />
                                )}
                              </div>
                            );
                          }

                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                              {visualizers}
                            </div>
                          );
                        })()}
                        <Legend category={analysis?.category} />
                        <RecursionStackPanel callStack={cur?.callStack} />
                        {cur?.pointers && Object.keys(cur.pointers).length > 0 && activeArr && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                            {Object.entries(cur.pointers).map(([idx, lbl]) => (
                              <div key={lbl} style={{ background: "#f8fafc", borderRadius: 7, padding: "7px 10px" }}>
                                <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase" }}>{lbl}</div>
                                <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "monospace" }}>idx={idx}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ marginTop: 12, background: "#e8f0fe", border: "1px solid #c2e7ff", borderRadius: 12, padding: "12px 14px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#1a73e8", marginBottom: 4, textTransform: "uppercase" }}>What is happening</div>
                          <p style={{ margin: 0, fontSize: 12, color: "#1f1f1f", lineHeight: 1.6 }}>{cur?.msg || "--"}</p>
                        </div>

                        {quizActive && quizQuestion && (() => {
                          const totalQ = (analysis?.quiz && Array.isArray(analysis.quiz) && analysis.quiz.length > 0)
                            ? analysis.quiz.length
                            : 3;
                          return (
                            <div style={{
                              marginTop: 16,
                              background: "white",
                              border: "1px solid #cbd5e1",
                              borderRadius: 12,
                              padding: "16px",
                              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.05)",
                              position: "relative"
                            }}>
                              {!quizFinished ? (
                                <div>
                                  {/* Header */}
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
                                      🎓 CONCEPTUAL QUIZ
                                    </span>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", background: "#eff6ff", padding: "2px 8px", borderRadius: 12 }}>
                                      Question {quizQuestionIdx + 1} of {totalQ}
                                    </span>
                                  </div>

                                  {/* Question */}
                                  <p style={{ margin: "0 0 14px 0", fontSize: 12.5, fontWeight: 700, color: "#1e293b", lineHeight: 1.5 }}>
                                    {quizQuestion.question}
                                  </p>

                                  {/* Options */}
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                                    {quizQuestion.options.map((opt, oIdx) => {
                                      const isSelected = quizSelected === opt;
                                      const isCorrectAnswer = String(opt).trim() === String(quizQuestion.correct).trim();
                                      const hasAnswered = quizExplanationShown;

                                      let btnBg = "white";
                                      let btnBorder = "1px solid #cbd5e1";
                                      let btnColor = "#1e293b";
                                      let icon = "";

                                      if (hasAnswered) {
                                        if (isCorrectAnswer) {
                                          btnBg = "#f0fdf4";
                                          btnBorder = "1.5px solid #10b981";
                                          btnColor = "#15803d";
                                          icon = "✅ ";
                                        } else if (isSelected) {
                                          btnBg = "#fef2f2";
                                          btnBorder = "1.5px solid #ef4444";
                                          btnColor = "#b91c1c";
                                          icon = "❌ ";
                                        } else {
                                          btnBg = "#f8fafc";
                                          btnBorder = "1px solid #e2e8f0";
                                          btnColor = "#64748b";
                                        }
                                      }

                                      return (
                                        <button
                                          key={oIdx}
                                          onClick={() => handleAnswerClick(opt)}
                                          disabled={hasAnswered}
                                          style={{
                                            padding: "10px 14px",
                                            borderRadius: 8,
                                            border: btnBorder,
                                            background: btnBg,
                                            color: btnColor,
                                            fontSize: 12,
                                            fontWeight: hasAnswered && (isCorrectAnswer || isSelected) ? 700 : 500,
                                            textAlign: "left",
                                            cursor: hasAnswered ? "default" : "pointer",
                                            transition: "all 0.15s",
                                            outline: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            opacity: hasAnswered && !isCorrectAnswer && !isSelected ? 0.6 : 1
                                          }}
                                        >
                                          <span>{icon}</span>
                                          <span>{String(opt)}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Explanation and Next Button */}
                                  {quizExplanationShown && (
                                    <div style={{
                                      marginTop: 14,
                                      padding: "12px 14px",
                                      background: quizFeedback === "correct" ? "#f0fdf4" : "#fff7ed",
                                      borderLeft: `4px solid ${quizFeedback === "correct" ? "#10b981" : "#f59e0b"}`,
                                      borderRadius: 8,
                                      transition: "all 0.3s"
                                    }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: quizFeedback === "correct" ? "#15803d" : "#c2410c", marginBottom: 4 }}>
                                        {quizFeedback === "correct" ? "🎉 Correct! Great job." : "💡 Learning Insight"}
                                      </div>
                                      <p style={{ margin: "0 0 12px 0", fontSize: 11.5, color: "#374151", lineHeight: 1.5 }}>
                                        {quizQuestion.explanation}
                                      </p>
                                      <button
                                        onClick={handleNextQuizQuestion}
                                        style={{
                                          background: "#0f172a",
                                          color: "white",
                                          border: "none",
                                          borderRadius: 6,
                                          padding: "8px 16px",
                                          fontSize: 11,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 4
                                        }}
                                      >
                                        {quizQuestionIdx < totalQ - 1 ? "Next Question ➡️" : "Finish & View Score 🏆"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* Summary Screen */
                                <div style={{ textAlign: "center", padding: "10px 0" }}>
                                  <div style={{ fontSize: 24, marginBottom: 8 }}>🏆</div>
                                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Quiz Completed!</h3>

                                  {/* Score Badge */}
                                  <div style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    background: "#f8fafc",
                                    border: "2px solid #e2e8f0",
                                    borderRadius: "50%",
                                    width: 80,
                                    height: 80,
                                    justifyContent: "center",
                                    margin: "10px 0"
                                  }}>
                                    <span style={{ fontSize: 22, fontWeight: 800, color: quizScore === totalQ ? "#10b981" : "#3b82f6" }}>
                                      {quizScore}
                                    </span>
                                    <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, borderTop: "1px solid #e2e8f0", width: "60%", paddingTop: 2 }}>
                                      / {totalQ}
                                    </span>
                                  </div>

                                  {/* Dynamic Advice */}
                                  <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, margin: "10px 0 16px 0", maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
                                    {quizScore === totalQ
                                      ? "Excellent! You have a solid grasp of this algorithm's logic, complexity, and invariants."
                                      : quizScore >= 1
                                        ? "Good job! Check the visualizations and explanations to master the edge cases."
                                        : "Keep trying! Step through the visualization nodes/arrays to build your DSA mindset."
                                    }
                                  </p>

                                  {/* Breakdown Indicator Circles */}
                                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                                    {quizAnswerResults.map((res, rIdx) => (
                                      <div
                                        key={rIdx}
                                        title={`Question ${rIdx + 1}: ${res ? "Correct" : "Incorrect"}`}
                                        style={{
                                          width: 12,
                                          height: 12,
                                          borderRadius: "50%",
                                          background: res ? "#10b981" : "#ef4444",
                                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                                        }}
                                      />
                                    ))}
                                  </div>

                                  {/* Buttons */}
                                  <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                                    <button
                                      onClick={resetQuiz}
                                      style={{
                                        padding: "8px 16px",
                                        borderRadius: 8,
                                        border: "1px solid #cbd5e1",
                                        background: "white",
                                        color: "#334155",
                                        cursor: "pointer",
                                        fontSize: 11.5,
                                        fontWeight: 700
                                      }}
                                    >
                                      Restart Quiz 🔄
                                    </button>
                                    <button
                                      onClick={toggleQuizMode}
                                      style={{
                                        padding: "8px 16px",
                                        borderRadius: 8,
                                        border: "none",
                                        background: "#ef4444",
                                        color: "white",
                                        cursor: "pointer",
                                        fontSize: 11.5,
                                        fontWeight: 700
                                      }}
                                    >
                                      Exit Quiz 🚪
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#70757a", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Code (active line)</div>
                        <CodePanel lines={analysis.codeLines} activeLine={cur?.activeLine ?? -1} />
                      </div>
                    </div>
                    <div style={{ padding: "12px 20px", borderTop: "1px solid #dadce0", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "#f8f9fa" }}>
                      <button onClick={handlePlay} style={{ ...B, background: playing ? "#fce8e6" : "#e6f4ea", color: playing ? "#c5221f" : "#137333", border: `1px solid ${playing ? "#fca5a5" : "#c4eed0"}`, minWidth: 84 }}>{playing ? "Pause" : "Play"}</button>
                      <button
                        onClick={toggleQuizMode}
                        style={{
                          ...B,
                          background: quizActive ? "#f5f3ff" : "white",
                          color: quizActive ? "#7c3aed" : "#475569",
                          border: `1px solid ${quizActive ? "#c084fc" : "#cbd5e1"}`
                        }}
                      >
                        🎓 {quizActive ? "Quiz: ON" : "Quiz Mode"}
                      </button>
                      <button
                        onClick={() => {
                          setPlaying(false);
                          clearTimeout(timerRef.current);
                          setStepIdx(p => {
                            for (let i = p + 1; i < steps.length; i++) {
                              if (steps[i]?.isVisualStep !== false || i === steps.length - 1) return i;
                            }
                            return p;
                          });
                        }}
                        disabled={stepIdx >= steps.length - 1}
                        style={B}
                      >
                        Step +
                      </button>
                      <button
                        onClick={() => {
                          setPlaying(false);
                          clearTimeout(timerRef.current);
                          setStepIdx(p => {
                            for (let i = p - 1; i >= 0; i--) {
                              if (steps[i]?.isVisualStep !== false || i === 0) return i;
                            }
                            return p;
                          });
                        }}
                        disabled={stepIdx === 0}
                        style={B}
                      >
                        Step -
                      </button>
                      <button
                        onClick={() => {
                          setPlaying(false);
                          clearTimeout(timerRef.current);
                          const firstIdx = steps.findIndex(s => s?.isVisualStep !== false);
                          setStepIdx(firstIdx !== -1 ? firstIdx : 0);
                        }}
                        style={B}
                      >
                        Reset
                      </button>
                      <div style={{ flex: 1, height: 4, background: "#dadce0", borderRadius: 100, overflow: "hidden", minWidth: 60 }}>
                        <div style={{ height: "100%", background: "#1a73e8", width: `${steps.length ? ((stepIdx + 1) / steps.length) * 100 : 0}%`, transition: "width 0.3s", borderRadius: 100 }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#70757a" }}>Speed</span>
                        <input type="range" min="1" max="5" step="1" value={speed} onChange={e => setSpeed(+e.target.value)} style={{ width: 60 }} />
                        <span style={{ fontSize: 11, color: "#3c4043", minWidth: 52 }}>{SLABELS[speed - 1]}</span>
                      </div>
                    </div>
                  </div>
                )}

                {analysis.codeLines?.length > 0 && (
                  <div style={card}>
                    <div style={ch}><span style={lbl}>Line-by-line Trace Logic</span></div>
                    {analysis.codeLines.map((item, i) => (
                      <div key={i} className="trace-line-item" style={{ borderBottom: i < analysis.codeLines.length - 1 ? "1px solid #f8fafc" : "none" }}>
                        <div className="trace-line-left">
                          <span style={{ width: 20, height: 20, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{i + 1}</span>
                          <code style={{ fontSize: 11, color: "#1e293b", background: "#f8fafc", padding: "2px 7px", borderRadius: 4, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", maxWidth: 240 }}>{item.line}</code>
                        </div>
                        <span className="trace-line-explain">{item.explain}</span>
                      </div>
                    ))}
                  </div>
                )}

                <DryRunSheet analysis={analysis} stepIdx={stepIdx} onRowClick={setStepIdx} />
              </>
            )}
          </>
        )}

        {phase === "idle" && !analysis && (
          <div style={{ textAlign: "center", padding: "44px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 36, marginBottom: 12, fontFamily: "monospace" }}>{"</>"}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Paste any DSA code above</div>
            <div style={{ fontSize: 12 }}>Try one of the demo buttons, or paste your own algorithm. Groq will check for bugs, explain it, and animate it step by step.</div>
          </div>
        )}

      </div>
    </div>
  );
}