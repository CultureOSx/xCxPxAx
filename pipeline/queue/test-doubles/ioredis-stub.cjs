'use strict';

function createConn() {
  return {
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    on: jest.fn(),
  };
}

const IORedis = jest.fn(createConn);

module.exports = IORedis;
module.exports.default = IORedis;
