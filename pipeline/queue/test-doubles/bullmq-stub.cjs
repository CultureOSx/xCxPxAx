'use strict';

/** Shared queue instance so tests can spy on `eventQueue.add` after module load. */
const mockQueueInstance = {
  add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  close: jest.fn().mockResolvedValue(undefined),
};

const MockQueue = jest.fn(() => mockQueueInstance);

const MockWorker = jest.fn((name, processor, opts) => ({
  name,
  processor,
  opts,
  close: jest.fn().mockResolvedValue(undefined),
}));

module.exports = {
  Queue: MockQueue,
  Worker: MockWorker,
  __mockQueueInstance: mockQueueInstance,
  __MockQueue: MockQueue,
  __MockWorker: MockWorker,
};
