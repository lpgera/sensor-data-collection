const bunyan = require('bunyan')

const developmentStreams = [
  {
    level: 'trace',
    stream: process.stdout,
  },
]

const productionStreams = [
  {
    level: 'info',
    stream: process.stdout,
  },
  {
    level: 'error',
    stream: process.stderr,
  },
]

const log = options =>
  bunyan.createLogger({
    name: 'sdc2',
    streams: (() => {
      if (process.env.NODE_ENV === 'development') {
        return developmentStreams
      }
      return productionStreams
    })(),
    ...options,
  })

module.exports = log