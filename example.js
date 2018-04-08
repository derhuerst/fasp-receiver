'use strict'

const createReceiver = require('.')

const receiver = createReceiver({
	version: 2
}, (err, info) => {
	if (err) {
		console.error(err)
		return process.exitCode = 1
	}

	console.log(info)
})

receiver.on('command', (cmd) => {
	console.log('command', cmd)
})

let i = 0
setInterval(() => {
	receiver.send('foo', ['bar', i++])
}, 1 * 1000)
