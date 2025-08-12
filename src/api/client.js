export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const getAuthHeader = () => {
  const token = process.env.REACT_APP_API_TOKEN;
  if (!token) return {};
  // Spec defines header name Authorization with "Token" prefix
  return { Authorization: `Token ${token}` };
};

const defaultHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.append(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = {
    ...defaultHeaders,
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';

  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = new Error(`API error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
} 