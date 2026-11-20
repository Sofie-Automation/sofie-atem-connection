import { describe, expect, test } from 'vitest'

import { DataTransferErrorCommand, ErrorCode } from '../../commands/DataTransfer/index.js'
import { DataTransferState } from '../dataTransfer.js'
import { DataTransferUploadClip, DataTransferUploadClipFrame } from '../dataTransferUploadClip.js'

function createClip() {
	const generator = { closed: false, framesTaken: 0 }
	function* frames(): Generator<DataTransferUploadClipFrame, undefined> {
		try {
			for (let i = 0; i < 3; i++) {
				generator.framesTaken++
				yield new DataTransferUploadClipFrame(0, i, {
					encodedData: Buffer.alloc(64),
					rawDataLength: 64,
					isRleEncoded: false,
					hash: null,
				})
			}
		} finally {
			generator.closed = true
		}
		return undefined
	}

	let nextId = 10
	const clip = new DataTransferUploadClip(0, 'test', frames(), () => nextId++)
	return { clip, generator }
}

describe('DataTransferUploadClip', () => {
	test('a failed frame fails the clip, and closes the generator', async () => {
		const { clip, generator } = createClip()

		await clip.startTransfer(1)
		const result = await clip.handleCommand(
			new DataTransferErrorCommand({ transferId: 1, errorCode: 7 as ErrorCode }),
			DataTransferState.Transferring
		)

		// The clip must not carry on to the next frame. The frame's own rejection must not go unhandled either
		expect(result).toEqual({ newState: DataTransferState.Finished, commands: [] })
		await expect(clip.promise).rejects.toThrow('Frame 0 failed: Unknown error 7')
		expect(generator.framesTaken).toEqual(1)
		expect(generator.closed).toBe(true)
	})

	test('aborting the clip closes the generator', async () => {
		const { clip, generator } = createClip()
		clip.promise.catch(() => null)

		await clip.startTransfer(1)
		expect(generator.closed).toBe(false)

		clip.abort(new Error('Stopping'))
		await expect(clip.promise).rejects.toThrow('Stopping')
		expect(generator.closed).toBe(true)
	})
})
