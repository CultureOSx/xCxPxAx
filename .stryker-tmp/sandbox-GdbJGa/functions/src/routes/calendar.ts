// @ts-nocheck
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { usersService } from '../services/users';
import { captureRouteError, parseBody } from './utils';

export const calendarRouter = Router();

const calendarSettingsSchema = z.object({
  autoAddTickets: z.boolean().optional(),
  showPersonalEvents: z.boolean().optional(),
  deviceConnected: z.boolean().optional(),
  lastSyncedAt: z.string().optional(),
});

/** GET /api/calendar/settings */
calendarRouter.get('/calendar/settings', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const user = await usersService.getById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    return res.json(user.calendarSettings || {
      autoAddTickets: false,
      showPersonalEvents: true,
      deviceConnected: false,
    });
  } catch (err) {
    captureRouteError(err, 'GET /api/calendar/settings');
    return res.status(500).json({ error: 'Failed to fetch calendar settings' });
  }
});

/** PUT /api/calendar/settings */
calendarRouter.put('/calendar/settings', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const updates = parseBody(calendarSettingsSchema, req.body);
    
    const user = await usersService.getById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const newSettings = {
      ...(user.calendarSettings || {}),
      ...updates,
    };
    
    await usersService.update(userId, { calendarSettings: newSettings });
    
    return res.json(newSettings);
  } catch (err: any) {
    captureRouteError(err, 'PUT /api/calendar/settings');
    return res.status(500).json({ error: err.message || 'Failed to update calendar settings' });
  }
});
