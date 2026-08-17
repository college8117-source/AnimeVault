window.ANIMEVAULT_API =
  window.ANIMEVAULT_API ||
  'https://animevault-api-miab.onrender.com/api';

async function api(path, options = {}) {
  const headers = {
    ...(options.body instanceof FormData ? {} : {'Content-Type':'application/json'}),
    ...(options.headers || {})
  };

  const token = localStorage.getItem('animevault_admin_token');
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(window.ANIMEVAULT_API + path, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.');
  }

  return data;
}
