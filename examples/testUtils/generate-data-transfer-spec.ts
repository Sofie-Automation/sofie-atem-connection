/* eslint-disable n/no-process-exit */
import { Atem } from '../../dist/index.js'
import { DataTransferManager } from '../../dist/dataTransfer/index.js'
import * as fs from 'fs'
import { generateUploadBufferInfo } from '../../dist/dataTransfer/dataTransferUploadBuffer.js'
import { Enums } from 'atem-connection'

// const wavBuffer = fs.readFileSync('./src/dataTransfer/__tests__/sampleAudio.wav')

const uploadBuffer = generateUploadBufferInfo(
	Buffer.alloc(1920 * 1080 * 4, 0),
	{
		width: 1920,
		height: 1080,
		format: Enums.VideoFormat.HD1080,
	},
	false
)

const nb = new Atem({})
nb.on('error', () => null)

nb.on('connected', () => {
	console.log('connected')

	Promise.resolve()
		.then(async () => {
			const commands: any[] = []

			const procCmd = (cmd: any, dir: string): any => {
				const props = { ...cmd.properties }
				Object.keys(props).forEach((k) => {
					if (Buffer.isBuffer(props[k])) {
						const buf = props[k]
						props[k] = { bufferLength: buf.length }
					}
				})
				return {
					name: cmd.constructor.name,
					properties: props,
					direction: dir,
				}
			}

			const transfer = new DataTransferManager(async (cmds) => {
				await Promise.all(
					cmds.map(async (cmd) => {
						commands.push(procCmd(cmd, 'send'))
						return nb.sendCommand(cmd)
					})
				)
			})
			transfer.startCommandSending()
			nb.on('receivedCommands', (cmds) => {
				cmds.forEach((cmd) => {
					commands.push(procCmd(cmd, 'recv'))
					transfer.queueHandleCommand(cmd)
				})
			})

			console.log('uploading')
			// await transfer.uploadStill(0, frameBuffer, 'some still', '')
			// await transfer.uploadAudio(1, wavBuffer, 'audio file')

			await transfer.uploadClip(1, [uploadBuffer, uploadBuffer, uploadBuffer], 'clip file')

			console.log('uploaded')

			await new Promise((resolve) => setTimeout(resolve, 1000))

			// console.log(JSON.stringify({
			// 	sent: sentCommands,
			// 	received: receivedCommands
			// }))
			fs.writeFileSync('upload.json', JSON.stringify(commands, undefined, '\t'))

			process.exit(0)
		})
		.catch((e) => {
			console.error(e)
			process.exit(1)
		})
})
nb.connect('10.42.13.98', 9910).catch((e) => {
	console.error(e)
	process.exit(0)
})
