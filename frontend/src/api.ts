// api.ts — Axios API client with proxy to FastAPI backend
import axios from 'axios'
import type { OptimizeRequest, OptimizeResponse, ScenarioCompareResponse } from './types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export async function checkHealth() {
  const res = await api.get('/health')
  return res.data
}

export async function fetchDemoData() {
  const res = await api.get('/demo-data')
  return res.data
}

export async function runOptimize(req: OptimizeRequest): Promise<OptimizeResponse> {
  const res = await api.post<OptimizeResponse>('/optimize', req)
  return res.data
}

export async function compareScenarios(
  scenarioA: OptimizeRequest,
  scenarioB: OptimizeRequest,
  labelA = 'Scenario A',
  labelB = 'Scenario B'
): Promise<ScenarioCompareResponse> {
  const res = await api.post<ScenarioCompareResponse>('/scenario/compare', {
    scenario_a: scenarioA,
    scenario_b: scenarioB,
    label_a: labelA,
    label_b: labelB,
  })
  return res.data
}

export async function uploadPreview(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post('/upload/preview', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

