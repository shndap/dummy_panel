import { apiFetch, buildQueryString } from './client';
import { getExperimentValue } from './dashboard';

// GET /api/fulltests/frontend_list/
export async function getFrontendExperiments(params = {}) {
  const qs = buildQueryString(params);
  const raw = await apiFetch(`/api/fulltests/frontend_list/${qs}`);
  const results = raw?.results ?? raw?.data?.experiments ?? raw?.data ?? [];
  const count = raw?.count ?? raw?.data?.pagination?.totalItems ?? (Array.isArray(results) ? results.length : 0);
  return { results, count, raw };
}

// GET /api/fulltests/compare_files/?exp1=...&exp2=...
export async function getComparisonFiles(exp1, exp2) {
  const qs = buildQueryString({ exp1, exp2 });
  return apiFetch(`/api/fulltests/compare_files/${qs}`);
}

// GET /api/fulltests/frontend_improved/
export async function getImprovedExperiments(params = {}) {
  const qs = buildQueryString(params);
  const raw = await apiFetch(`/api/fulltests/frontend_improved/${qs}`);
  const results = raw?.results ?? raw?.data?.experiments ?? raw?.data ?? [];
  const count = raw?.count ?? raw?.data?.pagination?.totalItems ?? (Array.isArray(results) ? results.length : 0);
  return { results, count, raw };
}

// GET /api/fulltests/
export async function listFulltests(params = {}) {
  const qs = buildQueryString(params);
  return apiFetch(`/api/fulltests/${qs}`);
}

// POST /api/fulltests/create_fulltest/
export async function createFulltestEntry({ name, tag = '', description = '' }) {
  return apiFetch('/api/fulltests/create_fulltest/', {
    method: 'POST',
    body: JSON.stringify({ name, tag, description }),
  });
}

// POST /api/fulltests/{id}/add_improvement/
export async function postAddImprovement(id, improvement) {
  return apiFetch(`/api/fulltests/${id}/add_improvement/`, {
    method: 'POST',
    body: JSON.stringify({ improvement }),
  });
}

// POST /api/fulltests/{id}/remove_improvement/
export async function postRemoveImprovement(id, improvement) {
  return apiFetch(`/api/fulltests/${id}/remove_improvement/`, {
    method: 'POST',
    body: JSON.stringify({ improvement }),
  });
}

// Convenience: add improvement then fetch experiment value
export async function addImprovement(id, improvement, expName) {
  await postAddImprovement(id, improvement);
  const goalType = String(improvement || '').toLowerCase();
  if (expName && ['open', 'close', 'reg'].includes(goalType)) {
    try {
      return await getExperimentValue(expName, goalType);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Convenience: remove improvement then fetch experiment value (optional)
export async function removeImprovement(id, improvement, expName) {
  await postRemoveImprovement(id, improvement);
  const goalType = String(improvement || '').toLowerCase();
  if (expName && ['open', 'close', 'reg'].includes(goalType)) {
    try {
      return await getExperimentValue(expName, goalType);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// POST /api/fulltests/
export async function createFulltest(body) {
  return apiFetch('/api/fulltests/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// PATCH /api/fulltests/{id}/
export async function patchFulltest(id, body) {
  return apiFetch(`/api/fulltests/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// POST /api/fulltests/{id}/start/
export async function startFulltest(id) {
  return apiFetch(`/api/fulltests/${id}/start/`, { method: 'POST' });
}

// POST /api/fulltests/{id}/stop/
export async function stopFulltest(id) {
  return apiFetch(`/api/fulltests/${id}/stop/`, { method: 'POST' });
}

// GET /api/fulltests/{id}/logs/
export async function getFulltestLogs(id) {
  return apiFetch(`/api/fulltests/${id}/logs/`);
}

// GET /api/fulltests/get_kube_logs/?exp_name=...&lines=...
export async function getKubeLogs(expName, lines = 500) {
  const qs = buildQueryString({ exp_name: expName, lines });
  return apiFetch(`/api/fulltests/get_kube_logs/${qs}`);
}

// DELETE /api/fulltests/{id}/
export async function deleteFulltest(id) {
  return apiFetch(`/api/fulltests/${id}/`, { method: 'DELETE' });
} 