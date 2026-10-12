const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function requestAI(endpoint, prompt, context = {}) {
  let response;
  try {
    response = await fetch(`${apiBase}/api/ai/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
    });
  } catch {
    throw new Error('StudentOS AI server is not reachable. Start the API server and try again.');
  }

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.error?.message || `AI request failed (${response.status}).`);
  }
  return result;
}
