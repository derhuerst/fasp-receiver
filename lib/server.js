'use strict'

const {createServer} = require('http')
const {Server} = require('ws')

const runServer = (port, cb) => {
	const httpServer = createServer()
	const server = new Server({server: httpServer})

	let done = false
	httpServer.once('listening', () => {
		if (done) return null
		done = true
		cb(null, server, httpServer)
	})
	httpServer.once('error', (err) => {
		if (done) return null
		done = true
		cb(err, server, httpServer)
	})

	httpServer.listen(port)
}

module.exports = runServer
