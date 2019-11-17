'use strict'

const {randomBytes} = require('crypto')
const getPort = require('get-port')
const {EventEmitter} = require('events')
const {Server} = require('ws')
const {URL} = require('url')

const announce = require('./lib/announce')
const runServer = require('./lib/server')

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

	if (cfg.port !== undefined && 'number' !== typeof cfg.port) {
		throw new Error('cfg.port must be a number')
	}

	if ('number' !== typeof cfg.version) {
		throw new Error('cfg.version must be a number')
	}
	const version = cfg.version



	const out = new EventEmitter()
	const info = out.info = {id, name, version, port: null}
	out.stop = () => {}

	const clients = []
	const send = (cmd, args = []) => {
		const msg = JSON.stringify([cmd].concat(args))
		for (let client of clients) client.send(msg)
	}
	out.send = send

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

	const wsOpts = {noServer: true}
	if (cfg.origins !== undefined && !Array.isArray(cfg.origins)) {
		throw new Error('cfg.origins must be an array.')
	}
	if (
		cfg.verifyRemoteAddress !== undefined &&
		'function' !== typeof cfg.verifyRemoteAddress
	) {
		throw new Error('cfg.verifyRemoteAddress must be a function.')
	}

	wsOpts.verifyClient = ({req, origin}, cb) => {
		if (
			cfg.origins &&
			origin !== undefined &&
			!origins.includes(new URL(origin).host)
		) return cb(false, 403, 'Invalid Origin.')

		if (!cfg.verifyRemoteAddress) return cb(true)
		try {
			cfg.verifyRemoteAddress(req.socket.remoteAddress, (isValid) => {
				if (isValid) cb(true)
				else cb(false, 403, 'Invalid remote address.')
			})
		} catch (err) {
			cb(false, err.statusCode || 500, err.message)
		}
	}

	const wsServer = new Server(wsOpts)
	wsServer.on('connection', onConnection)

	const onHttpServer = (httpServer) => {
		httpServer.on('upgrade', (req, socket, head) => {
			if (wsServer.shouldHandle(req)) {
				wsServer.handleUpgrade(req, socket, head, (connection) => {
					wsServer.emit('connection', connection)
				})
			} else socket.destroy()
		})

		info.port = httpServer.address().port
		if (cfg.announce !== false) {
			const stopAnnouncing = announce(info)
			out.stop = stopAnnouncing
		}

		cb(null, info, wsServer, httpServer)
		out.emit('ready')
	}

	if (cfg.server !== undefined) {
		process.nextTick(onHttpServer, cfg.server)
	} else {
		(cfg.port !== undefined ? Promise.resolve(cfg.port) : getPort())
		.then(runServer)
		.then(onHttpServer)
		.catch((err) => {
			cb(err)
			out.emit('error', err)
		})
	}

	return out
}

module.exports = createReceiver
