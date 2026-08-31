const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(
  /\/$/,
  '',
)

async function apiRequest(path, options = {}) {
  const headers = { ...options.headers }

  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  let response

  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    })
  } catch {
    throw new Error('Povezava s strežnikom ni uspela')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || 'Zahteva ni uspela')
    error.status = response.status
    throw error
  }

  return data
}

export default apiRequest
