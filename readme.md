# fasp-audio-receiver

**A receiver for the *Friendly Audio Streaming Protocol*.**

[![npm version](https://img.shields.io/npm/v/fasp-audio-receiver.svg)](https://www.npmjs.com/package/fasp-audio-receiver)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/fasp-audio-receiver.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installing

```shell
npm install fasp-audio-receiver
```


## Usage

```js
const createReceiver = require('fasp-audio-receiver')

const receiver = createReceiver({
	version: 2
}, (err, info) => {
	if (err) console.error(err)
	else console.info(info.name, 'listening on port', info.port)
})

receiver.on('command', (cmd, args) => {
	console.log('command', cmd, args)
})
receiver.send('foo', ['bar', 'baz'])
```


## Contributing

If you have a question or have difficulties using `fasp-audio-receiver`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/fasp-audio-receiver/issues).
