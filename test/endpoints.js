process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')
var mapLimit = require('map-limit')

var server = require('../lib/server')
var testTargets = require('./inputs.json')

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('create targets', function (t) {
  const url = '/api/targets'
  mapLimit(testTargets, 1, createTarget, function (err) {
    t.falsy(err, 'no error')
    t.end()
  })

  function createTarget (target, cb) {
    const opts = { encoding: 'json', method: 'POST' }
    const stream = servertest(server(), url, opts, function (err, res) {
      t.is(res.statusCode, 201)
      cb(err)
    })
    stream.end(JSON.stringify(target))
  }
})

test.serial.cb('get all targets', function (t) {
  const url = '/api/targets'
  servertest(server(), url, { encoding: 'json', method: 'GET' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct status code')
    t.deepEqual(res.body, testTargets, 'correct targets')
    t.end()
  })
})

test.serial.cb('get target by id', function (t) {
  const url = '/api/target/1'
  servertest(server(), url, { encoding: 'json', method: 'GET' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct status code')
    t.deepEqual(res.body, testTargets[0], 'correct targets')
    t.end()
  })
})

test.serial.cb('update target', function (t) {
  const url = '/api/target/2'

  const updatedTarget = {
    ...testTargets[1],
    url: 'http://example.com'
  }

  const stream = servertest(server(), url, { encoding: 'json', method: 'POST' }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 201, 'correct status code')
    t.deepEqual(res.body, updatedTarget, 'target updated')
    t.end()
  })
  stream.end(JSON.stringify(updatedTarget))
})

test.serial.cb('should route visitor', function (t) {
  const url = '/route'
  const requestInfo = {
    geoState: 'ca',
    publisher: 'acb',
    timestamp: '2018-07-19T14:28:59.513Z'
  }

  const stream = servertest(
    server(),
    url,
    {
      encoding: 'json',
      method: 'POST'
    },
    function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 200, 'correct code')
      t.truthy(res.body.url, 'contains url')
      t.end()
    }
  )

  stream.end(JSON.stringify(requestInfo))
})

test.serial.cb('should reject visitor', function (t) {
  const url = '/route'
  const requestInfo = {
    geoState: 'ph',
    publisher: 'abc',
    timestamp: '2018-07-19T23:28:59.513Z'
  }
  const expected = { decision: 'reject' }

  const stream = servertest(
    server(),
    url,
    {
      encoding: 'json',
      method: 'POST'
    },
    function (err, res) {
      t.falsy(err, 'no error')
      t.is(res.statusCode, 200, 'correct code')
      t.deepEqual(res.body, expected, 'correct result')
      t.end()
    }
  )
  stream.end(JSON.stringify(requestInfo))
})
