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
  "codeLines": [{"line": "code", "explain": "plain english"}],
  "defaultInput": "describe input array or adjacency graph list or 2D grid simulated here",
  "graphLayout": { // Present ONLY for Graph/Tree algorithms (omit for Array/Sorting/Searching/Matrix)
    "directed": false,
    "nodes": [{"id": "A", "x": 50, "y": 20}], // coordinates x,y are horizontal/vertical percentages (10 to 90) on a 100x100 space
    "edges": [{"from": "A", "to": "B", "weight": 4}] // edge connections
  },
  "steps": [
    {
      "arr": [1, 2, 3], // Present ONLY for array-based/sorting/searching/string algorithms (omit for Graph/Matrix)
      "arrStates": {"0": "active/comparing/swapping/done/skipped/idle"}, // Map of array index (string key) to state
      "matrix": [[1, 2], [3, 4]], // Present ONLY for 2D Grid/Matrix algorithms representing the grid state at this step
      "matrixState": {"0-0": "active/visited/done/idle/processing/swap/secondary/eliminated"}, // Cell states mapping "row-col" keys (e.g. "0-0", "1-2") to state strings
      "matrixVals": {"0-0": "val"}, // Optional custom values/labels for grid cells mapping "row-col" keys
      "nodeStates": {"A": "active/visited/done/idle/processing"}, // Present ONLY for Graph/Tree algorithms
      "nodeVals": {"A": "dist=0"}, // Optional node values (e.g. Dijkstra distances or traversal values)
      "edgeStates": {"A-B": "highlighted/visited/idle"}, // Present ONLY for Graph/Tree algorithms (use "from-to" keys)
      "highlight": [1, 2], // line numbers (0-indexed) of codeLines corresponding to the active lines in this step
      "pointers": {"0": "i"}, // index mapping pointers for arrays/strings
      "activeLine": 0, // primary line of code executing
      "variables": {"parent": "[0, 1, 0]", "size": "[2, 1, 1]", "i": "0"}, // Variable trace mapping. In EACH step, trace the exact values of active variables/arrays/pointers just like a student does on paper.
      "callStack": ["dfs(node='A')", "dfs(node='B')"], // Optional array representing the active function call stack at this step. Put the current call at the top of the stack (index 0).
      "msg": "beginner friendly message explaining this step"
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

For matrix or grid algorithms:
1. "matrix" represents the 2D array grid at this step.
2. In each step, specify cell states in "matrixState" and cell labels/values in "matrixVals" to highlight traversal path, comparisons, or cell values.

For ALL categories (Array, Matrix, Graph, String):
- In the "variables" field of each step, you MUST trace the values of all active variables (e.g., loop variables like 'i', pointers like 'left'/'right', state arrays like 'parent' or 'size', or running sums).
- Format array/matrix states inside "variables" as strings, e.g. "parent": "[0, 0, 1, 3]". This creates a dedicated column for each variable in the dry run trace table!
- For recursive algorithms (e.g., DFS, backtracking, tree traversal, recursion), you MUST include a "callStack" array in each step, representing active stack frames from top (current frame, index 0) to bottom (initial call, last index), showing arguments and local scopes.

Simulate every step carefully on the requested input array, string, graph, or matrix. Keep messages simple and clear.
CRITICAL: You MUST generate a DETAILED, GRANULAR step-by-step trace with at least 10-15 steps (more for complex algorithms). Each individual loop iteration, each comparison, each swap, each recursive call, and each variable update should be its own separate step. Do NOT summarize or skip iterations. For example, for Bubble Sort on [5,3,1,4,2], generate one step per comparison (not one step per pass). For Binary Search, generate one step per mid-point check. Students need to see EVERY single operation to understand the algorithm. The "msg" field in each step should explain what is happening in plain beginner-friendly English (e.g., "Comparing arr[0]=5 with arr[1]=3. Since 5 > 3, we swap them."). Each step must update the visualization state (arrStates, matrixState, nodeStates, etc.) to reflect exactly what changed.
If the pasted code is a class constructor or query-based class implementation (e.g. NumMatrix, SegmentTree, Trie, UnionFind) that does not have a main driver or is missing trailing braces (incomplete brackets/braces), do NOT flag it as invalid. Instead, set "isValid": true, specify "isCorrect": false, list the compilation/structural bugs (e.g., "missing closing braces", "no query function"), and generate a complete, corrected version in "correctedCode". Simulate a complete dry-run trace sequence of building the structure step-by-step in the "steps" array (representing row-by-row matrix initialization, tree node insertion, or parent array union actions) so the student can visualize it.
If invalid/not DSA: isValid=false, steps=[].
If bugs: isCorrect=false, list bugs, correctedCode, simulate corrected version.
In "transpiledSolutions", provide clean, working, equivalent implementations of the algorithm in C++ ("cpp"), Python ("python"), Java ("java"), and JavaScript ("javascript"). Transpile the original code if it is correct, or the corrected code if it has bugs.
Formatting of code fields in JSON: In "correctedCode" and all fields under "transpiledSolutions" ("cpp", "python", "java", "javascript"), you MUST format the code with clean, standard spacing, indentation, and newlines ("\n" characters). Do NOT compress the code into a single line or use semicolons to squash blocks of code.
In "quiz", generate exactly 3 thought-provoking, conceptual multiple-choice questions to test the student's high-level algorithmic mindset (e.g., potential bugs, edge cases, loop invariants, or complexity reasoning). Each question must have exactly 4 choices, a correct answer that matches one of the choices exactly, and a helpful explanation.`;

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
  }
};

const COLORS = {
  active: { bg: "#e8f0fe", border: "#1a73e8", text: "#1a73e8" },
  comparing: { bg: "#fef7e0", border: "#f9ab00", text: "#b06000" },
  secondary: { bg: "#fef7e0", border: "#f9ab00", text: "#b06000" },
  processing: { bg: "#fef7e0", border: "#f9ab00", text: "#b06000" },
  done: { bg: "#e6f4ea", border: "#1e8e3e", text: "#137333" },
  visited: { bg: "#e6f4ea", border: "#1e8e3e", text: "#137333" },
  swapping: { bg: "#f3e8ff", border: "#a855f7", text: "#6b21a8" },
  swap: { bg: "#f3e8ff", border: "#a855f7", text: "#6b21a8" },
  completed: { bg: "#f3e8ff", border: "#a855f7", text: "#6b21a8" },
  skipped: { bg: "#f1f3f4", border: "#dadce0", text: "#70757a" },
  eliminated: { bg: "#f1f3f4", border: "#dadce0", text: "#70757a" },
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

function ArrayViz({ step, onEdit }) {
  if (!step?.arr) return null;
  const arrayData = Array.isArray(step.arr)
    ? step.arr
    : (typeof step.arr === "string" ? step.arr.split("") : []);

  const handleCellClick = (idx, val) => {
    if (!onEdit) return;
    const newVal = prompt(`Edit cell at index [${idx}]:`, val);
    if (newVal !== null) {
      onEdit(idx, newVal, arrayData);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-end", minHeight: 84, padding: "6px 0" }}>
      {arrayData.map((val, idx) => {
        const s = COLORS[cellState(idx, step)] || COLORS.idle;
        const ptr = step.pointers?.[idx] || step.pointers?.[String(idx)];
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: ptr ? "#3b82f6" : "transparent", fontFamily: "monospace", minHeight: 12 }}>{ptr || "."}</span>
            <div
              onClick={() => handleCellClick(idx, val)}
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

function BarViz({ step }) {
  if (!step?.arr) return null;
  const values = Array.isArray(step.arr)
    ? step.arr
    : (typeof step.arr === "string" ? step.arr.split("") : []);
  const numericValues = values.map(v => typeof v === 'number' ? v : (typeof v === 'string' && !isNaN(v) && !isNaN(parseFloat(v)) ? parseFloat(v) : 1));
  const maxVal = Math.max(...numericValues, 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, height: 140, padding: "10px 0", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
      {values.map((val, idx) => {
        const numVal = typeof val === 'number' ? val : (typeof val === 'string' && !isNaN(val) && !isNaN(parseFloat(val)) ? parseFloat(val) : 1);
        const percent = Math.max(10, (numVal / maxVal) * 100);
        const state = cellState(idx, step);
        const s = COLORS[state] || COLORS.idle;

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

function GraphViz({ step, graphLayout, graphEditMode, setCustomInput }) {
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
  const nodeStates = step?.nodeStates || {};
  const nodeVals = step?.nodeVals || {};
  const edgeStates = step?.edgeStates || {};

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

function MatrixViz({ step, onEdit }) {
  if (!step?.matrix) return null;
  const matrix = step.matrix;

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

function DryRunSheet({ analysis }) {
  if (!analysis || !analysis.steps || analysis.steps.length === 0) return null;

  const handlePrint = () => {
    window.print();
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
  const useFallback = varColumns.length === 0 && !hasArray && !hasMatrix;

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
        <button
          onClick={handlePrint}
          className="no-print"
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

                {/* Render dynamic columns for Array / Matrix */}
                {hasArray && (
                  <th style={{ padding: "10px 8px", textAlign: "left", minWidth: 120, color: "#475569", fontWeight: 700 }}>Array</th>
                )}
                {hasMatrix && (
                  <th style={{ padding: "10px 8px", textAlign: "left", minWidth: 120, color: "#475569", fontWeight: 700 }}>Matrix</th>
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

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", verticalAlign: "top" }}>
                    {/* Step # */}
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "#64748b", fontFamily: "monospace" }}>
                      #{idx + 1}
                    </td>

                    {/* Line Executed */}
                    <td style={{ padding: "12px 8px", fontFamily: "monospace", color: "#0f172a", background: "#fafafa" }}>
                      {codeLineText ? (
                        <div>
                          <div style={{ fontSize: 8.5, color: "#94a3b8", marginBottom: 2 }}>Line {step.activeLine + 1}:</div>
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
                        <td key={colName} style={{ padding: "12px 8px", textAlign: "center", fontFamily: "monospace", color: "#2563eb", fontWeight: 600 }}>
                          {value}
                        </td>
                      );
                    })}

                    {/* Array visual column */}
                    {hasArray && (
                      <td style={{ padding: "12px 8px", fontFamily: "monospace", color: "#0f172a" }}>
                        {step.arr ? (
                          `[${(Array.isArray(step.arr) ? step.arr : step.arr.split("")).join(", ")}]`
                        ) : (
                          <span style={{ color: "#94a3b8" }}>-</span>
                        )}
                      </td>
                    )}

                    {/* Matrix visual column */}
                    {hasMatrix && (
                      <td style={{ padding: "12px 8px", fontFamily: "monospace", color: "#0f172a" }}>
                        {step.matrix ? (
                          step.matrix.map(row => `[${row.join(",")}]`).join(", ")
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
                    <td style={{ padding: "12px 8px", color: "#334155", lineHeight: 1.45 }}>
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
  const ref = useRef(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [activeLine]);
  return (
    <div style={{ background: "#0d1117", borderRadius: 10, overflow: "hidden", fontSize: 12, fontFamily: "monospace" }}>
      <div style={{ padding: "7px 12px", background: "#161b22", borderBottom: "1px solid #30363d", display: "flex", gap: 5 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
        <span style={{ marginLeft: 8, fontSize: 10, color: "#8b949e" }}>algorithm</span>
      </div>
      <div style={{ padding: "6px 0", maxHeight: 240, overflow: "auto" }}>
        {(lines || []).map((item, i) => (
          <div key={i} ref={i === activeLine ? ref : null} style={{ padding: "3px 12px", background: i === activeLine ? "rgba(59,130,246,0.18)" : "transparent", borderLeft: `3px solid ${i === activeLine ? "#3b82f6" : "transparent"}`, display: "flex", gap: 10, alignItems: "center", transition: "all 0.2s" }}>
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

function ComplexityDashboard({ analysis }) {
  if (!analysis) return null;

  const [hoverN, setHoverN] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

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

  return (
    <div style={{
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)",
      overflow: "hidden",
      marginBottom: 20
    }}>
      <div style={{
        padding: "10px 16px",
        background: "#fafafa",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, textTransform: "uppercase" }}>
          📊 Complexity Analysis & Online Judge Guide
        </span>
      </div>

      <div className="live-viz-grid">
        {/* Left Column: Big-O Growth Chart */}
        <div className="live-viz-left-col">
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>Big-O Growth Chart</div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>💡 Hover on the chart to compare operations at input size N!</div>
          <div 
            style={{ position: "relative", cursor: "crosshair" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <svg viewBox="0 0 200 120" style={{ width: "100%", height: "auto", background: "#f8fafc", borderRadius: 8, padding: 8 }}>
              {/* Grid Lines */}
              <line x1="20" y1="95" x2="180" y2="95" stroke="#cbd5e1" strokeWidth="0.8" />
              <line x1="20" y1="77" x2="180" y2="77" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="20" y1="50" x2="180" y2="50" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="20" y1="23" x2="180" y2="23" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="20" y1="10" x2="180" y2="10" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
              
              <line x1="60" y1="10" x2="60" y2="95" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="100" y1="10" x2="100" y2="95" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="140" y1="10" x2="140" y2="95" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="180" y1="10" x2="180" y2="95" stroke="#cbd5e1" strokeWidth="0.8" />

              <line x1="20" y1="10" x2="20" y2="95" stroke="#cbd5e1" strokeWidth="1" />
              <text x="15" y="95" fontSize="7" fill="#64748b" textAnchor="end" dominantBaseline="middle">0</text>
              <text x="15" y="10" fontSize="7" fill="#64748b" textAnchor="end" dominantBaseline="middle">Time</text>
              <text x="180" y="103" fontSize="7" fill="#64748b" textAnchor="middle">N (Input)</text>

              {/* Chart Curves */}
              {complexities.map(c => {
                const isActive = activeComplexity === c.key;
                return (
                  <g key={c.key}>
                    <path
                      d={c.d}
                      fill="none"
                      stroke={c.color}
                      strokeWidth={isActive ? 3 : 1.2}
                      strokeDasharray={isActive ? "none" : "3,3"}
                      style={{ transition: "all 0.3s" }}
                    />
                    {isActive && !hoverN && (
                      <g>
                        <circle cx={150} cy={getYVal(c.key, 80)} r="4" fill={c.color} />
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

              {/* Hover Line and Intersection Dots */}
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
                        {isActive && (
                          <circle
                            cx={xSvg}
                            cy={yVal}
                            r={7}
                            fill="none"
                            stroke={c.color}
                            strokeWidth={1}
                            opacity={0.6}
                            style={{
                              transformOrigin: `${xSvg}px ${yVal}px`,
                              animation: "pulseGlow 1.5s infinite ease-in-out"
                            }}
                          />
                        )}
                      </g>
                    );
                  })}
                </>
              )}
            </svg>

            {/* Hover Tooltip Card */}
            {hoverN && (
              <div style={{
                position: "absolute",
                top: Math.max(5, hoverPos.y - 120),
                left: Math.min(hoverPos.x + 12, 270),
                background: "rgba(15, 23, 42, 0.92)",
                backdropFilter: "blur(6px)",
                color: "white",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 10,
                fontFamily: "var(--font-code)",
                pointerEvents: "none",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
                zIndex: 10,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                width: 190
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 5, marginBottom: 6, fontWeight: "bold" }}>
                  <span style={{ color: "#94a3b8" }}>Input Size N:</span>
                  <span style={{ color: "#38bdf8" }}>{hoverN}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {complexities.map(c => {
                    const isActive = activeComplexity === c.key;
                    const ops = getHoverVal(c.key, hoverN);
                    return (
                      <div key={c.key} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        color: isActive ? "#38bdf8" : "#e2e8f0", 
                        fontWeight: isActive ? "700" : "400"
                      }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} />
                          {c.label.split(" - ")[0]}
                        </span>
                        <span style={{ fontFamily: "monospace" }}>
                          {ops} {isActive ? "⚡" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {complexities.map(c => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, background: c.color, borderRadius: 2 }} />
                <span style={{ fontSize: 9, color: activeComplexity === c.key ? "#0f172a" : "#64748b", fontWeight: activeComplexity === c.key ? 700 : 400 }}>
                  {c.label.split(" - ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Online Judge Input Limits Guider & Runtime Table */}
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Online Judge Constraint Guider</div>
          <p style={{ fontSize: 10, color: "#64748b", lineHeight: 1.4, marginBottom: 8 }}>
            💡 Competitive programming judges (LeetCode, Codeforces) typically execute ~<strong>$10^8$ operations per second</strong>. Match your constraints to choose the correct Big-O limit:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "4px 12px", fontSize: 9.5, borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
            <div style={{ fontWeight: 700, color: "#475569" }}>Input Size N</div>
            <div style={{ fontWeight: 700, color: "#475569" }}>Required Complexity</div>

            <div style={{ color: "#ef4444", fontWeight: 600 }}>N ≤ 10</div>
            <div style={{ color: "#1e293b" }}>O(N!) or O(2^N) - Backtracking</div>

            <div style={{ color: "#f59e0b", fontWeight: 600 }}>N ≤ 20</div>
            <div style={{ color: "#1e293b" }}>O(2^N) - Subset DFS / Bitmask DP</div>

            <div style={{ color: "#06b6d4", fontWeight: 600 }}>N ≤ 500</div>
            <div style={{ color: "#1e293b" }}>O(N³) - Floyd-Warshall / Loop 3D</div>

            <div style={{ color: "#3b82f6", fontWeight: 600 }}>N ≤ 5000</div>
            <div style={{ color: "#1e293b" }}>O(N²) - Loop 2D / Shell Sort</div>

            <div style={{ color: "#10b981", fontWeight: 600 }}>N ≤ 10^5</div>
            <div style={{ color: "#1e293b", fontWeight: 600 }}>O(N log N) - Sorting / Binary Search</div>

            <div style={{ color: "#059669", fontWeight: 600 }}>N ≤ 10^7</div>
            <div style={{ color: "#1e293b" }}>O(N) - Two Pointers / Slid Window</div>

            <div style={{ color: "#7c3aed", fontWeight: 600 }}>N ≥ 10^8</div>
            <div style={{ color: "#1e293b" }}>O(log N) or O(1) - Binary Search / Math</div>
          </div>

          {/* Runtime Table */}
          <div style={{ marginTop: 12, borderTop: "1px dashed #cbd5e1", paddingTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 6 }}>⏱️ Estimated Runtime vs Input Size (N)</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9.5, textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid #cbd5e1", color: "#64748b" }}>
                    <th style={{ padding: "4px 2px" }}>Complexity</th>
                    <th style={{ padding: "4px 2px" }}>N = 100</th>
                    <th style={{ padding: "4px 2px" }}>N = 10,000</th>
                    <th style={{ padding: "4px 2px" }}>N = 10^6</th>
                    <th style={{ padding: "4px 2px" }}>N = 10^8</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "O(1)", values: ["< 1 ms", "< 1 ms", "< 1 ms", "< 1 ms"], active: activeComplexity === "o_1", color: "#10b981" },
                    { label: "O(log N)", values: ["< 1 ms", "< 1 ms", "< 1 ms", "< 1 ms"], active: activeComplexity === "o_log", color: "#06b6d4" },
                    { label: "O(N)", values: ["< 1 ms", "< 1 ms", "1 ms", "100 ms"], active: activeComplexity === "o_n", color: "#3b82f6" },
                    { label: "O(N log N)", values: ["< 1 ms", "< 1 ms", "20 ms", "3 seconds"], active: activeComplexity === "o_nlog", color: "#f59e0b" },
                    { label: "O(N²)", values: ["< 1 ms", "100 ms", "1.6 minutes ⚠️", "3 hours 🛑 TLE"], active: activeComplexity === "o_n2", color: "#ef4444" }
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
                        <td key={vIdx} style={{ padding: "6px 2px", color: v.includes("TLE") ? "#ef4444" : (v.includes("⚠️") ? "#f59e0b" : "#334155") }}>
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
      </div>

      {/* Mindset Insight Section */}
      <div style={{ 
        borderTop: "1px solid #f1f5f9", 
        padding: "16px", 
        background: "#fafafa" 
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <span>💡</span>
          <span>Big-O Scaling Mindset: How does operations count change when input size (N) doubles?</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {[
            {
              title: "Constant O(1)",
              desc: "Instant scaling. Doubling N has NO effect. Ideal for hash lookups, direct indexing.",
              color: "#10b981",
              active: activeComplexity === "o_1"
            },
            {
              title: "Logarithmic O(log N)",
              desc: "Extremely fast. Doubling N adds only 1 extra operation! E.g. Binary Search.",
              color: "#06b6d4",
              active: activeComplexity === "o_log"
            },
            {
              title: "Linear O(N)",
              desc: "Proportional scaling. Doubling N doubles the runtime. E.g. single loops, filter, search.",
              color: "#3b82f6",
              active: activeComplexity === "o_n"
            },
            {
              title: "Linearithmic O(N log N)",
              desc: "Efficient sorting scaling. Doubling N slightly more than doubles runtime. E.g. Merge Sort, Quick Sort.",
              color: "#f59e0b",
              active: activeComplexity === "o_nlog"
            },
            {
              title: "Quadratic O(N²)",
              desc: "Dangerous scaling! Doubling N results in 4x more operations. E.g. nested loops, bubble sort.",
              color: "#ef4444",
              active: activeComplexity === "o_n2"
            }
          ].map(item => (
            <div key={item.title} style={{ 
              background: "white", 
              border: item.active ? `1.5px solid ${item.color}` : "1px solid #e2e8f0", 
              borderRadius: 8, 
              padding: "10px 12px",
              boxShadow: item.active ? `0 2px 8px ${item.color}15` : "none",
              position: "relative"
            }}>
              {item.active && (
                <span style={{ 
                  position: "absolute", 
                  top: -8, 
                  right: 8, 
                  background: item.color, 
                  color: "white", 
                  fontSize: 7.5, 
                  fontWeight: 950, 
                  padding: "1px 5px", 
                  borderRadius: 4,
                  textTransform: "uppercase" 
                }}>
                  Your Code
                </span>
              )}
              <div style={{ fontSize: 10.5, fontWeight: 700, color: item.color, marginBottom: 3 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 9.5, color: "#475569", lineHeight: 1.4 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DSAAnalyzer() {
  const [code, setCode] = useState(DEMOS.remove_dup.code);
  const [activeDemo, setActiveDemo] = useState("remove_dup");
  const [phase, setPhase] = useState("idle");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [customInput, setCustomInput] = useState("");
  const [vizMode, setVizMode] = useState("cells");
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedLangTab, setSelectedLangTab] = useState("cpp");
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
      options: shuffled.map(l => ({ lineNum: l, text: `Line ${l}: ${analysis.codeLines?.[l-1]?.line?.trim() || "..."}` })),
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
    setAnalysis(item.analysis);
    setStepIdx(0);
    setPhase("done");
    setError("");
    setPlaying(false);
    clearTimeout(timerRef.current);

    if (item.analysis) {
      const detectedLang = String(item.analysis.language || "").toLowerCase();
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

  async function analyze() {
    if (!code.trim()) return;
    if (!DEFAULT_GROQ_API_KEY) {
      setError("Groq API Key is not configured in the environment (.env file).");
      setPhase("error");
      return;
    }
    setPhase("analyzing"); setAnalysis(null); setError(""); setPlaying(false);
    clearTimeout(timerRef.current);
    
    const userPrompt = "Analyze this code and return JSON:\n\n" + code +
      (customInput.trim() ? "\n\nSimulate the execution step-by-step using this custom input structure: " + customInput.trim() : "");

    const candidates = [
      { id: "openai/gpt-oss-120b", maxTokens: 16000 },
      { id: "llama-3.3-70b-versatile", jsonMode: true, maxTokens: 16000 },
      { id: "groq/compound", jsonMode: true, maxTokens: 8192 }
    ];

    let lastError = null;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      try {
        const reqBody = {
          model: candidate.id,
          temperature: 0.1,
          max_tokens: candidate.maxTokens,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ]
        };
        if (candidate.jsonMode) {
          reqBody.response_format = { type: "json_object" };
        }

        const res = await fetch(GROQ_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + DEFAULT_GROQ_API_KEY },
          body: JSON.stringify(reqBody)
        });

        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          const msg = d?.error?.message || `Groq API error ${res.status}`;
          throw new Error(msg);
        }

        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content || "";
        const clean = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);

        setAnalysis(parsed);
        setStepIdx(0);
        setPhase("done");

        const detectedLang = String(parsed.language || "").toLowerCase();
        if (detectedLang.includes("c++") || detectedLang.includes("cpp")) setSelectedLangTab("cpp");
        else if (detectedLang.includes("python")) setSelectedLangTab("python");
        else if (detectedLang.includes("java") && !detectedLang.includes("script")) setSelectedLangTab("java");
        else if (detectedLang.includes("javascript") || detectedLang.includes("js")) setSelectedLangTab("javascript");
        
        if (parsed.isValid !== false) {
          saveToHistory(parsed);
        }
        return; // Success, exit function
      } catch (e) {
        console.warn(`Model candidate ${candidate.id} failed:`, e);
        lastError = e;
      }
    }

    // If all candidates failed
    setError(lastError?.message || "Failed to analyze. Check your code and try again.");
    setPhase("error");
  }

  const steps = analysis?.steps || [];
  const cur = steps[stepIdx] || null;

  const tick = useCallback(() => {
    setStepIdx(p => {
      if (p >= steps.length - 1) { setPlaying(false); return p; }
      return p + 1;
    });
  }, [steps.length]);

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
              [ Creator Info ]
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
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0", textTransform: "uppercase" }}>
                    Kalpesh Paliwal
                  </h3>
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

                <ComplexityDashboard analysis={analysis} />

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
                              {analysis?.graphLayout ? "Graph Canvas" : cur?.matrix ? "Matrix State" : "Array state"}
                            </span>
                            {analysis?.graphLayout && (
                              <button
                                onClick={() => setGraphEditMode(!graphEditMode)}
                                style={{
                                  padding: "3px 8px",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  background: graphEditMode ? "#eff6ff" : "white",
                                  color: graphEditMode ? "#3b82f6" : "#64748b",
                                  border: `1px solid ${graphEditMode ? "#3b82f6" : "#cbd5e1"}`,
                                  borderRadius: 6,
                                  marginLeft: 8,
                                  cursor: "pointer",
                                  transition: "all 0.15s"
                                }}
                              >
                                🛠️ {graphEditMode ? "Editing: ON" : "Edit Graph Sandbox"}
                              </button>
                            )}
                          </div>
                          {!analysis?.graphLayout && !cur?.matrix && cur?.arr && (
                            (() => {
                              const isNumeric = Array.isArray(cur.arr)
                                ? cur.arr.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(v) && !isNaN(parseFloat(v))))
                                : false;
                              return isNumeric && (
                                <div style={{ display: "flex", background: "#f1f5f9", padding: 2, borderRadius: 6 }}>
                                  <button onClick={() => setVizMode("cells")} style={{ padding: "3px 8px", fontSize: 9, fontWeight: 700, border: "none", borderRadius: 4, background: vizMode === "cells" ? "white" : "transparent", color: vizMode === "cells" ? "#1e293b" : "#64748b", cursor: "pointer", boxShadow: vizMode === "cells" ? "0 1px 2px rgba(0,0,0,0.05)" : "none", transition: "all 0.15s" }}>Cells</button>
                                  <button onClick={() => setVizMode("bars")} style={{ padding: "3px 8px", fontSize: 9, fontWeight: 700, border: "none", borderRadius: 4, background: vizMode === "bars" ? "white" : "transparent", color: vizMode === "bars" ? "#1e293b" : "#64748b", cursor: "pointer", boxShadow: vizMode === "bars" ? "0 1px 2px rgba(0,0,0,0.05)" : "none", transition: "all 0.15s" }}>Bars</button>
                                </div>
                              );
                            })()
                          )}
                        </div>
 
                        {(() => {
                          const isNumeric = cur?.arr && (
                            Array.isArray(cur.arr)
                              ? cur.arr.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(v) && !isNaN(parseFloat(v))))
                              : false
                          );
                          return analysis?.graphLayout ? (
                            <div>
                              <GraphViz 
                                step={cur} 
                                graphLayout={analysis.graphLayout} 
                                graphEditMode={graphEditMode}
                                setCustomInput={setCustomInput}
                              />
                              {graphEditMode && (
                                <div style={{ fontSize: 9.5, color: "#2563eb", background: "#eff6ff", padding: "6px 10px", borderRadius: 8, marginTop: 8, border: "1px dashed #bfdbfe", lineHeight: 1.4 }}>
                                  💡 <strong>Sandbox Mode:</strong> Click empty space to add a node. Click a node, then click another node to draw a connecting edge. Drag nodes to reposition.
                                </div>
                              )}
                            </div>
                          ) : cur?.matrix ? (
                            <MatrixViz step={cur} onEdit={(rIdx, cIdx, newVal, currentMatrix) => {
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
                          ) : (vizMode === "bars" && isNumeric) ? (
                            <BarViz step={cur} />
                          ) : (
                            <ArrayViz step={cur} onEdit={(idx, newVal, currentArr) => {
                              const updated = [...currentArr];
                              updated[idx] = isNaN(newVal) || newVal.trim() === "" ? newVal : (newVal.includes(".") ? parseFloat(newVal) : parseInt(newVal, 10));
                              setCustomInput(`Array: [${updated.map(v => typeof v === 'string' ? `"${v}"` : v).join(", ")}]`);
                            }} />
                          );
                        })()}
                        <Legend category={analysis?.category} />
                        <RecursionStackPanel callStack={cur?.callStack} />
                        {cur?.pointers && Object.keys(cur.pointers).length > 0 && !cur.graph && (
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
                      <button onClick={() => { setPlaying(false); clearTimeout(timerRef.current); if (stepIdx < steps.length - 1) setStepIdx(s => s + 1); }} disabled={stepIdx >= steps.length - 1} style={B}>Step +</button>
                      <button onClick={() => { setPlaying(false); clearTimeout(timerRef.current); if (stepIdx > 0) setStepIdx(s => s - 1); }} disabled={stepIdx === 0} style={B}>Step -</button>
                      <button onClick={() => { setPlaying(false); clearTimeout(timerRef.current); setStepIdx(0); }} style={B}>Reset</button>
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

                <DryRunSheet analysis={analysis} />
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