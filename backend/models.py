"""
models.py — Pydantic request/response schemas for OptiBiz API
"""
from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class ProductRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    m_i: float = Field(..., gt=0, description="Marginal profit per unit ($/unit)")
    a_i: float = Field(..., ge=0, description="Overload penalty coefficient ($/unit²)")
    planned_qty: float = Field(..., ge=0, description="Planned weekly quantity")
    max_demand: float = Field(..., gt=0, description="Maximum demand / capacity cap per product")

    @field_validator("planned_qty")
    @classmethod
    def planned_within_demand(cls, v: float, info) -> float:
        # Soft warning — clamped in optimizer; not a hard error
        return v


class OptimizeRequest(BaseModel):
    products: List[ProductRequest] = Field(..., min_length=1, max_length=20)
    s: float = Field(..., ge=0, description="Shared-resource penalty coefficient ($/unit²)")
    capacity: float = Field(..., gt=0, description="Total weekly production capacity (units)")

    @model_validator(mode="after")
    def check_capacity_feasibility(self) -> "OptimizeRequest":
        min_total_demand = sum(p.max_demand for p in self.products)
        if self.capacity < 1:
            raise ValueError("Capacity must be at least 1 unit.")
        return self


class ScenarioRequest(BaseModel):
    scenario_a: OptimizeRequest
    scenario_b: OptimizeRequest
    label_a: str = "Scenario A"
    label_b: str = "Scenario B"


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ProductResultResponse(BaseModel):
    name: str
    planned_qty: float
    optimal_qty: float
    marginal_profit_at_planned: float
    marginal_profit_at_optimal: float
    recommendation: str
    qty_change: float
    qty_change_pct: float


class OptimizeResponse(BaseModel):
    status: str
    status_message: str
    solver_iterations: int

    current_profit: float
    optimal_profit: float
    profit_difference: float
    profit_improvement_pct: float

    products: List[ProductResultResponse]
    capacity: float
    total_planned_qty: float
    total_optimal_qty: float
    capacity_utilization_planned: float
    capacity_utilization_optimal: float
    shared_resource_penalty_planned: float
    shared_resource_penalty_optimal: float

    is_projection: bool = True
    disclaimer: str


class ScenarioCompareResponse(BaseModel):
    label_a: str
    label_b: str
    result_a: OptimizeResponse
    result_b: OptimizeResponse
    better_scenario: str
    profit_difference_between_scenarios: float
    is_projection: bool = True


class ValidationErrorResponse(BaseModel):
    detail: str
    errors: List[str]


class HealthResponse(BaseModel):
    status: str
    version: str
    model: str

