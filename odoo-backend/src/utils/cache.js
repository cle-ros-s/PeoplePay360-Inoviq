class MemoryCache {
  constructor(defaultTtlMs = 60 * 1000, maxStaleMs = 30 * 60 * 1000) {
    this.cache = new Map();
    this.inFlight = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.maxStaleMs = maxStaleMs;
  }

  async getOrFetch(key, fetcher, ttlMs = this.defaultTtlMs) {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry) {
      const age = now - entry.timestamp;
      if (age < ttlMs) {
        // Fresh hit - return in 0ms
        return entry.data;
      } else if (age < ttlMs + this.maxStaleMs) {
        // Stale-While-Revalidate: Return instant cached data, revalidate asynchronously
        this.revalidateInBackground(key, fetcher);
        return entry.data;
      }
    }

    // Cold miss or expired: check in-flight deduplication
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const promise = (async () => {
      try {
        const data = await fetcher();
        this.cache.set(key, { timestamp: Date.now(), data });
        return data;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  revalidateInBackground(key, fetcher) {
    if (this.inFlight.has(key)) return;
    const promise = (async () => {
      try {
        const data = await fetcher();
        this.cache.set(key, { timestamp: Date.now(), data });
      } catch (err) {
        // Ignore background refresh errors
      } finally {
        this.inFlight.delete(key);
      }
    })();
    this.inFlight.set(key, promise);
  }

  set(key, data) {
    this.cache.set(key, { timestamp: Date.now(), data });
  }

  get(key) {
    const entry = this.cache.get(key);
    return entry ? entry.data : null;
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.inFlight.clear();
  }
}

const globalCache = new MemoryCache();

module.exports = {
  MemoryCache,
  globalCache,
};
