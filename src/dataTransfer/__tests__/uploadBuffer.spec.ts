import { describe, expect, test } from 'vitest'

import { DataTransferDataCommand, DataTransferUploadContinueCommand } from '../../commands/DataTransfer/index.js'
import { VideoMode } from '../../enums/index.js'
import { getVideoModeInfo } from '../../lib/videoMode.js'
import { DataTransferState } from '../dataTransfer.js'
import { generateHashForBuffer, generateUploadBufferInfo, UploadBufferInfo } from '../dataTransferUploadBuffer.js'
import { DataTransferUploadMacro } from '../dataTransferUploadMacro.js'

describe('DataTransferUploadBuffer', () => {
	test('aborts when the requested chunk size is too small to make progress', async () => {
		const transfer = new DataTransferUploadMacro(0, Buffer.alloc(100, 1), 'test')

		for (const chunkSize of [0, 7, 8, 16]) {
			const result = await transfer.handleCommand(
				new DataTransferUploadContinueCommand({ transferId: 0, chunkSize, chunkCount: 100 }),
				DataTransferState.Transferring
			)
			expect(result).toEqual({ newState: DataTransferState.Finished, commands: [] })
		}

		await expect(transfer.promise).rejects.toThrow('Invalid chunk size 0')
	})

	test('sends the data in chunks of the requested size', async () => {
		const data = Buffer.alloc(100, 1)
		const transfer = new DataTransferUploadMacro(0, data, 'test')

		const result = await transfer.handleCommand(
			new DataTransferUploadContinueCommand({ transferId: 0, chunkSize: 24, chunkCount: 100 }),
			DataTransferState.Transferring
		)
		const chunks = result.commands.map((cmd) => (cmd as DataTransferDataCommand).properties.body)
		expect(chunks.map((c) => c.length)).toEqual([24, 24, 24, 24, 4])
		expect(Buffer.concat(chunks)).toEqual(data)
	})

	test('RLE encodes a pre-converted buffer without changing the input', () => {
		const resolution = getVideoModeInfo(VideoMode.N525i5994NTSC)
		if (!resolution) throw new Error('Unknown video mode')
		const yuv = Buffer.alloc(resolution.width * resolution.height * 4, 0x11)
		const input: UploadBufferInfo = { encodedData: yuv, rawDataLength: yuv.length, isRleEncoded: false, hash: null }

		const result = generateUploadBufferInfo(input, resolution, true)

		expect(result.isRleEncoded).toBe(true)
		expect(result.encodedData.length).toBeLessThan(yuv.length)
		expect(result.hash).toEqual(generateHashForBuffer(yuv))
		expect(input).toEqual({ encodedData: yuv, rawDataLength: yuv.length, isRleEncoded: false, hash: null })
	})
})
