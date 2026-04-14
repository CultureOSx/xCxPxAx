/**
 * @jest-environment node
 */
import assert from 'node:assert/strict';

import { addEventJob, closeQueueConnections, createEventWorker, eventQueue } from '../index';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bullStub = require('../test-doubles/bullmq-stub.cjs') as {
  __mockQueueInstance: { add: jest.Mock; close: jest.Mock };
  __MockQueue: jest.Mock;
  __MockWorker: jest.Mock;
};
describe('queue pipeline index', () => {
  /** Captured once — do not clear MockQueue history in beforeEach or this is lost. */
  let sharedConnection: { quit: jest.Mock; disconnect: jest.Mock };

  beforeAll(() => {
    const opts = bullStub.__MockQueue.mock.calls[0]?.[1] as { connection?: typeof sharedConnection };
    assert.ok(opts?.connection, 'Queue module init should pass { connection } to BullMQ Queue');
    sharedConnection = opts.connection;
  });

  beforeEach(() => {
    bullStub.__mockQueueInstance.add.mockReset();
    bullStub.__mockQueueInstance.add.mockResolvedValue({ id: 'job-123' });
  });

  afterAll(async () => {
    await closeQueueConnections();
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
    it('creates a Worker bound to event-ingest with the given processor and shared connection', () => {
      const mockProcessor = jest.fn();
      const worker = createEventWorker(mockProcessor);

      expect(bullStub.__MockWorker).toHaveBeenCalledTimes(1);
      const [name, processor, opts] = bullStub.__MockWorker.mock.calls[0]!;
      expect(name).toBe('event-ingest');
      expect(processor).toBe(mockProcessor);
      assert.ok(opts && typeof opts === 'object');
      assert.ok('connection' in opts);
      expect(opts.connection).toBeDefined();

      expect(worker.name).toBe('event-ingest');
      expect(worker.processor).toBe(mockProcessor);
      expect(worker.opts.connection).toBeDefined();
    });

    it('passes the same Redis connection instance used by the queue', () => {
      bullStub.__MockWorker.mockClear();
      createEventWorker(jest.fn());
      const [, , opts] = bullStub.__MockWorker.mock.calls[0]!;
      expect(opts.connection).toBe(sharedConnection);
    });

    it('returns distinct worker handles for multiple processors', () => {
      bullStub.__MockWorker.mockClear();
      const a = createEventWorker(jest.fn());
      const b = createEventWorker(jest.fn());
      expect(a).not.toBe(b);
      expect(bullStub.__MockWorker).toHaveBeenCalledTimes(2);
    });
  });

  describe('closeQueueConnections', () => {
    it('closes workers, queue, and redis connection', async () => {
      const w1 = createEventWorker(jest.fn());
      const w2 = createEventWorker(jest.fn());
      await closeQueueConnections();

      expect(w1.close).toHaveBeenCalled();
      expect(w2.close).toHaveBeenCalled();
      expect(eventQueue.close).toHaveBeenCalled();
      expect(sharedConnection.quit).toHaveBeenCalled();
    });
  });
});
