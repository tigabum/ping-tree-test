var redisClient = require('../redis')

const REDIS_KEY = 'VISITORS'

module.exports = {
  createTarget,
  getTargets,
  getSingleTarget,
  updateTarget
}

function createTarget (data, cb) {
  redisClient.hset(REDIS_KEY, data.id, JSON.stringify(data), (err) => {
    cb(err)
  })
}

function getTargets (cb) {
  redisClient.hgetall(REDIS_KEY, (err, data) => {
    if (err) return cb(err)
    if (!data) return cb(err, [])

    const targets = Object.values(data).map(JSON.parse)
    cb(err, targets)
  })
}

function getSingleTarget (targetId, cb) {
  redisClient.hget(REDIS_KEY, targetId, (err, singleTarget) => {
    if (err) return cb(err)

    const parsedSingleItem = JSON.parse(singleTarget)
    cb(err, parsedSingleItem)
  })
}

function updateTarget (targetId, data, cb) {
  redisClient.hmset(REDIS_KEY, targetId, JSON.stringify(data), cb)
}
