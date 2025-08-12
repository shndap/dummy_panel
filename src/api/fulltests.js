import { apiFetch, buildQueryString } from './client';

// GET /api/fulltests/frontend_list/
export async function getFrontendExperiments(params = {}) {
  const qs = buildQueryString(params);
  const raw = await apiFetch(`/api/fulltests/frontend_list/${qs}`);
  const results = raw?.results ?? raw?.data?.experiments ?? raw?.data ?? [];
  const count = raw?.count ?? raw?.data?.pagination?.totalItems ?? (Array.isArray(results) ? results.length : 0);
  return { results, count, raw };
}

// GET /api/fulltests/
export async function listFulltests(params = {}) {
  const qs = buildQueryString(params);
  return apiFetch(`/api/fulltests/${qs}`);
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

// POST /api/fulltests/{id}/add_improvement/
export async function addImprovement(id, improvement) {
  return apiFetch(`/api/fulltests/${id}/add_improvement/`, {
    method: 'POST',
    body: JSON.stringify({ improvement }),
  });
}

// POST /api/fulltests/{id}/remove_improvement/
export async function removeImprovement(id, improvement) {
  return apiFetch(`/api/fulltests/${id}/remove_improvement/`, {
    method: 'POST',
    body: JSON.stringify({ improvement }),
  });
}

// GET /api/fulltests/{id}/logs/
export async function getFulltestLogs(id) {
  return apiFetch(`/api/fulltests/${id}/logs/`);
}

// DELETE /api/fulltests/{id}/
export async function deleteFulltest(id) {
  return apiFetch(`/api/fulltests/${id}/`, { method: 'DELETE' });
} 