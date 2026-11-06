import "@tanstack/react-start/server-only";

export type RateLimitRule = Readonly<{ limit: number; windowMs: number }>;
export type RateLimitResult = Readonly<{
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}>;

type Bucket = { count: number; resetsAt: number };

export class LocalRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly maxBuckets = 10_000) {}

  check(key: string, rule: RateLimitRule, now = Date.now()): RateLimitResult {
    for (const [bucketKey, bucket] of this.buckets) {
      if (bucket.resetsAt <= now) this.buckets.delete(bucketKey);
    }
    if (!this.buckets.has(key) && this.buckets.size >= this.maxBuckets) {
      const oldest = [...this.buckets.entries()].sort((a, b) => a[1].resetsAt - b[1].resetsAt)[0];
      if (oldest) this.buckets.delete(oldest[0]);
    }
    const current = this.buckets.get(key);
    const bucket =
      !current || current.resetsAt <= now ? { count: 0, resetsAt: now + rule.windowMs } : current;
    bucket.count += 1;
    this.buckets.set(key, bucket);

    if (bucket.count > rule.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetsAt - now) / 1000)),
      };
    }
    return { allowed: true, remaining: rule.limit - bucket.count };
  }

  clear(): void {
    this.buckets.clear();
  }

  get size(): number {
    return this.buckets.size;
  }
}

export const localRateLimiter = new LocalRateLimiter();
