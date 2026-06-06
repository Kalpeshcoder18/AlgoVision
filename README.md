# AlgoVision 🚀
### AI-Powered DSA Algorithm Visualizer & Analyzer

**AlgoVision** is a premium, interactive developer IDE environment designed to analyze, debug, and visualize Data Structures and Algorithms (DSA) step-by-step. By integrating the high-performance **Groq AI API**, AlgoVision serves as an automated tutor that checks human-written code, corrects logic errors, calculates complexity profiles, and generates live structural animations on the canvas.

---

## 🌟 Key Features

* 🤖 **AI-Driven Code Analysis**: Paste arbitrary algorithm code in **C++, Python, Java, or JavaScript**. AlgoVision will detect syntax/semantic bugs, show you a corrected code version, and write plain-English trace messages for each execution step.
* 📊 **Multi-Structure Canvas Visualizers**:
  * **Array Matrix View**: Matrix representation of array elements tracking indices, comparisons, done states, and swapping pointers.
  * **Sorting Height Bars**: Vertical bar chart animation rendering proportional height comparisons in real-time.
  * **Graph & Tree SVG Canvas**: Dynamic node-link SVG visualizer mapping circular/topological nodes (with coordinate calculations, Dijkstra distances, and colored traversal states).
  * **2D Matrix / Grid Visualizer**: Renders 2D arrays with index labels, custom cell values, and directional paths (ideal for BFS/DFS grid search or Flood Fill).
* ⏱️ **Full Simulation Playback**: Control code execution flow like a video player (Play, Pause, Step Forward `+`, Step Backward `-`, Reset) with custom animation speeds (Slowest to Fastest).
* 🗄️ **Recent Run History Manager**: Automatically caches your last 5 algorithm runs in `localStorage` for fast loading without redundant API calls.
* 🔒 **Secure Keys**: Loads API credentials cleanly from environment variables, preventing hardcoded leaks on client code.

---

## 🛠️ Tech Stack

* **Frontend Framework**: [React 19](https://react.dev/)
* **Build System & Dev Server**: [Vite](https://vite.dev/)
* **AI Engine**: [Groq Cloud API](https://console.groq.com/) (using OpenAI-compatible endpoints)
* **Styling**: Vanilla HSL CSS with monospaced developer typography.

---

## 💾 Installation & Setup

Follow these steps to run **AlgoVision** on your local machine:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (version `20.19+` or `22.12+` is recommended for Vite support).

### 2. Clone the Repository
```bash
git clone https://github.com/Kalpeshcoder18/AlgoVision.git
cd AlgoVision
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a file named `.env` in the root directory and add your Groq API key:
```env
VITE_groqApi=your_groq_api_key_here
```
*(Get your free API key at [console.groq.com](https://console.groq.com/keys))*

### 5. Run Development Server
Start the local server:
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:5173/`** to start visualizing!

---

## 💡 How to Use Custom Inputs

You can test custom algorithms using the **Custom Test Input** field:

* **Arrays**: Input comma-separated lists of values (e.g. `Array: [5, 2, 9, 1, 6]`).
* **Graphs**: Specify connections and optional edge weights (e.g. `Graph: A-B(4), B-C(2), C-A(5)`).
* **Matrices**: Write a 2D JSON array (e.g. `Matrix: [[1,1,1],[1,1,0],[1,0,1]]`).

---

## 👨‍💻 Creator & Attribution

Developed with ❤️ by **Kalpesh Paliwal**:

* 🐙 **GitHub**: [@Kalpeshcoder18](https://github.com/Kalpeshcoder18/Kalpeshcoder18)
* 💼 **LinkedIn**: [Kalpesh Paliwal Profile](https://www.linkedin.com/in/kalpesh-paliwal-9a9747279/)
* ✉️ **Email**: [klpshplwl455@gmail.com](mailto:klpshplwl455@gmail.com)

*Built as a professional portfolio project for engineering placement drives.*
