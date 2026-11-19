import * as fakeTimers from '@sinonjs/fake-timers'

import { IDeserializedCommand, ISerializableCommand } from '../../commands/CommandBase.js'
import {
	DataTransferCompleteCommand,
	DataTransferDataCommand,
	DataTransferDownloadRequestCommand,
	DataTransferErrorCommand,
	DataTransferUploadContinueCommand,
	DataTransferUploadRequestCommand,
	ErrorCode,
	LockObtainedCommand,
	LockStateUpdateCommand,
} from '../../commands/DataTransfer/index.js'
import { UploadBufferInfo } from '../dataTransferUploadBuffer.js'
import { DataTransferManager } from '../index.js'

/**
 * Drive the data transfer manager with random sequences of responses from a misbehaving device, and check that it
 * never reports an internal error or leaves a rejection unhandled, and that every transfer eventually settles
 */

const SEEDS = 40
const STEPS = 200
/** Longer than the inactivity timeout, so anything that has stalled must have timed out */
const SETTLE_TIME = 31_000

/** Small deterministic PRNG, so failures are reproducible */
function mulberry32(seed: number): () => number {
	return () => {
		seed |= 0
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

function bufferInfo(length: number): UploadBufferInfo {
	return { encodedData: Buffer.alloc(length, 1), rawDataLength: length, isRleEncoded: false, hash: null }
}

describe('DataTransferManager fuzzing', () => {
	let clock: fakeTimers.InstalledClock
	const unhandled: unknown[] = []
	const onUnhandled = (e: unknown): void => {
		unhandled.push(e)
	}

	beforeEach(() => {
		clock = fakeTimers.install()
		unhandled.length = 0
		process.on('unhandledRejection', onUnhandled)
	})
	afterEach(() => {
		process.off('unhandledRejection', onUnhandled)
		clock.uninstall()
	})

	test.each(Array.from({ length: SEEDS }, (_, i) => i + 1))('seed %d', async (seed) => {
		const rand = mulberry32(seed)
		const pick = <T>(values: T[]): T => values[Math.floor(rand() * values.length)]

		const errors: string[] = []
		const transferIds = new Set<number>([0])
		const manager = new DataTransferManager(
			async (commands: ISerializableCommand[]) => {
				// Learn the transfer ids in use, so that most responses are for a real transfer
				for (const command of commands) {
					if (
						command instanceof DataTransferUploadRequestCommand ||
						command instanceof DataTransferDownloadRequestCommand
					) {
						transferIds.add(command.properties.transferId)
					}
				}
			},
			(message) => errors.push(message),
			true
		)
		manager.startCommandSending(true)

		function* frames(count: number): Generator<UploadBufferInfo> {
			for (let i = 0; i < count; i++) yield bufferInfo(64)
		}

		const settled: boolean[] = []
		const track = (promise: Promise<unknown>): void => {
			const index = settled.push(false) - 1
			promise.then(
				() => (settled[index] = true),
				() => (settled[index] = true)
			)
		}
		track(manager.uploadStill(0, bufferInfo(64), 'still', ''))
		track(manager.downloadStill(1))
		track(manager.uploadClip(0, frames(2), 'clip'))
		track(manager.uploadAudio(1, Buffer.alloc(48), 'audio'))
		track(manager.downloadMacro(0))
		track(manager.uploadMacro(1, Buffer.alloc(32, 2), 'macro'))
		track(manager.uploadMultiViewerLabel(0, Buffer.alloc(16)))

		const randomCommand = (): IDeserializedCommand => {
			const transferId = rand() < 0.9 ? pick([...transferIds]) : Math.floor(rand() * 0xffff)
			switch (pick(['lock', 'lockState', 'continue', 'data', 'complete', 'error'])) {
				case 'lock':
					return new LockObtainedCommand(pick([0, 1, 2, 3]))
				case 'lockState':
					return new LockStateUpdateCommand({ index: pick([0, 1, 2, 3]), locked: rand() < 0.5 })
				case 'continue':
					return new DataTransferUploadContinueCommand({
						transferId,
						chunkSize: pick([0, 8, 24, 100, 1396]),
						chunkCount: Math.floor(rand() * 20),
					})
				case 'data':
					return new DataTransferDataCommand({ transferId, body: Buffer.alloc(Math.floor(rand() * 64)) })
				case 'complete':
					return new DataTransferCompleteCommand({ transferId })
				default:
					return new DataTransferErrorCommand({
						transferId,
						errorCode: pick([ErrorCode.Retry, ErrorCode.NotFound, ErrorCode.NotLocked, 7]),
					})
			}
		}

		for (let step = 0; step < STEPS; step++) {
			manager.queueHandleCommand(randomCommand())
			await clock.tickAsync(Math.floor(rand() * 10))
		}

		// Give every lock, so that nothing is left waiting on one, then let anything stalled time out
		for (let round = 0; round < 10 && settled.includes(false); round++) {
			for (const index of [0, 1, 2, 3]) manager.queueHandleCommand(new LockObtainedCommand(index))
			await clock.tickAsync(SETTLE_TIME)
		}

		manager.stopCommandSending()
		await clock.tickAsync(0)

		expect(errors).toEqual([])
		expect(unhandled).toEqual([])
		expect(settled.map((done, i) => (done ? 'settled' : `transfer ${i} still pending`))).toEqual(
			settled.map(() => 'settled')
		)
	})
})
