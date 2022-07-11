var redisClient = require('../redis')

module.exports = {
  getTargetRequestsCounter,
  incrementTargetRequestsForTheDay
}

// get counter value by id
function getTargetRequestsCounter (data, cb) {
  const requestId = getTargetRequestId(data)

  return new Promise((resolve, reject) => {
    redisClient.get(requestId, (err, counter) => {
      if (err) return reject(err)
      resolve(counter ?? 0)
    })
  })
}

// increment target counter value by id
function incrementTargetRequestsForTheDay (data, cb) {
  const requestId = getTargetRequestId(data)

  return new Promise((resolve, reject) => {
    redisClient.incr(requestId, (err, counter) => {
      if (err) return reject(err)
      resolve(counter)
    })
  })
}

function getTargetRequestId (data) {
  const dateString = `${data.date.getUTCFullYear()}-${data.date.getUTCMonth()} - ${data.date.getUTCDate()}`
  return `REQUESTS:${data.targetId}:${dateString}`
}
