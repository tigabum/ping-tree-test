var body = require('body/json')
var send = require('send-data/json')
var Targets = require('./models/targets')
var RouteRequestHandler = require('./models/routeRequestsHelper')

module.exports = {
  createTarget,
  getTargets,
  getSingleTarget,
  updateTarget,
  Route
}

// create a target
function createTarget (req, res, opts, cb) {
  body(req, res, (err, data) => {
    if (err) return cb(err)

    Targets.createTarget(data, (err) => {
      if (err) return cb(err)

      send(req, res, { body: data, statusCode: 201 })
    })
  })
}

// get all targets
function getTargets (req, res, opts, cb) {
  Targets.getTargets((err, allTargets) => {
    if (err) return cb(err)

    send(req, res, { body: allTargets, statusCode: 200 })
  })
}

// get a single target by id
function getSingleTarget (req, res, opts, cb) {
  const { id: targetId } = opts.params
  Targets.getSingleTarget(targetId, (err, singleTarget) => {
    if (err) return cb(err)

    if (!singleTarget) {
      send(req, res, { body: { error: 'Target Not Found' }, statusCode: 404 })
      return
    }
    send(req, res, { body: singleTarget, statusCode: 200 })
  })
}

function updateTarget (req, res, opts, cb) {
  const { id: targetId } = opts.params
  body(req, res, (err, data) => {
    if (err) return cb(err)
    data.id = targetId
    Targets.updateTarget(targetId, data, (err) => {
      if (err) return cb(err)
      send(req, res, { body: data, statusCode: 201 })
    })
  })
}

function Route (req, res, opts, cb) {
  body(req, res, (err, visitor) => {
    if (err) return cb(err)
    Targets.getTargets(async (err, allTargets) => {
      if (err) return cb(err)
      const hourString = new Date(visitor.timestamp).getUTCHours().toString()

      // filter based on geoState and hour
      const validTargets = allTargets.filter((target) => {
        const validSingleTarget = target.accept.geoState.$in.includes(visitor.geoState) && target.accept.hour.$in.includes(hourString)
        return validSingleTarget
      })

      // no target satisfies the request condition
      if (validTargets.length === 0) {
        send(req, res, { body: { decision: 'reject' }, statusCode: 200 })
        return
      }

      // sorting based on highest value
      validTargets.sort((a, b) => {
        return parseFloat(a.value) < parseFloat(b.value) ? -1 : 1
      })

      const now = new Date()

      for (const target of validTargets) {
        const requestData = {
          targetId: target.id,
          date: now
        }

        const counter = await RouteRequestHandler.getTargetRequestsCounter(requestData)

        const maxAllowedRequests = parseInt(target.maxAcceptsPerDay)
        const canProcessRequest = counter < maxAllowedRequests

        if (canProcessRequest) {
          await RouteRequestHandler.incrementTargetRequestsForTheDay(requestData)
          send(req, res, { body: { url: target.url }, statusCode: 200 })
          return
        }
      }
      send(req, res, { body: { decision: 'reject' }, statusCode: 200 })
    })
  })
}
