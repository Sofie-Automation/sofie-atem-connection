/* eslint-disable no-process-exit */
const fs = require('fs')
const path = require('path')
const { AtemSocket } = require('../../../dist/lib/atemSocket')
const { DEFAULT_PORT } = require('../../../dist')

const args = process.argv.slice(2)
if (args.length < 2) {
	console.log('Usage: node dump.js <atem-ip> <case-name>')
	console.log('eg: node dump.js 10.42.13.99 case1')
	process.exit()
}

const socket = new AtemSocket({
	debug: false,
	log: console.log,
	disableMultithreaded: true,
	address: args[0],
	port: DEFAULT_PORT,
})
socket.on('disconnect', () => {
	console.log('disconnect')
	process.exit(1)
})

const output = []

socket.on('commandsReceived', (cmds) => {
	const initComplete = cmds.find((cmd) => cmd.constructor.name === 'InitCompleteCommand')
	if (initComplete) {
		console.log('complete')
		const filePath = path.resolve(__dirname, `./${args[1]}.data`)
		fs.writeFileSync(filePath, output.join('\n'))
		process.exit(0)
	}
})

const origParse = socket._parseCommands.bind(socket)
socket._parseCommands = (payload) => {
	output.push(payload.toString('hex'))
	return origParse(payload)
}

socket.connect()
console.log('connecting')
