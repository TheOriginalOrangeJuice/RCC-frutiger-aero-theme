// A retry supersedes the previous request, including its delay timer. Keep the
// last successful data in the caller; a network failure is never an empty result.
export function scoreboardState() {
  let generation = 0;
  let delayTimer;
  return {
    loaded: false,
    loading: true,
    delayed: false,
    failed: false,
    async request(fetchData, commit) {
      const current = ++generation;
      const isCurrent = () => current === generation;
      clearTimeout(delayTimer);
      this.loading = true;
      this.delayed = false;
      this.failed = false;
      delayTimer = setTimeout(() => {
        if (isCurrent()) this.delayed = true;
      }, 15000);
      try {
        const result = await fetchData();
        if (!isCurrent()) return;
        await commit(result, isCurrent);
        if (isCurrent()) this.loaded = true;
      } catch {
        if (isCurrent()) this.failed = true;
      } finally {
        if (isCurrent()) {
          clearTimeout(delayTimer);
          this.loading = false;
          this.delayed = false;
        }
      }
    },
    cancelRequest() {
      generation++;
      clearTimeout(delayTimer);
    },
  };
}
