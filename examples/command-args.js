'use strict'

const createReceiver = require('..')

const receiver = createReceiver({version: 2}, (err, info) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	}
})

receiver.once('ready', () => {
	let i = 0
	setInterval(() => {
		receiver.send('foo', ['bar', i++])
	}, 1 * 1000)
})
