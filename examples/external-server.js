'use strict'

const {createServer} = require('http')

const createReceiver = require('..')

const server = createServer()
server.listen(55555)

const receiver = createReceiver({server, version: 2}, (err, info) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	} else {
		console.log(info)
	}
})

receiver.on('command', cmd => console.log('command', cmd))
