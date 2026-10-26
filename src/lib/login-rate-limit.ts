export const LOGIN_MAX_FAILURES = 10;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

type LoginFailureState = {
  count: number;
  resetAt: number;
};

const PRUNE_THRESHOLD = 5000;

const failures = new Map<string, LoginFailureState>();

function pruneExpired(now: number) {
  for (const [key, state] of failures) {
    if (now >= state.resetAt) {
      failures.delete(key);
    }
  }
}

function readState(key: string, now: number): LoginFailureState | undefined {
  const state = failures.get(key);

  if (!state) {
    return undefined;
  }

  if (now >= state.resetAt) {
    failures.delete(key);
    return undefined;
  }

  return state;
}

export function isLoginBlocked(key: string, now = Date.now()): boolean {
  const state = readState(key, now);
  return state !== undefined && state.count >= LOGIN_MAX_FAILURES;
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  if (failures.size >= PRUNE_THRESHOLD) {
    pruneExpired(now);
  }

  const state = readState(key, now);

  if (!state) {
    failures.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  if (state.count < LOGIN_MAX_FAILURES) {
    state.count += 1;
  }
}

export function clearLoginFailures(key: string): void {
  failures.delete(key);
}
