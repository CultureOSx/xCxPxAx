import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authenticate } from './middleware/auth';
import { getFirebaseProjectId } from './routes/utils';

// Routers
import { authRouter } from './routes/auth';
import { ticketsRouter } from './routes/tickets';
import { createEventsRouter } from './routes/events';
import { createStripeRouter } from './routes/stripe';
import { createIndigenousRouter } from './routes/indigenous';
import { usersRouter } from './routes/users';
import { locationsRouter } from './routes/locations';
import { profilesRouter } from './routes/profiles';
import { activitiesRouter } from './routes/activities';
import { moviesRouter } from './routes/movies';
import { shoppingRouter } from './routes/shopping';
import { restaurantsRouter } from './routes/restaurants';
import { councilRouter } from './routes/council';
import { adminRouter } from './routes/admin';
import { miscRouter } from './routes/misc';
import { searchRouter } from './routes/search';
import { socialRouter } from './routes/social';
import { discoveryRouter } from './routes/discovery';
import { perksRouter } from './routes/perks';
import { updatesRouter } from './routes/updates';
import { feedRouter } from './routes/feed';
import { importRouter } from './routes/import';
import { membershipRouter } from './routes/membership';
import { citiesRouter } from './routes/cities';
import { rewardsRouter } from './routes/rewards';
import { ingestRouter } from './routes/ingest';
import { calendarRouter } from './routes/calendar';
import { offeringsRouter } from './routes/offerings';
import { uploadsRouter } from './routes/uploads';

export const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Explicit allowlist — credentials mode requires an origin function (not `true`)
const LOCAL_DEV_PORTS = [8081, 8082, 8083, 8084, 8085, 19006, 19000, 3000, 5000, 5173, 4173];
const LOCAL_DEV_HOSTS = ['localhost', '127.0.0.1'] as const;
const LOCAL_DEV_ORIGINS = LOCAL_DEV_HOSTS.flatMap((host) =>
  LOCAL_DEV_PORTS.flatMap((port) => [`http://${host}:${port}`, `https://${host}:${port}`]),
);

/** Match browser Origin for loopback — any port (Expo web, Vite, etc.) */
const LOCALHOST_ORIGIN_ONLY =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/;

const CORS_EXTRA = (process.env.CORS_EXTRA_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const firebaseProjectId = getFirebaseProjectId();
const firebaseHostingOrigins: RegExp[] = firebaseProjectId
  ? [
      new RegExp(`^https://${escapeRegExp(firebaseProjectId)}\\.web\\.app$`),
      new RegExp(`^https://${escapeRegExp(firebaseProjectId)}\\.firebaseapp\\.com$`),
      new RegExp(`^https://[\\w-]+--${escapeRegExp(firebaseProjectId)}\\.web\\.app$`), // Firebase preview channels
    ]
  : [
      /^https:\/\/[\w-]+\.web\.app$/,
      /^https:\/\/[\w-]+\.firebaseapp\.com$/,
    ];

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  // Production
  'https://culturepass.app',
  'https://www.culturepass.app',
  /^https:\/\/[\w-]+\.culturepass\.app$/,          // preview/staging subdomains
  'https://culturekerala.com',
  'https://www.culturekerala.com',
  /^https:\/\/[\w-]+\.culturekerala\.com$/,
  // EAS/Expo OTA
  /^https:\/\/[\w-]+\.expo\.dev$/,
  // Hosted previews (set CORS_EXTRA_ORIGINS for private URLs)
  /^https:\/\/[\w-]+\.vercel\.app$/,
  /^https:\/\/[\w-]+\.netlify\.app$/,
  /^https:\/\/[\w-]+\.ngrok(-free)?\.app$/,
  ...firebaseHostingOrigins,
  // Local development (http + https — Expo / Vite may use TLS locally)
  ...LOCAL_DEV_ORIGINS,
  // IPv6 loopback (also covered by isAllowedOrigin LOCALHOST_ORIGIN_ONLY check)
  /^https?:\/\/\[::1\]:\d+$/,
  // Local network development (Expo on LAN; optional https tunnels)
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
  /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}:\d+$/,
  // *.local mDNS hostnames (common with Expo dev clients)
  /^https?:\/\/[\w-]+\.local:\d+$/,
  ...CORS_EXTRA,
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // non-browser clients (Postman, React Native native)
  if (LOCALHOST_ORIGIN_ONLY.test(origin)) return true;
  return ALLOWED_ORIGINS.some(allowed =>
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin),
  );
}

const corsOptions: cors.CorsOptions = {
  // With credentials: true, browsers require Access-Control-Allow-Origin to echo the
  // request Origin (not `*`). Reflect the string explicitly.
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, false);
      return;
    }
    if (isAllowedOrigin(origin)) {
      callback(null, origin);
      return;
    }
    const err = new Error(`CORS: Origin '${origin}' not allowed`) as Error & { status?: number };
    err.status = 403;
    callback(err);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Language',
    'If-None-Match',
  ],
  maxAge: 86400, // preflight cache 24 h
};

// --- Middleware ---
app.disable('x-powered-by');

/**
 * Preflight must succeed with CORS headers before helmet/json/rate-limit.
 * If `allowedHeaders` in cors() omits a header the browser lists in
 * Access-Control-Request-Headers, the preflight fails and Chrome reports
 * "No 'Access-Control-Allow-Origin'" (misleading). For allowlisted origins,
 * echo the requested header list so Expo / devtools / future clients never break.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'OPTIONS') {
    next();
    return;
  }
  const origin = req.headers.origin;
  if (typeof origin !== 'string' || !isAllowedOrigin(origin)) {
    next();
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  const requestedHeaders = req.headers['access-control-request-headers'];
  if (typeof requestedHeaders === 'string' && requestedHeaders.length > 0) {
    res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
  } else {
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Accept-Language, If-None-Match',
    );
  }
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
  res.status(204).end();
});

// CORS before helmet/json so every response (including errors) gets ACAO when origin matches
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Firebase Hosting rewrites
  contentSecurityPolicy: false, // CSP is managed at the Hosting layer
}));
app.use(express.json({ limit: '2mb' }));
// Do not count CORS preflight toward the limit — a burst of OPTIONS can otherwise
// return 429 without CORS headers and the browser reports a misleading CORS failure.
app.use(
  rateLimit({
    windowMs: 60000,
    max: 200,
    message: 'Too many requests, please try again later.',
    skip: (req) => req.method === 'OPTIONS',
  }),
);
app.use(authenticate);

// ─── Request logging ──────────────────────────────────────────────────────────
// Structured one-liner per request — visible in Firebase Cloud Logging.
app.use((req, _res, next) => {
  const uid = (req as Request & { user?: { id?: string } }).user?.id ?? '-';
  console.log(JSON.stringify({
    method: req.method,
    path: req.path,
    uid,
    ip: req.ip,
    ua: req.headers['user-agent']?.slice(0, 80) ?? '-',
    t: new Date().toISOString(),
  }));
  next();
});

// --- Health Check ---
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── API Version header ───────────────────────────────────────────────────────
app.use((_req, res, next) => { res.setHeader('X-Api-Version', '1'); next(); });

// --- Routes ---
// Routes are mounted at:
//   /             — direct Cloud Function invocation (legacy)
//   /api/         — Firebase Hosting rewrite (current standard)
//   /v1/          — versioned alias (forward-compatible)
//   /api/v1/      — versioned alias via Hosting rewrite
//
// New clients should target /api/v1/*. Old clients at /api/* keep working.
// When a breaking change is needed, mount the new router at /v2/ only.
const mount = (path: string, router: any) => {
  app.use(path, router);
  app.use(`/api${path}`, router);
  app.use(`/v1${path}`, router);
  app.use(`/api/v1${path}`, router);
};

mount('/', authRouter);
mount('/', ticketsRouter);
mount('/', usersRouter);
mount('/', locationsRouter);
mount('/', profilesRouter);
mount('/', activitiesRouter);
mount('/', moviesRouter);
mount('/', shoppingRouter);
mount('/', restaurantsRouter);
mount('/', councilRouter);
mount('/', adminRouter);
mount('/', miscRouter);
mount('/', searchRouter);
mount('/', socialRouter);
mount('/', discoveryRouter);
mount('/', perksRouter);
mount('/', updatesRouter);
mount('/', feedRouter);
mount('/', importRouter);
mount('/', membershipRouter);
mount('/', rewardsRouter);
mount('/', citiesRouter);
mount('/', ingestRouter);
mount('/', calendarRouter);
mount('/', offeringsRouter);
mount('/', uploadsRouter);
app.use('/api/ingest', ingestRouter);

// Special handling for factory routers
const eventsRouter = createEventsRouter();
app.use('/', eventsRouter);
app.use('/api', eventsRouter);
app.use('/v1', eventsRouter);
app.use('/api/v1', eventsRouter);

const indigenousRouter = createIndigenousRouter();
app.use('/', indigenousRouter);
app.use('/api', indigenousRouter);
app.use('/v1', indigenousRouter);
app.use('/api/v1', indigenousRouter);

app.use(createStripeRouter());

// OPTIONS that did not match an earlier handler (should be rare) — respond 204 + CORS
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') {
    next();
    return;
  }
  const origin = req.headers.origin;
  if (typeof origin === 'string' && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    const requestedHeaders = req.headers['access-control-request-headers'];
    if (typeof requestedHeaders === 'string' && requestedHeaders.length > 0) {
      res.setHeader('Access-Control-Allow-Headers', requestedHeaders);
    } else {
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept, Accept-Language, If-None-Match',
      );
    }
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Vary', 'Origin');
    res.status(204).end();
    return;
  }
  next();
});

// Default 404 — include CORS when Origin is allowlisted so the browser does not
// report a misleading "No Access-Control-Allow-Origin" (e.g. stray OPTIONS).
app.use((req, res) => {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.status(404).json({ error: 'Not Found' });
});

// Error handler — never exposes internal details in production
app.use((err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  const status = err.status ?? 500;
  console.error('[App Error]:', err);
  const safe = status < 500;  // 4xx errors are safe to surface to clients
  res.status(status).json({
    error: safe ? err.message : 'Internal Server Error',
  });
});
