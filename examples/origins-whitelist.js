'use strict'

const createReceiver = require('..')

const receiver = createReceiver({
	version: 2,
	port: 55555,
	origins: ['localhost', 'websocket.org']
}, (err, info) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	}
})

receiver.on('command', cmd => console.log('command', cmd))
