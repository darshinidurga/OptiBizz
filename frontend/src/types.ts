// types.ts — shared TypeScript interfaces matching the backend Pydantic schemas

export interface ProductRequest {
  name: string
  m_i: number
  a_i: number
  planned_qty: number
  max_demand: number
}

export interface OptimizeRequest {
  products: ProductRequest[]
  s: number
  capacity: number
}

export interface ProductResult {
  name: string
  planned_qty: number
  optimal_qty: number
  marginal_profit_at_planned: number
  marginal_profit_at_optimal: number
  recommendation: 'increase' | 'decrease' | 'maintain'
  qty_change: number
  qty_change_pct: number
}

export interface OptimizeResponse {
  status: string
  status_message: string
  solver_iterations: number
  current_profit: number
  optimal_profit: number
  profit_difference: number
  profit_improvement_pct: number
  products: ProductResult[]
  capacity: number
  total_planned_qty: number
  total_optimal_qty: number
  capacity_utilization_planned: number
  capacity_utilization_optimal: number
  shared_resource_penalty_planned: number
  shared_resource_penalty_optimal: number
  is_projection: boolean
  disclaimer: string
}

export interface ScenarioCompareResponse {
  label_a: string
  label_b: string
  result_a: OptimizeResponse
  result_b: OptimizeResponse
  better_scenario: string
  profit_difference_between_scenarios: number
  is_projection: boolean
}

export type Page = 'dashboard' | 'optimizer' | 'analytics' | 'upload' | 'scenario' | 'advisor'

