// @ts-nocheck
import { jest } from '@jest/globals';

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

// We use require to avoid compile-time checks for modules that might be missing in some environments
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

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
    expect(result.id).toEqual('mock-job-id');
  });

  it('createEventWorker should instantiate a Worker', () => {
    const processor = jest.fn();
    const worker = createEventWorker(processor);
    expect(Worker).toHaveBeenCalledWith('event-ingest', processor, expect.any(Object));
    expect(worker).toBeDefined();
  });
});
