'use strict'

const mdns = require('mdns')

const announce = (cfg) => {
	const advertisement = mdns.createAdvertisement(mdns.tcp('fasp'), cfg.port, {
		name: cfg.name,
		txtRecord: {id: cfg.id}
	})
	advertisement.start()
}

module.exports = announce
