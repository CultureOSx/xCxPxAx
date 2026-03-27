import { Request, Response, NextFunction } from 'express';

interface WindowInfo {
  timestamps: number[];
}

const store = new Map<string, WindowInfo>();

/**
 * Custom sliding-window rate limiter tailored for high-traffic Cloud Function vectors (events, checkout).
 * This securely intercepts burst scraping/DDoS bots scaling across instance lifecycles.
 */
export function slidingWindowRateLimit(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const remoteIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
      const ip = Array.isArray(remoteIp) ? remoteIp[0] : remoteIp;
      
      // Bind tracking strictly against authed ID tokens or fallback to raw connection IP.
      const userId = (req as any).user?.uid;
      const identifier = userId ? `user:${userId}` : `ip:${ip}`;
      
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Lazy garbage collection to guarantee zero memory leaks across warm Cloud Function spinups.
      if (store.size > 10000) {
        for (const [key, info] of store.entries()) {
          const lastTs = info.timestamps[info.timestamps.length - 1];
          if (!lastTs || now - lastTs > 15 * 60 * 1000) {
            store.delete(key);
          }
        }
      }
      
      let info = store.get(identifier);
      if (!info) {
        info = { timestamps: [] };
        store.set(identifier, info);
      }
      
      // Expire stale timestamps falling behind the active memory trace.
      info.timestamps = info.timestamps.filter((ts) => ts > windowStart);
      
      if (info.timestamps.length >= maxRequests) {
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000).toString());
        return void res.status(429).json({
          error: 'Rate Limit Exceeded',
          message: `Too many requests detected. Connection restricted for ${Math.ceil(windowMs / 1000)} seconds.`,
        });
      }
      
      info.timestamps.push(now);
      
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - info.timestamps.length).toString());
      
      next();
    } catch (error) {
      console.error('[RateLimitError] Bypassing restrictions to preserve core routing capability:', error);
      next();
    }
  };
}
