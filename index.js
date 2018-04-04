'use strict'

const {randomBytes} = require('crypto')
const getPort = require('get-port')
const {EventEmitter} = require('events')

const announce = require('./lib/announce')
const createServer = require('./lib/server')

const isObj = o => o !== null && 'object' === typeof o && !Array.isArray(o)
const noop = () => {}

const validId = /^[a-z0-9]{16}$/g

const createReceiver = (opt = {}, cb = noop) => {
	if ('function' === typeof opt) {
		cb = opt
		opt = {}
	}
	if (!isObj(opt)) throw new Error('opt must be an object')

	if ('id' in opt) {
		if ('string' !== opt.id) throw new Error('opt.id must be a string')
		if (!validId.test(opt.id)) throw new Error('opt.id must be valid')
	}
	const id = opt.id || randomBytes(8).toString('hex')

	if ('name' in opt) {
		if ('string' !== opt.name) throw new Error('opt.name must be a string')
		if (!opt.name) throw new Error('opt.name must not be empty')
		// todo: validate that opt.name is a valid domain name
	}
	const name = opt.name || id

	let pPort
	if ('port' in opt) {
		if ('number' !== opt.port) throw new Error('opt.port must be a number')
		pPort = Promise.resolve(opt.port)
	} else pPort = getPort()

	const out = new EventEmitter()
	out.id = id
	out.name = name

	const clients = []
	out.on('status', (status) => {
		const msg = JSON.stringify(['status', status])
		for (let client of clients) client.send(msg)
	})

	const onConnection = (client) => {
		client.on('message', (msg) => {
			// ignore invalid messages
			try {
				msg = JSON.parse(msg)
			} catch (err) {
				return
			}
			if (
				Array.isArray(msg) &&
				msg.length &&
				'string' === typeof msg[0] &&
				msg[0]
			) {
				out.emit('command', msg[0], msg.slice(1))
			}
		})

		client.once('close', () => {
			const i = clients.indexOf(client)
			if (i >= 0) clients.splice(i, 1)
		})
		clients.push(client)
	}

	pPort
	.then((port) => {
		out.port = port

		createServer(port, (err, server) => {
			if (err) {
				cb(err)
				return out.emit('error', err)
			}

			out.server = server
			server.on('connection', onConnection)

			const info = {id, name, port}
			if (opt.announce !== false) announce(info)

			cb(null, info)
			out.emit('ready')
		})
	})
	.catch((err) => {
		cb(err)
		out.emit('error', err)
	})

	return out
}

module.exports = createReceiver
