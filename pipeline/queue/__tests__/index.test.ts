// @ts-nocheck
import { jest } from '@jest/globals';

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

jest.mock(
  'bullmq',
  () => ({
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    })),
    Worker: jest.fn().mockImplementation(() => ({})),
  }),
  { virtual: true }
);

jest.mock(
  'ioredis',
  () => {
    return jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      quit: jest.fn(),
      disconnect: jest.fn(),
    }));
  },
  { virtual: true }
);
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  })),
  Worker: jest.fn().mockImplementation(() => ({})),
}), { virtual: true });

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn(),
  }));
}, { virtual: true });

import { createEventWorker, addEventJob, eventQueue } from '../index.js';

describe('pipeline queue index.js', () => {
  it('should initialize connection and queue', () => {
    expect(eventQueue).toBeDefined();
    expect(IORedis).toHaveBeenCalled();
    expect(Queue).toHaveBeenCalledWith('event-ingest', expect.any(Object));
  });

  it('addEventJob should call eventQueue.add', async () => {
    const data = { foo: 'bar' };
    const result = await addEventJob(data);
    expect(eventQueue.add).toHaveBeenCalledWith('ingest', data);
    expect((result as any).id).toEqual('mock-job-id');
  });

  it('createEventWorker should instantiate a Worker', () => {
    const processor = jest.fn();
    const worker = createEventWorker(processor as any);
    expect(Worker).toHaveBeenCalledWith(
      'event-ingest',
      processor,
      expect.objectContaining({ connection: expect.anything() })
    );
    expect(worker).toBeDefined();
  });
});
