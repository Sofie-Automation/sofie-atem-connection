/* eslint-disable @typescript-eslint/no-misused-promises */
import { Atem } from '../../dist/index.js'
import { DataTransferManager } from '../../dist/dataTransfer/index.js'
import * as fs from 'fs'

const frameBuffer = Buffer.alloc(1920 * 1080 * 4, 0)
// const wavBuffer = fs.readFileSync('./src/dataTransfer/__tests__/sampleAudio.wav')

const nb = new Atem({})
nb.on('error', () => null)

nb.on('connected', async () => {
	console.log('connected')
	const commands: any[] = []

	const procCmd = (cmd: any, dir: string): any => {
		const props = { ...cmd.properties }
		Object.keys(props).forEach((k) => {
			if (Buffer.isBuffer(props[k])) {
				const buf = props[k] as Buffer
				props[k] = { bufferLength: buf.length }
			}
		})
		return {
			name: cmd.constructor.name,
			properties: props,
			direction: dir,
		}
	}

	const transfer = new DataTransferManager()
	transfer.startCommandSending((cmds) => {
		return cmds.map(async (cmd) => {
			commands.push(procCmd(cmd, 'send'))
			return nb.sendCommand(cmd)
		})
	})
	nb.on('receivedCommands', (cmds) => {
		cmds.forEach(async (cmd): Promise<void> => {
			commands.push(procCmd(cmd, 'recv'))
			transfer.queueCommand(cmd)
		})
	})

	console.log('uploading')
	// await transfer.uploadStill(0, frameBuffer, 'some still', '')
	// await transfer.uploadAudio(1, wavBuffer, 'audio file')
	await transfer.uploadClip(1, [frameBuffer, frameBuffer, frameBuffer], 'clip file')

	console.log('uploaded')

	await new Promise((resolve) => setTimeout(resolve, 1000))

	// console.log(JSON.stringify({
	// 	sent: sentCommands,
	// 	received: receivedCommands
	// }))
	fs.writeFileSync('upload.json', JSON.stringify(commands, undefined, '\t'))

	process.exit(0)
})
nb.connect('10.42.13.98', 9910).catch((e) => {
	console.error(e)
	process.exit(0)
})
