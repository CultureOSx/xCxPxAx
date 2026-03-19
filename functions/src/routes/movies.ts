import { Router } from 'express';
import { moviesService } from '../services/movies';
import { wrap } from './utils';

export const moviesRouter = Router();

// Public: List movies
moviesRouter.get('/movies', wrap(async (req, res) => {
  const { city, country, genre, status } = req.query;
  const items = await moviesService.list({ 
    city: city as string, 
    country: country as string, 
    genre: genre as string,
    status: status as string
  });
  res.json(items);
}));

// Public: Get movie by ID
moviesRouter.get('/movies/:id', wrap(async (req, res) => {
  const item = await moviesService.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Movie not found' });
  res.json(item);
}));

// Private: Create movie
moviesRouter.post('/movies', wrap(async (req, res) => {
  // TODO: Add requireRole('admin' | 'organizer')
  const item = await moviesService.create(req.body);
  res.status(201).json(item);
}));

// Private: Update movie
moviesRouter.put('/movies/:id', wrap(async (req, res) => {
  const item = await moviesService.update(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'Movie not found' });
  res.json(item);
}));

// Private: Delete movie
moviesRouter.delete('/movies/:id', wrap(async (req, res) => {
  await moviesService.delete(req.params.id);
  res.json({ success: true });
}));
