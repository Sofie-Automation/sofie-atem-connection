/* eslint-disable n/no-process-exit */
/**
 * A small helper script to generate a test case for the tally tests
 */

const { Atem } = require('../../../dist')
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
if (args.length < 2) {
	console.log('Usage: node dump.js <atem-ip> <case-name>')
	console.log('eg: node dump.js 10.42.13.99 case1')
	process.exit()
}

const conn = new Atem({ debug: true })
conn.on('error', console.log)

function writeJson(fileName, data) {
	const filePath = path.resolve(__dirname, fileName)
	fs.writeFileSync(filePath, JSON.stringify(data, undefined, '\t'))
}

conn.once('connected', () => {
	writeJson(`./${args[1]}-state.json`, {
		video: conn.state.video,
		inputs: conn.state.inputs,
	})
	console.log('Wrote state file')

	// All done now!
	process.exit()
})
conn.on('receivedCommand', (cmd) => {
	if (cmd.rawName === 'TlSr') {
		writeJson(`./${args[1]}-tally.json`, cmd.properties)
		console.log('Wrote tally file')
	}
})

console.log(`Connecting to "${args[0]}", for case "${args[1]}"`)
conn.connect(args[0])
