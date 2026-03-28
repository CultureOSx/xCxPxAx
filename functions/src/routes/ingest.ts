import { Router } from 'express';
import { requireRole } from '../middleware/auth';
import { spawn } from 'child_process';

export const ingestRouter = Router();

// POST /api/ingest
// { url: string }
ingestRouter.post('/', requireRole('admin'), async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid url' });
  }
  // Spawn the pipeline process (Node.js child process)
  const proc = spawn('node', ['pipeline/pipeline.js', url], {
    cwd: process.cwd(),
    stdio: 'ignore',
    detached: true,
  });
  proc.unref();
  return res.json({ status: 'enqueued', url });
});
