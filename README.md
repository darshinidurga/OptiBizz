# OptiBiz — AI-Powered Business Profit Optimizer

OptiBiz is a SaaS intelligence platform designed to help small-to-medium businesses (SMBs), agencies, and manufacturers optimize their product mix, eliminate bottleneck friction, and maximize net weekly profit.

Powered by a constrained quadratic optimization engine solved via **SciPy (SLSQP)**, OptiBiz translates complex mathematical optimization into plain-language business insights, interactive visual analytics, and scenario modeling.

---

## 🌟 Key Features

- **Intuitive Profit Optimizer**:
  - Non-technical labels and helpful tooltips for ordinary business owners.
  - Multi-currency support (**USD ($)**, **INR (₹)**, **EUR (€)**, **GBP (£)**, **CAD (CA$)**, **AUD (A$)**).
  - Clean empty state on first load with explicit "Load Demo Business Data" control.
  - Automated browser `localStorage` persistence for uninterrupted workflows.
  - Clear separation between saved business inputs and solver calculations.

- **Dynamic Business Analytics**:
  - 100% data-driven; no fake metrics or preloaded mock numbers.
  - Planned vs. Optimal Workload bar charts.
  - Production Capacity Mix distribution donut chart.
  - Marginal Profit radar profile ($\frac{\partial P}{\partial q_i}$).
  - Full quadratic mathematical decomposition audit table.

- **Executive Performance Dashboard**:
  - Real-time planned baseline profit vs. peak projected profit.
  - Net profit uplift tracking ($+\Delta P$) and capacity utilization metrics.
  - Actionable product-by-product scale or taper directives.

- **Strategic Scenario Simulator**:
  - Compare what-if business assumptions side-by-side using your active product catalog.
  - Evaluate the ROI of capacity expansion vs. process streamlining.

- **Context-Aware AI Advisor**:
  - Chat assistant grounded strictly in your business's mathematical results.
  - Provides instant guidance on optimal volume, high-margin priorities, and capacity constraints with zero hallucination.

- **Data Import & Mapping**:
  - Bulk import product catalogs and historical volume via CSV / Excel (.xlsx).

---

## 📐 Mathematical Model

OptiBiz formulates business profitability as a concave quadratic objective function:

$$\text{Maximize } P(\mathbf{q}) = \sum_{i=1}^{n} m_i q_i - \sum_{i=1}^{n} a_i q_i^2 - s \left( \sum_{i=1}^{n} q_i \right)^2$$

### Parameters:
- **$m_i$ (Profit earned per unit)**: Selling price minus direct variable unit costs (net contribution margin).
- **$a_i$ (Workload penalty coefficient)**: Overload friction, fatigue, or diminishing returns unique to product $i$.
- **$s$ (Shared resource penalty coefficient)**: System-wide bottleneck cost caused by cross-product competition for shared resources (management, delivery infrastructure, warehouse space).
- **$q_i$ (Weekly output quantity)**: The decision variable for product $i$.

### Constraints:
1. **Non-negativity**: $q_i \ge 0 \quad \forall i$
2. **Individual Demand Ceilings**: $q_i \le \text{MaxDemand}_i \quad \forall i$
3. **Aggregate Capacity**: $\sum_{i=1}^{n} q_i \le \text{Capacity}$

The optimization problem is solved using **Sequential Least Squares Programming (SLSQP)** via `scipy.optimize.minimize`.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Recharts, Lucide Icons |
| **Backend** | Python 3.12, FastAPI, Uvicorn, SciPy, NumPy, Pydantic v2 |
| **Testing** | Pytest (26 unit & integration tests covering analytical baselines, gradient checks, and constraint validation) |
| **Storage** | Browser `localStorage` for responsive client-side persistence |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+ recommended) & `npm`
- **Python** (3.10+ recommended) & `pip`

---

### 1. Backend Setup

```bash
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest tests/ -v

# Start FastAPI server
python main.py
```

The backend API will run at `http://localhost:8000`. You can explore interactive Swagger documentation at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The application will launch at `http://localhost:5173`.

---

## 🧪 Testing

The backend includes a comprehensive test suite in `backend/tests/test_optimizer.py`:

```bash
cd backend
python -m pytest tests/ -v
```

**Test Coverage Highlights:**
- Analytical verification of single-product global maxima.
- Constraint compliance (tight capacity limits, zero penalty linear cases, demand saturation).
- Marginal profit gradient alignment ($\nabla P$).
- Multi-product workload distribution consistency.

---

## 📁 Project Structure

```
optibiz/
├── .gitignore
├── README.md
├── backend/
│   ├── main.py              # FastAPI endpoints and route handlers
│   ├── models.py            # Pydantic validation schemas
│   ├── optimizer.py         # SciPy SLSQP mathematical optimization engine
│   ├── requirements.txt     # Python dependencies
│   └── tests/
│       └── test_optimizer.py # 26 automated unit & integration tests
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx          # Root navigation & health monitor
│       ├── api.ts           # Axios backend API client
│       ├── store.ts         # Zustand state store with localStorage sync
│       ├── types.ts         # TypeScript data contracts
│       ├── components/      # UI components (Sidebar, badges, popups)
│       ├── pages/
│       │   ├── Dashboard.tsx        # Executive overview & KPIs
│       │   ├── ProfitOptimizer.tsx  # Product configuration & solver
│       │   ├── Analytics.tsx        # Dynamic charts & math breakdown
│       │   ├── ScenarioSimulator.tsx# What-if scenario comparison
│       │   ├── AIAdvisor.tsx        # Context-aware chat advisor
│       │   └── DataUpload.tsx       # CSV / Excel catalog importer
│       └── utils/
│           └── currency.ts  # Multi-currency symbols & formatters
└── scripts/
    ├── start-backend.ps1    # PowerShell quickstart script for backend
    └── start-frontend.ps1   # PowerShell quickstart script for frontend
```

---

## 📄 License

This project is licensed under the MIT License.

