'use strict'

const createReceiver = require('..')

const receiver = createReceiver({version: 2}, (err, info) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	} else {
		console.log(info)
	}
})

receiver.on('command', cmd => console.log('command', cmd))
receiver.once('ready', () => receiver.send('foo'))
