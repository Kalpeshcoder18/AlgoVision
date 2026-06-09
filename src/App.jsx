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
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "explanation": "2-3 sentences",
  "howItWorks": ["step 1", "step 2"],
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

Simulate every step carefully on the requested input array, string, graph, or matrix. Keep messages simple and clear.
If invalid/not DSA: isValid=false, steps=[].
If bugs: isCorrect=false, list bugs, correctedCode, simulate corrected version.`;

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

function ArrayViz({ step }) {
  if (!step?.arr) return null;
  const arrayData = Array.isArray(step.arr)
    ? step.arr
    : (typeof step.arr === "string" ? step.arr.split("") : []);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-end", minHeight: 84, padding: "6px 0" }}>
      {arrayData.map((val, idx) => {
        const s = COLORS[cellState(idx, step)] || COLORS.idle;
        const ptr = step.pointers?.[idx] || step.pointers?.[String(idx)];
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: ptr ? "#3b82f6" : "transparent", fontFamily: "monospace", minHeight: 12 }}>{ptr || "."}</span>
            <div style={{ width: 42, height: 42, borderRadius: 9, border: `2px solid ${s.border}`, background: s.bg, color: s.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, fontFamily: "monospace", transition: "all 0.3s" }}>{val}</div>
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

function GraphViz({ step, graphLayout }) {
  if (!graphLayout) return null;
  const { nodes = [], edges = [], directed = false } = graphLayout;
  const nodeStates = step?.nodeStates || {};
  const nodeVals = step?.nodeVals || {};
  const edgeStates = step?.edgeStates || {};

  const combinedNodes = nodes.map(n => ({
    ...n,
    state: nodeStates[n.id] || "idle",
    val: nodeVals[n.id] || ""
  }));

  // Build the edge list, including any edge from edgeStates that might not be declared in the static graphLayout.edges
  let allEdges = [...edges];
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

  return (
    <div style={{ background: "#ffffff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden", padding: 12 }}>
      <svg viewBox="0 0 500 300" style={{ width: "100%", height: "auto", display: "block" }}>
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

          return (
            <g key={`node-${node.id}`} transform={`translate(${x}, ${y})`} style={{ cursor: "default" }}>
              <circle
                r="18"
                fill={bgColor}
                stroke={borderColor}
                strokeWidth="2.5"
                style={{ transition: "all 0.3s", filter: state !== "idle" ? "drop-shadow(0px 2px 4px rgba(0,0,0,0.05))" : "none" }}
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

function MatrixViz({ step }) {
  if (!step?.matrix) return null;
  const matrix = step.matrix;
  const matrixState = step.matrixState || {};
  const matrixVals = step.matrixVals || {};

  return (
    <div style={{ padding: "10px 0", overflowX: "auto", width: "100%", display: "flex", justifyContent: "center" }}>
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
                        textAlign: "center"
                      }}
                      title={`Cell [${rIdx}][${cIdx}]: ${displayVal}`}
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
      <div style={{ padding: "6px 0", maxHeight: 240, overflowY: "auto" }}>
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

  function loadHistoryItem(item) {
    setCode(item.code);
    setCustomInput(item.customInput || "");
    setAnalysis(item.analysis);
    setStepIdx(0);
    setPhase("done");
    setError("");
    setPlaying(false);
    clearTimeout(timerRef.current);
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
    try {
      const userPrompt = "Analyze this code and return JSON:\n\n" + code +
        (customInput.trim() ? "\n\nSimulate the execution step-by-step using this custom input structure: " + customInput.trim() : "");

      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + DEFAULT_GROQ_API_KEY },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          temperature: 0.1,
          max_tokens: 4000,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ]
        })
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error?.message || ("Groq API error " + res.status));
      }

      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAnalysis(parsed);
      setStepIdx(0);
      setPhase("done");
      if (parsed.isValid !== false) {
        saveToHistory(parsed);
      }
    } catch (e) {
      setError(e.message || "Failed to analyze. Check your code and try again.");
      setPhase("error");
    }
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
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

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

                {!analysis.isCorrect && analysis.correctedCode && (
                  <div style={card}>
                    <div style={ch}><span style={lbl}>Corrected Code</span></div>
                    <pre style={{ margin: 0, padding: "14px 16px", fontFamily: "monospace", fontSize: 12, color: "#1e293b", lineHeight: 1.7, overflowX: "auto", background: "#fafafa" }}>{analysis.correctedCode}</pre>
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                      <div style={{ padding: 16, borderRight: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase" }}>
                            {analysis?.graphLayout ? "Graph Canvas" : cur?.matrix ? "Matrix State" : "Array state"}
                          </span>
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
                            <GraphViz step={cur} graphLayout={analysis.graphLayout} />
                          ) : cur?.matrix ? (
                            <MatrixViz step={cur} />
                          ) : (vizMode === "bars" && isNumeric) ? (
                            <BarViz step={cur} />
                          ) : (
                            <ArrayViz step={cur} />
                          );
                        })()}

                        <Legend category={analysis?.category} />
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
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#70757a", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Code (active line)</div>
                        <CodePanel lines={analysis.codeLines} activeLine={cur?.activeLine ?? -1} />
                      </div>
                    </div>
                    <div style={{ padding: "12px 20px", borderTop: "1px solid #dadce0", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "#f8f9fa" }}>
                      <button onClick={handlePlay} style={{ ...B, background: playing ? "#fce8e6" : "#e6f4ea", color: playing ? "#c5221f" : "#137333", border: `1px solid ${playing ? "#fca5a5" : "#c4eed0"}`, minWidth: 84 }}>{playing ? "Pause" : "Play"}</button>
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
                      <div key={i} style={{ display: "flex", gap: 14, padding: "9px 16px", borderBottom: i < analysis.codeLines.length - 1 ? "1px solid #f8fafc" : "none", alignItems: "flex-start" }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#94a3b8", fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                        <code style={{ fontSize: 11, color: "#1e293b", background: "#f8fafc", padding: "2px 7px", borderRadius: 4, flex: "0 0 auto", maxWidth: 240, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{item.line}</code>
                        <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{item.explain}</span>
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