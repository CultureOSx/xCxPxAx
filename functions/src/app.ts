import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authenticate } from './middleware/auth';

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



export const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Explicit allowlist — credentials mode requires an origin function (not `true`)
const ALLOWED_ORIGINS: (string | RegExp)[] = [
  // Production
  'https://culturepass.app',
  'https://www.culturepass.app',
  /^https:\/\/[\w-]+\.culturepass\.app$/,          // preview/staging subdomains
  // EAS/Expo OTA
  /^https:\/\/[\w-]+\.expo\.dev$/,
  // Local development
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8083',
  'http://localhost:8084',
  'http://localhost:8085',
  'http://localhost:19006',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'http://127.0.0.1:8083',
  'http://127.0.0.1:8084',
  'http://127.0.0.1:8085',
  'http://127.0.0.1:19006',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // non-browser clients (Postman, React Native native)
  return ALLOWED_ORIGINS.some(allowed =>
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin),
  );
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // preflight cache 24 h
};

// --- Middleware ---
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Firebase Hosting rewrites
  contentSecurityPolicy: false, // CSP is managed at the Hosting layer
}));
app.use(express.json({ limit: '2mb' }));
// Apply CORS before all routes — cors() middleware handles OPTIONS preflight automatically
app.use(cors(corsOptions));
app.use(rateLimit({ windowMs: 60000, max: 200, message: 'Too many requests, please try again later.' }));
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

// Default 404
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

// Error handler — never exposes internal details in production
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? 500;
  console.error('[App Error]:', err);
  const safe = status < 500;  // 4xx errors are safe to surface to clients
  res.status(status).json({
    error: safe ? err.message : 'Internal Server Error',
  });
});
