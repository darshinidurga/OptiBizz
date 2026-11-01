"""
main.py — OptiBiz FastAPI application
=====================================
Endpoints:
  GET  /api/health           — Health check
  GET  /api/demo-data        — Simulated demo data (clearly labelled)
  POST /api/optimize         — Run profit optimization
  POST /api/scenario/compare — Compare two parameter scenarios
  POST /api/upload/preview   — Preview CSV/Excel upload
"""
from __future__ import annotations

import io
import json
from typing import Any, Dict, List

import pandas as pd
import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from models import (
    HealthResponse,
    OptimizeRequest,
    OptimizeResponse,
    ProductResultResponse,
    ScenarioCompareResponse,
    ScenarioRequest,
    ValidationErrorResponse,
)
from optimizer import (
    ProductInput,
    OptimizationResult,
    optimize,
    validate_inputs,
)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="OptiBiz API",
    description=(
        "AI-powered profit optimization API. "
        "All results are model-based projections — not guaranteed real-world outcomes."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_product_inputs(req: OptimizeRequest) -> List[ProductInput]:
    return [
        ProductInput(
            name=p.name,
            m_i=p.m_i,
            a_i=p.a_i,
            planned_qty=p.planned_qty,
            max_demand=p.max_demand,
        )
        for p in req.products
    ]


def _result_to_response(result: OptimizationResult) -> OptimizeResponse:
    return OptimizeResponse(
        status=result.status,
        status_message=result.status_message,
        solver_iterations=result.solver_iterations,
        current_profit=result.current_profit,
        optimal_profit=result.optimal_profit,
        profit_difference=result.profit_difference,
        profit_improvement_pct=result.profit_improvement_pct,
        products=[
            ProductResultResponse(
                name=pr.name,
                planned_qty=pr.planned_qty,
                optimal_qty=pr.optimal_qty,
                marginal_profit_at_planned=pr.marginal_profit_at_planned,
                marginal_profit_at_optimal=pr.marginal_profit_at_optimal,
                recommendation=pr.recommendation,
                qty_change=pr.qty_change,
                qty_change_pct=pr.qty_change_pct,
            )
            for pr in result.products
        ],
        capacity=result.capacity,
        total_planned_qty=result.total_planned_qty,
        total_optimal_qty=result.total_optimal_qty,
        capacity_utilization_planned=result.capacity_utilization_planned,
        capacity_utilization_optimal=result.capacity_utilization_optimal,
        shared_resource_penalty_planned=result.shared_resource_penalty_planned,
        shared_resource_penalty_optimal=result.shared_resource_penalty_optimal,
        is_projection=result.is_projection,
        disclaimer=result.disclaimer,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        version="1.0.0",
        model="Quadratic profit model: P=Σ(m_i·q_i)−Σ(a_i·q_i²)−s·(Σq_i)²",
    )


@app.get("/api/demo-data")
def demo_data() -> Dict[str, Any]:
    """Return simulated demo data — clearly labelled as SIMULATED."""
    return {
        "is_simulated": True,
        "label": "SIMULATED DEMO DATA — not real business data",
        "optimize_request": {
            "s": 0.003,
            "capacity": 500,
            "products": [
                {"name": "SaaS Subscription", "m_i": 150, "a_i": 0.35, "planned_qty": 90,  "max_demand": 220},
                {"name": "Consulting Hours",   "m_i": 210, "a_i": 0.70, "planned_qty": 55,  "max_demand": 130},
                {"name": "Support Packages",   "m_i": 80,  "a_i": 0.20, "planned_qty": 120, "max_demand": 250},
                {"name": "Training Workshops", "m_i": 320, "a_i": 1.10, "planned_qty": 30,  "max_demand": 80},
            ],
        },
    }


@app.post("/api/optimize", response_model=OptimizeResponse)
def run_optimize(req: OptimizeRequest):
    products = _to_product_inputs(req)

    # Validate
    errors = validate_inputs(products, req.s, req.capacity)
    hard_errors = [e for e in errors if "clamp" not in e.lower()]
    if hard_errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "Validation failed", "errors": hard_errors},
        )

    result = optimize(products, req.s, req.capacity)
    return _result_to_response(result)


@app.post("/api/scenario/compare", response_model=ScenarioCompareResponse)
def compare_scenarios(req: ScenarioRequest):
    products_a = _to_product_inputs(req.scenario_a)
    products_b = _to_product_inputs(req.scenario_b)

    errors_a = validate_inputs(products_a, req.scenario_a.s, req.scenario_a.capacity)
    errors_b = validate_inputs(products_b, req.scenario_b.s, req.scenario_b.capacity)
    all_errors = [f"[{req.label_a}] {e}" for e in errors_a if "clamp" not in e.lower()] + \
                 [f"[{req.label_b}] {e}" for e in errors_b if "clamp" not in e.lower()]
    if all_errors:
        raise HTTPException(status_code=422, detail={"errors": all_errors})

    result_a = optimize(products_a, req.scenario_a.s, req.scenario_a.capacity)
    result_b = optimize(products_b, req.scenario_b.s, req.scenario_b.capacity)

    better = req.label_a if result_a.optimal_profit >= result_b.optimal_profit else req.label_b

    return ScenarioCompareResponse(
        label_a=req.label_a,
        label_b=req.label_b,
        result_a=_result_to_response(result_a),
        result_b=_result_to_response(result_b),
        better_scenario=better,
        profit_difference_between_scenarios=round(
            abs(result_a.optimal_profit - result_b.optimal_profit), 4
        ),
    )


@app.post("/api/upload/preview")
async def upload_preview(file: UploadFile = File(...)):
    """Parse CSV or Excel and return a preview of columns and sample rows."""
    content = await file.read()
    filename = file.filename or ""

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content), nrows=50)
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content), nrows=50)
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Upload a .csv, .xlsx, or .xls file.",
            )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {exc}")

    columns = list(df.columns)
    sample_rows = df.head(5).fillna("").to_dict(orient="records")

    return {
        "filename": filename,
        "total_rows": len(df),
        "columns": columns,
        "sample_rows": sample_rows,
        "suggested_mapping": _suggest_mapping(columns),
        "label": "PREVIEW — data not yet used in optimization",
    }


def _suggest_mapping(columns: List[str]) -> Dict[str, str]:
    """Heuristically suggest column → parameter mappings."""
    mapping: Dict[str, str] = {}
    lower = {c.lower(): c for c in columns}
    hints = {
        "name": ["name", "product", "service", "item", "description"],
        "m_i":  ["margin", "profit", "m_i", "unit_profit", "contribution"],
        "a_i":  ["penalty", "overload", "a_i", "cost_coeff"],
        "planned_qty": ["planned", "qty", "quantity", "volume", "units"],
        "max_demand":  ["max", "demand", "cap", "limit", "max_demand"],
    }
    for param, keywords in hints.items():
        for kw in keywords:
            for col_lower, col_orig in lower.items():
                if kw in col_lower and param not in mapping:
                    mapping[param] = col_orig
    return mapping


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

