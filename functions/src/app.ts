import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
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
  'http://localhost:19006',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:19006',
  'http://127.0.0.1:3000',
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
app.use(express.json({ limit: '2mb' }));
// Apply CORS before all routes — cors() middleware handles OPTIONS preflight automatically
app.use(cors(corsOptions));
app.use(rateLimit({ windowMs: 60000, max: 200, message: 'Too many requests, please try again later.' }));
app.use(authenticate);

// --- Health Check ---
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// --- Routes ---
app.use('/api', authRouter);
app.use('/api', ticketsRouter);
app.use('/api', usersRouter);
app.use('/api', locationsRouter);
app.use('/api', profilesRouter);
app.use('/api', activitiesRouter);
app.use('/api', moviesRouter);
app.use('/api', councilRouter);
app.use('/api', adminRouter);
app.use('/api', miscRouter);
app.use('/api', searchRouter);
app.use('/api', socialRouter);
app.use('/api', discoveryRouter);
app.use('/api', perksRouter);
app.use('/api', updatesRouter);

app.use('/api', createEventsRouter());

app.use(createStripeRouter());

app.use('/api', createIndigenousRouter());

// Default 404
app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.path }));

// Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[App Error]:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});
