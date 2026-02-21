import * as DataTransferCommands from '../../commands/DataTransfer/index.js'
import { readFileSync } from 'fs'
import * as path from 'path'
import { DataTransferManager } from '../index.js'
import { Commands, UploadBufferInfo } from '../../index.js'
import { generateHashForBuffer } from '../dataTransferUploadBuffer.js'

function specToCommandClass(spec: any): Commands.IDeserializedCommand | undefined {
	for (const commandName in DataTransferCommands) {
		if (spec.name === commandName) {
			const cmdCons = (DataTransferCommands as any)[commandName]
			const cmd = new cmdCons(spec.properties)
			if ('_properties' in cmd) {
				cmd._properties = spec.properties
			} else {
				cmd.properties = spec.properties
			}
			return cmd
		}
	}
	return undefined
}

function mangleCommand(cmd: any, dir: string): any {
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

function runDataTransferTest(spec: any): DataTransferManager {
	const manager = new DataTransferManager(async (cmds) => {
		for (const rawCmd of cmds) {
			const expectedCmd = spec.shift()
			const gotCmd = mangleCommand(rawCmd, 'send')
			expect(gotCmd).toEqual(expectedCmd)

			while (spec.length > 0) {
				if (spec[0].direction !== 'recv') break
				const nextCmd = spec.shift()
				const nextCmd2 = specToCommandClass(nextCmd)
				if (!nextCmd2) throw new Error(`Failed specToCommandClass ${nextCmd.name}`)
				manager.queueHandleCommand(nextCmd2)
			}
		}
	})
	manager.startCommandSending(true)
	return manager
}

test('Still upload', async () => {
	const spec: any[] = JSON.parse(readFileSync(path.join(__dirname, './upload-still-sequence.json')).toString())

	const newBuffer = Buffer.alloc(1920 * 1080 * 4, 0)
	const wrappedBuffer: UploadBufferInfo = {
		encodedData: newBuffer,
		rawDataLength: newBuffer.length,
		isRleEncoded: false,
		hash: generateHashForBuffer(newBuffer),
	}

	const manager = runDataTransferTest(spec)
	await manager.uploadStill(2, wrappedBuffer, 'some still', '')

	await new Promise((resolve) => setTimeout(resolve, 200))

	// Nothing should be left by this point
	expect(spec).toHaveLength(0)
})

test('Wav upload', async () => {
	const spec: any[] = JSON.parse(readFileSync(path.join(__dirname, './upload-wav-sequence.json')).toString())

	const newBuffer = readFileSync(path.join(__dirname, './sampleAudio.wav'))

	const manager = runDataTransferTest(spec)
	await manager.uploadAudio(1, newBuffer, 'audio file')

	await new Promise((resolve) => setTimeout(resolve, 200))

	// Nothing should be left by this point
	expect(spec).toHaveLength(0)
})

test('clip upload', async () => {
	const spec: any[] = JSON.parse(readFileSync(path.join(__dirname, './upload-clip-sequence.json')).toString())

	const newBuffer = Buffer.alloc(1920 * 1080 * 4, 0)
	const wrappedBuffer: UploadBufferInfo = {
		encodedData: newBuffer,
		rawDataLength: newBuffer.length,
		isRleEncoded: false,
		hash: generateHashForBuffer(newBuffer),
	}

	const manager = runDataTransferTest(spec)
	await manager.uploadClip(1, [wrappedBuffer, wrappedBuffer, wrappedBuffer], 'clip file')

	await new Promise((resolve) => setTimeout(resolve, 200))

	// Nothing should be left by this point
	expect(spec).toHaveLength(0)
}, 10000)

test('multiviewer label', async () => {
	const spec: any[] = JSON.parse(readFileSync(path.join(__dirname, './upload-multiviewer-sequence.json')).toString())

	const newBuffer = Buffer.alloc(320 * 90)

	const manager = runDataTransferTest(spec)
	await manager.uploadMultiViewerLabel(11001, newBuffer)

	await new Promise((resolve) => setTimeout(resolve, 200))

	// Nothing should be left by this point
	expect(spec).toHaveLength(0)
}, 10000)

test('macro download', async () => {
	const spec: any[] = JSON.parse(readFileSync(path.join(__dirname, './download-macro-sequence.json')).toString())

	const manager = runDataTransferTest(spec)
	await manager.downloadMacro(4)

	await new Promise((resolve) => setTimeout(resolve, 200))

	// Nothing should be left by this point
	expect(spec).toHaveLength(0)
}, 10000)

test('macro upload', async () => {
	const spec: any[] = JSON.parse(readFileSync(path.join(__dirname, './upload-macro-sequence.json')).toString())

	const manager = runDataTransferTest(spec)
	await manager.uploadMacro(4, Buffer.alloc(400), 'test macro')

	await new Promise((resolve) => setTimeout(resolve, 200))

	// Nothing should be left by this point
	expect(spec).toHaveLength(0)
}, 10000)
