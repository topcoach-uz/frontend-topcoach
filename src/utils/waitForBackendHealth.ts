export async function waitForBackendHealth({
    url = '/api/health/simple',
    timeout = 10000,
    interval = 500,
  } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok') return true;
        }
      } catch (e) {}
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error('Backend not healthy after waiting');
  }