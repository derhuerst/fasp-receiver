'use strict'

const {Server} = require('ws')

const createServer = (port, cb) => {
	const server = new Server({port})

	let done = false
	server.once('listening', () => {
		if (done) return null
		done = true
		cb(null, server)
	})
	server.once('error', (err) => {
		if (done) return null
		done = true
		cb(err, server)
	})
}

module.exports = createServer
