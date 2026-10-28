// CTFd supplies account-scoped counts, including its timeout window. Never
// derive remaining tries from public solves, response text or browser storage.
export function getAttemptState(data) {
  const limit = data?.max_attempts;
  const attempts = data?.attempts;
  if (
    !Number.isInteger(limit) ||
    limit <= 0 ||
    !Number.isInteger(attempts) ||
    attempts <= 0
  ) {
    return { status: "", remaining: null };
  }
  const remaining = Math.max(0, limit - attempts);
  return {
    status: remaining === 0 ? "exhausted" : remaining === 1 ? "last" : "attempted",
    remaining,
  };
}

// Small, cancellable background queue. Opening/filtering a large board must not
// trigger an unbounded request burst or wait for these optional row decorations.
export function createAttemptLoader(fetchDetail, onChange) {
  const queue = new Set();
  const known = new Set();
  const active = new Map();
  const revisions = new Map();
  let stopped = false;

  function pump() {
    while (!stopped && active.size < 2 && queue.size) {
      const id = [...queue].find(id => !active.has(id));
      if (id === undefined) break;
      queue.delete(id);
      const controller = new AbortController();
      const revision = revisions.get(id) || 0;
      active.set(id, controller);
      const timer = setTimeout(() => controller.abort(), 8000);
      Promise.resolve()
        .then(() => fetchDetail(id, controller.signal))
        .then(data => {
          if (
            !stopped &&
            !controller.signal.aborted &&
            revision === (revisions.get(id) || 0)
          ) {
            known.add(id);
            onChange(id, getAttemptState(data));
          }
        })
        .catch(() => {
          // A missing count is not a failed attempt. Keep the board usable and
          // remove an obsolete warning until a later refresh succeeds.
          if (!stopped && revision === (revisions.get(id) || 0)) onChange(id, null);
        })
        .finally(() => {
          clearTimeout(timer);
          active.delete(id);
          pump();
        });
    }
  }

  return {
    request(id, refresh = false) {
      if (stopped || !Number.isSafeInteger(id) || id <= 0) return;
      if (refresh) {
        revisions.set(id, (revisions.get(id) || 0) + 1);
        known.delete(id);
        active.get(id)?.abort();
      } else if (known.has(id) || active.has(id)) return;
      queue.add(id);
      // Don't run two requests for the same row while an aborted one unwinds.
      if (!active.has(id)) pump();
    },
    remember(data) {
      const id = data?.id;
      if (stopped || !Number.isSafeInteger(id)) return;
      revisions.set(id, (revisions.get(id) || 0) + 1);
      active.get(id)?.abort();
      queue.delete(id);
      known.add(id);
      onChange(id, getAttemptState(data));
    },
    destroy() {
      stopped = true;
      queue.clear();
      for (const controller of active.values()) controller.abort();
    },
  };
}
