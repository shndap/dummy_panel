import { apiFetch, buildQueryString } from './client';

// GET /api/dashboard/experiment_value/?exp_name=...&goal_type=...
export async function getExperimentValue(expName, goalType) {
  const qs = buildQueryString({ exp_name: expName, goal_type: goalType });
  return apiFetch(`/api/dashboard/experiment_value/${qs}`);
}

// POST /api/dashboard/migrate_data/
export async function migrateData() {
  return apiFetch('/api/dashboard/migrate_data/', { method: 'POST' });
} 