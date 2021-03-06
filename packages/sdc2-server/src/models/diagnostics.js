const moment = require('moment')
const db = require('../db')
const { sqlDateWithoutMillisecondsFormat } = require('../utils')

async function get() {
  const startMoment = moment()
    .utc()
    .subtract(1, 'day')
    .format(sqlDateWithoutMillisecondsFormat) // much faster without milliseconds

  const lastDayQuery = db
    .select(db.raw('location, type, count(*) as lastDayCount'))
    .from('measurement')
    .where('createdAt', '>=', startMoment)
    .groupBy('location', 'type')
    .as('lastDay')

  const latestIdsQuery = db
    .select(db.raw('max(id)')) // using the assumption that ids are incremental, because querying by date is far slower
    .from('measurement')
    .groupBy('location', 'type')

  const results = await db
    .select(
      'measurement.location',
      'measurement.type',
      'value',
      'createdAt',
      'lastDayCount'
    )
    .from('measurement')
    .leftJoin(lastDayQuery, function() {
      this.on('lastDay.location', '=', 'measurement.location')
      this.andOn('lastDay.type', '=', 'measurement.type')
    })
    .whereIn('id', latestIdsQuery)
    .orderBy('measurement.location')
    .orderBy('measurement.type')

  return results.map(row => {
    return {
      location: row.location,
      type: row.type,
      latestFromNow: moment(row.createdAt).fromNow(),
      latestCreatedAt: row.createdAt,
      latestvalue: row.value,
      lastDayCount: row.lastDayCount || 0,
    }
  })
}

module.exports = {
  get,
}
