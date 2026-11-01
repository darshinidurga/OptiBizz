"""
optimizer.py — OptiBiz Profit Optimization Engine
==================================================
Mathematical model (provisional — replace without changing API contracts):

    Maximize:  P = Σ(m_i · q_i) − Σ(a_i · q_i²) − s · (Σq_i)²

    Where:
        m_i  = marginal profit per unit for product i  ($/unit)
        q_i  = production quantity for product i       (units/week)
        a_i  = overload penalty coefficient            ($/unit²)
        s    = shared-resource penalty coefficient     ($/unit²)

    Subject to:
        q_i ≥ 0               (non-negativity)
        q_i ≤ max_demand_i    (demand cap per product)
        Σq_i ≤ Q              (capacity constraint)
        a_i ≥ 0, s ≥ 0        (valid penalty coefficients)

Marginal profit (gradient):
    ∂P/∂q_i = m_i − 2·a_i·q_i − 2·s·Σq_j

Solver: scipy.optimize.minimize with SLSQP method (gradient-based,
supports equality and inequality constraints + bounds).

NOTE: This module is intentionally kept separate from the API layer so
the mathematical formulation can be swapped without touching main.py.
"""

from __future__ import annotations

import numpy as np
from scipy.optimize import minimize, OptimizeResult
from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class ProductInput:
    name: str
    m_i: float          # marginal profit per unit  ($/unit)
    a_i: float          # overload penalty coefficient ($/unit²)
    planned_qty: float  # operator's planned weekly quantity
    max_demand: float   # maximum feasible demand / demand cap


@dataclass
class ProductResult:
    name: str
    planned_qty: float
    optimal_qty: float
    marginal_profit_at_planned: float
    marginal_profit_at_optimal: float
    recommendation: str          # "increase" | "decrease" | "maintain"
    qty_change: float
    qty_change_pct: float


@dataclass
class OptimizationResult:
    status: str                  # "success" | "warning" | "infeasible"
    status_message: str
    solver_iterations: int

    current_profit: float
    optimal_profit: float
    profit_difference: float
    profit_improvement_pct: float

    products: List[ProductResult]
    capacity: float
    total_planned_qty: float
    total_optimal_qty: float
    capacity_utilization_planned: float
    capacity_utilization_optimal: float

    shared_resource_penalty_planned: float
    shared_resource_penalty_optimal: float

    is_projection: bool = True
    disclaimer: str = (
        "All figures are model-based projections derived from the quadratic profit formula. "
        "They are NOT guaranteed real-world profits."
    )


# ---------------------------------------------------------------------------
# Core math functions
# ---------------------------------------------------------------------------

def profit(q: np.ndarray, m: np.ndarray, a: np.ndarray, s: float) -> float:
    """
    Compute total profit for quantity vector q.

        P = Σ(m_i·q_i) − Σ(a_i·q_i²) − s·(Σq_i)²
    """
    revenue_term    = float(np.dot(m, q))
    overload_term   = float(np.dot(a, q ** 2))
    shared_term     = s * float(np.sum(q) ** 2)
    return revenue_term - overload_term - shared_term


def marginal_profit(q: np.ndarray, m: np.ndarray, a: np.ndarray, s: float) -> np.ndarray:
    """
    Gradient of profit w.r.t. q:

        ∂P/∂q_i = m_i − 2·a_i·q_i − 2·s·Σq_j
    """
    total_q = float(np.sum(q))
    return m - 2.0 * a * q - 2.0 * s * total_q


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_inputs(
    products: List[ProductInput],
    s: float,
    capacity: float,
) -> List[str]:
    """Return a list of validation error strings (empty = valid)."""
    errors: List[str] = []

    if not products:
        errors.append("At least one product is required.")

    if s < 0:
        errors.append(f"Shared-resource penalty s={s} must be ≥ 0.")

    if capacity <= 0:
        errors.append(f"Capacity={capacity} must be > 0.")

    for i, p in enumerate(products):
        tag = f"Product '{p.name}' (index {i})"
        if p.a_i < 0:
            errors.append(f"{tag}: overload penalty a_i={p.a_i} must be ≥ 0.")
        if p.m_i <= 0:
            errors.append(f"{tag}: marginal profit m_i={p.m_i} must be > 0.")
        if p.max_demand <= 0:
            errors.append(f"{tag}: max_demand={p.max_demand} must be > 0.")
        if p.planned_qty < 0:
            errors.append(f"{tag}: planned_qty={p.planned_qty} must be ≥ 0.")
        if p.planned_qty > p.max_demand:
            errors.append(
                f"{tag}: planned_qty={p.planned_qty} exceeds max_demand={p.max_demand}. "
                "Will clamp to max_demand for analysis."
            )

    return errors


# ---------------------------------------------------------------------------
# Optimizer
# ---------------------------------------------------------------------------

def optimize(
    products: List[ProductInput],
    s: float,
    capacity: float,
) -> OptimizationResult:
    """
    Run the constrained profit maximisation.

    Returns an OptimizationResult regardless of solver status —
    callers should check `.status` for "success" vs "warning"/"infeasible".
    """
    n = len(products)
    m = np.array([p.m_i        for p in products], dtype=float)
    a = np.array([p.a_i        for p in products], dtype=float)
    q_planned = np.array([
        min(p.planned_qty, p.max_demand) for p in products
    ], dtype=float)
    max_d = np.array([p.max_demand for p in products], dtype=float)

    # ---- Objective (negate because scipy minimises) -----------------------
    def neg_profit(q: np.ndarray) -> float:
        return -profit(q, m, a, s)

    def neg_profit_grad(q: np.ndarray) -> np.ndarray:
        return -marginal_profit(q, m, a, s)

    # ---- Constraints -------------------------------------------------------
    # Capacity: Σq_i ≤ Q  →  Q − Σq_i ≥ 0
    constraints = [
        {"type": "ineq", "fun": lambda q: capacity - np.sum(q),
                          "jac": lambda q: -np.ones(n)}
    ]

    # ---- Bounds: 0 ≤ q_i ≤ max_demand_i -----------------------------------
    bounds = [(0.0, float(d)) for d in max_d]

    # ---- Initial guess: planned quantities (clamped to feasible region) ---
    q0 = np.clip(q_planned, 0.0, max_d)
    if np.sum(q0) > capacity:
        # Scale down proportionally to satisfy capacity at start
        q0 = q0 * (capacity / np.sum(q0)) * 0.99

    # ---- Solve -------------------------------------------------------------
    result: OptimizeResult = minimize(
        neg_profit,
        q0,
        jac=neg_profit_grad,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"maxiter": 1000, "ftol": 1e-9},
    )

    q_opt = np.clip(result.x, 0.0, max_d)

    # ---- Compute metrics ---------------------------------------------------
    p_planned = profit(q_planned, m, a, s)
    p_optimal = profit(q_opt,     m, a, s)
    mp_planned = marginal_profit(q_planned, m, a, s)
    mp_optimal = marginal_profit(q_opt,     m, a, s)

    total_planned = float(np.sum(q_planned))
    total_optimal = float(np.sum(q_opt))

    shared_pen_planned = s * total_planned ** 2
    shared_pen_optimal = s * total_optimal ** 2

    profit_diff = p_optimal - p_planned
    profit_pct  = (profit_diff / abs(p_planned) * 100.0) if p_planned != 0 else 0.0

    # ---- Per-product results -----------------------------------------------
    product_results: List[ProductResult] = []
    for i, p in enumerate(products):
        delta     = float(q_opt[i]) - float(q_planned[i])
        delta_pct = (delta / float(q_planned[i]) * 100.0) if q_planned[i] != 0 else 0.0

        if delta > 0.5:
            rec = "increase"
        elif delta < -0.5:
            rec = "decrease"
        else:
            rec = "maintain"

        product_results.append(ProductResult(
            name=p.name,
            planned_qty=float(q_planned[i]),
            optimal_qty=round(float(q_opt[i]), 2),
            marginal_profit_at_planned=round(float(mp_planned[i]), 4),
            marginal_profit_at_optimal=round(float(mp_optimal[i]), 4),
            recommendation=rec,
            qty_change=round(delta, 2),
            qty_change_pct=round(delta_pct, 2),
        ))

    # ---- Status ------------------------------------------------------------
    if result.success:
        status, status_msg = "success", "Optimization converged successfully."
    elif result.status == 9:          # Iteration limit
        status = "warning"
        status_msg = "Solver hit iteration limit; result may be suboptimal."
    else:
        status = "warning"
        status_msg = f"Solver reported: {result.message}"

    return OptimizationResult(
        status=status,
        status_message=status_msg,
        solver_iterations=int(result.nit),

        current_profit=round(p_planned, 4),
        optimal_profit=round(p_optimal, 4),
        profit_difference=round(profit_diff, 4),
        profit_improvement_pct=round(profit_pct, 2),

        products=product_results,
        capacity=float(capacity),
        total_planned_qty=round(total_planned, 2),
        total_optimal_qty=round(total_optimal, 2),
        capacity_utilization_planned=round(total_planned / capacity, 4) if capacity else 0,
        capacity_utilization_optimal=round(total_optimal / capacity, 4) if capacity else 0,

        shared_resource_penalty_planned=round(shared_pen_planned, 4),
        shared_resource_penalty_optimal=round(shared_pen_optimal, 4),
    )

