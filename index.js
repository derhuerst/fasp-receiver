'use strict'

const {randomBytes} = require('crypto')
const getPort = require('get-port')
const {EventEmitter} = require('events')

const announce = require('./lib/announce')
const createServer = require('./lib/server')

const isObj = o => o !== null && 'object' === typeof o && !Array.isArray(o)
const noop = () => {}

const validId = /^[a-z0-9]{16}$/g

const createReceiver = (cfg = {}, cb = noop) => {
	if (!isObj(cfg)) throw new Error('cfg must be an object')

	if (cfg.id !== undefined) {
		if ('string' !== typeof cfg.id) {
			throw new Error('cfg.id must be a string')
		}
		if (!validId.test(cfg.id)) throw new Error('cfg.id must be valid')
	}
	const id = cfg.id || randomBytes(8).toString('hex')

	if (cfg.name !== undefined) {
		if ('string' !== typeof cfg.name) {
			throw new Error('cfg.name must be a string')
		}
		if (!cfg.name) throw new Error('cfg.name must not be empty')
		// todo: validate that cfg.name is a valid domain name
	}
	const name = cfg.name || id

	let pPort
	if (cfg.port !== undefined) {
		if ('number' !== typeof cfg.port) {
			throw new Error('cfg.port must be a number')
		}
		pPort = Promise.resolve(cfg.port)
	} else pPort = getPort()

	if ('number' !== typeof cfg.version) {
		throw new Error('cfg.version must be a number')
	}
	const version = cfg.version

	const out = new EventEmitter()
	out.id = id
	out.name = name
	out.version = version

	const clients = []
	const sendStatus = (status) => {
		const msg = JSON.stringify(['status', status])
		for (let client of clients) client.send(msg)
	}
	out.sendStatus = sendStatus

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

			const info = {id, name, port, version}
			if (cfg.announce !== false) announce(info)

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
