import { addEventJob, createEventWorker, eventQueue } from '../index';

jest.mock('bullmq', () => {
  const mQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-123' })
  };
  return {
    Queue: jest.fn(() => mQueue),
    Worker: jest.fn().mockImplementation((name, processor, opts) => {
      return { name, processor, opts };
    })
  };
});

jest.mock('ioredis', () => {
  return jest.fn();
});

describe('queue pipeline index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addEventJob', () => {
    it('adds an ingest job to the queue with the provided data', async () => {
      const data = { some: 'data', timestamp: Date.now() };
      const result = await addEventJob(data);

      expect(eventQueue.add).toHaveBeenCalledWith('ingest', data);
      expect(result).toEqual({ id: 'job-123' });
    });

    it('bubbles up errors if eventQueue.add rejects', async () => {
      const error = new Error('Queue is full');
      (eventQueue.add as jest.Mock).mockRejectedValueOnce(error);

      const data = { some: 'failed data' };
      await expect(addEventJob(data)).rejects.toThrow('Queue is full');
      expect(eventQueue.add).toHaveBeenCalledWith('ingest', data);
    });
  });

  describe('createEventWorker', () => {
    it('creates a new Worker with the specified processor', () => {
      const mockProcessor = jest.fn();
      const worker = createEventWorker(mockProcessor);

      expect(worker.name).toBe('event-ingest');
      expect(worker.processor).toBe(mockProcessor);
      expect(worker.opts.connection).toBeDefined();
    });
  });
});
