import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { shoppingService } from '../services/shopping';
import { wrap, captureRouteError } from './utils';

export const shoppingRouter = Router();

// Public: List shops
shoppingRouter.get('/shopping', wrap(async (req, res) => {
  try {
    const { city, country, category, status } = req.query;
    const items = await shoppingService.list({
      city: city as string,
      country: country as string,
      category: category as string,
      status: status as string,
    });
    res.json(items);
  } catch (err) {
    captureRouteError(err, 'GET /shopping');
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
}));

// Public: Get shop by ID
shoppingRouter.get('/shopping/:id', wrap(async (req, res) => {
  try {
    const item = await shoppingService.getById(String(req.params.id));
    if (!item) return res.status(404).json({ error: 'Shop not found' });
    res.json(item);
  } catch (err) {
    captureRouteError(err, 'GET /shopping/:id');
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
}));

// Private: Create shop (organizer or admin only)
shoppingRouter.post('/shopping', requireAuth, requireRole('organizer', 'admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    const item = await shoppingService.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    captureRouteError(err, 'POST /shopping');
    res.status(500).json({ error: 'Failed to create shop' });
  }
}));

// Private: Update shop (organizer or admin only)
shoppingRouter.put('/shopping/:id', requireAuth, requireRole('organizer', 'admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    const item = await shoppingService.update(String(req.params.id), req.body);
    if (!item) return res.status(404).json({ error: 'Shop not found' });
    res.json(item);
  } catch (err) {
    captureRouteError(err, 'PUT /shopping/:id');
    res.status(500).json({ error: 'Failed to update shop' });
  }
}));

// Private: Delete shop (admin only)
shoppingRouter.delete('/shopping/:id', requireAuth, requireRole('admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    await shoppingService.delete(String(req.params.id));
    res.json({ success: true });
  } catch (err) {
    captureRouteError(err, 'DELETE /shopping/:id');
    res.status(500).json({ error: 'Failed to delete shop' });
  }
}));

// Private: Set shop promoted status (admin only)
shoppingRouter.post('/shopping/:id/promote', requireAuth, requireRole('admin', 'platformAdmin'), wrap(async (req, res) => {
  try {
    const { isPromoted } = req.body as { isPromoted: boolean };
    const item = await shoppingService.setPromoted(String(req.params.id), Boolean(isPromoted));
    if (!item) return res.status(404).json({ error: 'Shop not found' });
    res.json(item);
  } catch (err) {
    captureRouteError(err, 'POST /shopping/:id/promote');
    res.status(500).json({ error: 'Failed to update shop promotion' });
  }
}));
