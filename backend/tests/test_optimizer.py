"""
test_optimizer.py — Unit tests for the OptiBiz profit optimization engine
=========================================================================
Run with: pytest tests/ -v
"""
import pytest
import numpy as np
from optimizer import (
    ProductInput,
    profit,
    marginal_profit,
    validate_inputs,
    optimize,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_product(name="P", m_i=100.0, a_i=0.5, planned=50.0, max_demand=150.0):
    return ProductInput(name=name, m_i=m_i, a_i=a_i, planned_qty=planned, max_demand=max_demand)


# ---------------------------------------------------------------------------
# Profit function
# ---------------------------------------------------------------------------

class TestProfitFunction:
    def test_zero_quantities(self):
        q = np.array([0.0, 0.0])
        m = np.array([100.0, 200.0])
        a = np.array([0.5, 0.8])
        assert profit(q, m, a, s=0.01) == pytest.approx(0.0)

    def test_single_unit_no_penalty(self):
        q = np.array([1.0])
        m = np.array([50.0])
        a = np.array([0.0])
        assert profit(q, m, a, s=0.0) == pytest.approx(50.0)

    def test_overload_penalty_reduces_profit(self):
        q = np.array([10.0])
        m = np.array([100.0])
        a = np.array([1.0])
        # P = 100*10 - 1.0*100 - 0 = 900
        assert profit(q, m, a, s=0.0) == pytest.approx(900.0)

    def test_shared_penalty_applied(self):
        q = np.array([5.0, 5.0])
        m = np.array([50.0, 50.0])
        a = np.array([0.0, 0.0])
        s = 0.1
        # P = 500 - 0 - 0.1 * 100 = 490
        assert profit(q, m, a, s=s) == pytest.approx(490.0)


# ---------------------------------------------------------------------------
# Marginal profit
# ---------------------------------------------------------------------------

class TestMarginalProfit:
    def test_gradient_no_penalty(self):
        q = np.array([10.0])
        m = np.array([80.0])
        a = np.array([0.0])
        grad = marginal_profit(q, m, a, s=0.0)
        assert grad[0] == pytest.approx(80.0)

    def test_gradient_with_overload(self):
        q = np.array([10.0])
        m = np.array([100.0])
        a = np.array([1.0])
        # ∂P/∂q = 100 - 2*1*10 - 0 = 80
        grad = marginal_profit(q, m, a, s=0.0)
        assert grad[0] == pytest.approx(80.0)


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

class TestValidation:
    def test_negative_s_fails(self):
        errors = validate_inputs([make_product()], s=-0.1, capacity=200)
        assert any("s=" in e for e in errors)

    def test_negative_a_fails(self):
        p = make_product(a_i=-0.5)
        errors = validate_inputs([p], s=0.0, capacity=200)
        assert any("a_i" in e for e in errors)

    def test_planned_exceeds_demand_flagged(self):
        p = make_product(planned=200, max_demand=100)
        errors = validate_inputs([p], s=0.0, capacity=500)
        assert any("max_demand" in e for e in errors)

    def test_valid_input_no_errors(self):
        p = make_product()
        errors = validate_inputs([p], s=0.01, capacity=300)
        assert errors == []


# ---------------------------------------------------------------------------
# Single-product optimization
# ---------------------------------------------------------------------------

class TestSingleProduct:
    def test_unconstrained_optimal_known_analytically(self):
        # For single product, no capacity/demand binding:
        # P = m*q - a*q² - s*q²  =>  dP/dq = m - 2(a+s)q = 0
        # q* = m / (2*(a+s))
        m_i, a_i, s = 100.0, 0.5, 0.5
        q_star = m_i / (2 * (a_i + s))   # = 50
        p = make_product(m_i=m_i, a_i=a_i, planned=10.0, max_demand=200.0)
        result = optimize([p], s=s, capacity=500.0)
        assert result.products[0].optimal_qty == pytest.approx(q_star, abs=1.0)

    def test_optimal_higher_than_planned(self):
        p = make_product(planned=5.0, max_demand=200.0)
        result = optimize([p], s=0.01, capacity=500.0)
        assert result.optimal_profit >= result.current_profit

    def test_demand_cap_binding(self):
        p = make_product(m_i=100.0, a_i=0.001, planned=10.0, max_demand=30.0)
        result = optimize([p], s=0.001, capacity=500.0)
        assert result.products[0].optimal_qty <= 30.0 + 1e-6

    def test_optimal_profit_ge_planned_profit(self):
        p = make_product()
        result = optimize([p], s=0.005, capacity=300.0)
        assert result.optimal_profit >= result.current_profit - 1e-6

    def test_zero_penalty_linear_case(self):
        # a_i = 0, s = 0 → profit is linear → optimizer hits demand cap
        p = make_product(m_i=50.0, a_i=0.0, planned=20.0, max_demand=100.0)
        result = optimize([p], s=0.0, capacity=500.0)
        assert result.products[0].optimal_qty == pytest.approx(100.0, abs=1.0)


# ---------------------------------------------------------------------------
# Multi-product optimization
# ---------------------------------------------------------------------------

class TestMultiProduct:
    def _default_products(self):
        return [
            make_product("A", m_i=120, a_i=0.4, planned=80,  max_demand=200),
            make_product("B", m_i=200, a_i=0.8, planned=60,  max_demand=120),
            make_product("C", m_i=80,  a_i=0.2, planned=100, max_demand=250),
        ]

    def test_returns_all_products(self):
        result = optimize(self._default_products(), s=0.003, capacity=450)
        assert len(result.products) == 3

    def test_optimal_profit_ge_planned(self):
        result = optimize(self._default_products(), s=0.003, capacity=450)
        assert result.optimal_profit >= result.current_profit - 1e-4

    def test_capacity_constraint_respected(self):
        result = optimize(self._default_products(), s=0.003, capacity=450)
        assert result.total_optimal_qty <= 450.0 + 1e-4

    def test_demand_caps_respected(self):
        products = self._default_products()
        result = optimize(products, s=0.003, capacity=450)
        for pr, p in zip(result.products, products):
            assert pr.optimal_qty <= p.max_demand + 1e-6

    def test_non_negative_quantities(self):
        result = optimize(self._default_products(), s=0.003, capacity=450)
        for pr in result.products:
            assert pr.optimal_qty >= -1e-6

    def test_recommendations_consistent(self):
        result = optimize(self._default_products(), s=0.003, capacity=450)
        for pr in result.products:
            assert pr.recommendation in ("increase", "decrease", "maintain")
            if pr.qty_change > 0.5:
                assert pr.recommendation == "increase"
            elif pr.qty_change < -0.5:
                assert pr.recommendation == "decrease"

    def test_capacity_utilization_range(self):
        result = optimize(self._default_products(), s=0.003, capacity=450)
        assert 0.0 <= result.capacity_utilization_optimal <= 1.001

    def test_status_field_present(self):
        result = optimize(self._default_products(), s=0.003, capacity=450)
        assert result.status in ("success", "warning", "infeasible")

    def test_is_projection_flag(self):
        result = optimize(self._default_products(), s=0.003, capacity=450)
        assert result.is_projection is True


# ---------------------------------------------------------------------------
# Capacity-constrained case
# ---------------------------------------------------------------------------

class TestCapacityConstrained:
    def test_tight_capacity_binds(self):
        products = [
            make_product("X", m_i=150, a_i=0.1, planned=40, max_demand=200),
            make_product("Y", m_i=150, a_i=0.1, planned=40, max_demand=200),
        ]
        tight_capacity = 60.0
        result = optimize(products, s=0.001, capacity=tight_capacity)
        assert result.total_optimal_qty <= tight_capacity + 1e-4

    def test_profit_difference_non_negative(self):
        products = [
            make_product("X", m_i=100, a_i=0.5, planned=20, max_demand=100),
        ]
        result = optimize(products, s=0.01, capacity=200)
        assert result.profit_difference >= -1e-4

