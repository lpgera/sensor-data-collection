const KoaRouter = require('@koa/router')
const moment = require('moment')
const config = require('config')
const jwt = require('jsonwebtoken')
const Joi = require('@hapi/joi')
const location = require('../models/location')
const measurement = require('../models/measurement')
const apiKey = require('../models/api-key')
const diagnostics = require('../models/diagnostics')
const { validateParams, validateRequestBody } = require('../validator')
const pushBullet = require('../pushBullet')

const router = new KoaRouter()

router.post('/login', context => {
  const { username, password } = context.request.body
  const users = config.get('auth.users')
  if (
    users.some(user => user.username === username && user.password === password)
  ) {
    context.body = {
      token: jwt.sign({ username }, config.get('auth.tokenSecret'), {
        expiresIn: config.get('auth.sessionTimeoutSeconds'),
      }),
    }
    return
  }
  context.status = 403
})

router.use(async (context, next) => {
  const token = context.headers['x-authorization-token']
  try {
    jwt.verify(token, config.get('auth.tokenSecret'))
  } catch (err) {
    context.status = 401
    return
  }
  await next()
})

router.get('/location', async context => {
  const locations = await location.get()
  const staleThreshold = config.get('location.staleThreshold')
  context.body = locations.map(l => {
    return {
      ...l,
      isStale: moment(l.latestCreatedAt).isBefore(
        moment().subtract(staleThreshold)
      ),
    }
  })
})

router.get(
  '/measurement/location/:location/type/:type/from/:from/to/:to/aggregation/:aggregation',
  validateParams(
    Joi.object({
      location: Joi.string()
        .max(64)
        .required(),
      type: Joi.string()
        .max(64)
        .required(),
      from: Joi.string()
        .isoDate()
        .required(),
      to: Joi.string()
        .isoDate()
        .required(),
      aggregation: Joi.string()
        .valid('average', 'minimum', 'maximum', 'count', 'sum')
        .required(),
    })
  ),
  async context => {
    const { location, type, from, to, aggregation } = context.params
    const measurements = await measurement.get({
      location,
      type,
      from: moment.utc(from),
      to: moment.utc(to),
      aggregation,
    })
    context.body = measurements.map(item => {
      return [
        moment(item.createdAt)
          .startOf('minute')
          .valueOf(),
        item.value,
      ]
    })
  }
)

router.get(
  '/measurement/location/:location/type/:type',
  validateParams(
    Joi.object({
      location: Joi.string()
        .max(64)
        .required(),
      type: Joi.string()
        .max(64)
        .required(),
    })
  ),
  async context => {
    const { location, type } = context.params
    const measurements = await measurement.get({
      location,
      type,
      from: moment.unix(0),
      to: moment(),
    })
    context.body = measurements.map(item => {
      return [moment(item.createdAt).valueOf(), item.value]
    })
  }
)

router.get('/api-key', async context => {
  context.body = await apiKey.list()
})

router.post('/api-key', async context => {
  await apiKey.create()
  context.body = await apiKey.list()
})

router.patch(
  '/api-key/:id',
  validateParams(
    Joi.object({
      id: Joi.string()
        .max(64)
        .required(),
    })
  ),
  validateRequestBody(
    Joi.object({
      canRead: Joi.boolean(),
      canWrite: Joi.boolean(),
      comment: Joi.string()
        .allow('')
        .max(255),
    })
  ),
  async context => {
    const { id } = context.params
    const { canRead, canWrite, comment } = context.request.body
    await apiKey.update(id, { canRead, canWrite, comment })
    context.body = await apiKey.list()
  }
)

router.delete(
  '/api-key/:id',
  validateParams(
    Joi.object({
      id: Joi.string()
        .max(64)
        .required(),
    })
  ),
  async context => {
    const { id } = context.params
    await apiKey.remove(id)
    context.body = await apiKey.list()
  }
)

router.get('/diagnostics', async context => {
  context.body = await diagnostics.get()
})

router.post('/check-locations', async context => {
  const locations = await location.get()
  const staleThreshold = config.get('location.staleThreshold')
  const warningThreshold = config.get('location.warningThreshold')
  const nonStaleLocations = locations.filter(l =>
    moment(l.latestCreatedAt).isAfter(moment().subtract(staleThreshold))
  )
  const warnings = nonStaleLocations.filter(l =>
    moment(l.latestCreatedAt).isBefore(moment().subtract(warningThreshold))
  )
  await pushBullet.sendWarnings(warnings)
  context.body = null
})

module.exports = router
