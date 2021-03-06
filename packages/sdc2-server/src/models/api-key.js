const db = require('../db')
const uuid = require('uuid').v4

function list() {
  return db.select('*').from('apiKey')
}

function create() {
  const token = uuid()
  const canRead = false
  const canWrite = false
  const comment = ''
  return db.insert({ token, canRead, canWrite, comment }).into('apiKey')
}

function update(id, { canRead, canWrite, comment }) {
  return db
    .table('apiKey')
    .where({ id })
    .update({ canRead, canWrite, comment })
}

function remove(id) {
  return db
    .table('apiKey')
    .where({ id })
    .delete()
}

function findByToken(token) {
  return db
    .select('*')
    .from('apiKey')
    .where({ token })
    .first()
}

module.exports = {
  list,
  create,
  update,
  remove,
  findByToken,
}
