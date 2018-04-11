'use strict'

const {createServer} = require('http')

const runServer = (port) => {
	return new Promise((resolve, reject) => {
		const server = createServer()

		server.once('listening', () => resolve(server))
		server.once('error', reject)
		server.listen(port)
	})
}

module.exports = runServer
