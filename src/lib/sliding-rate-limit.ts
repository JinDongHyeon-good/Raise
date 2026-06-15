export type RateLimitCheck = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type Bucket = { count: number; windowStart: number };

export class SlidingRateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  check(key: string): RateLimitCheck {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || now - current.windowStart >= this.windowMs) {
      this.buckets.set(key, { count: 1, windowStart: now });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
    }

    if (current.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt: current.windowStart + this.windowMs };
    }

    current.count += 1;
    this.buckets.set(key, current);
    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - current.count),
      resetAt: current.windowStart + this.windowMs,
    };
  }

  prune(maxAgeMs = 10 * 60 * 1000) {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.windowStart > maxAgeMs) {
        this.buckets.delete(key);
      }
    }
  }
}

const inFlightLocks = new Map<string, number>();
const cooldownUntil = new Map<string, number>();

export function acquireInFlightLock(key: string, ttlMs: number): boolean {
  const now = Date.now();
  const startedAt = inFlightLocks.get(key);
  if (startedAt !== undefined && now - startedAt < ttlMs) {
    return false;
  }
  inFlightLocks.set(key, now);
  return true;
}

export function releaseInFlightLock(key: string) {
  inFlightLocks.delete(key);
}

export function checkCooldown(key: string, cooldownMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const until = cooldownUntil.get(key) ?? 0;
  if (now < until) {
    return { allowed: false, retryAfterMs: until - now };
  }
  cooldownUntil.set(key, now + cooldownMs);
  return { allowed: true, retryAfterMs: 0 };
}

export function pruneStaleLocks(maxAgeMs = 5 * 60 * 1000) {
  const now = Date.now();
  for (const [key, startedAt] of inFlightLocks) {
    if (now - startedAt > maxAgeMs) {
      inFlightLocks.delete(key);
    }
  }
  for (const [key, until] of cooldownUntil) {
    if (now > until + maxAgeMs) {
      cooldownUntil.delete(key);
    }
  }
}
