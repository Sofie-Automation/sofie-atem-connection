import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { IDeserializedCommand } from '../../commands/CommandBase.js'
import {
	DataTransferCompleteCommand,
	DataTransferDataCommand,
	LockStateCommand,
} from '../../commands/DataTransfer/index.js'
import { DataTransfer, DataTransferState, ProgressTransferResult } from '../dataTransfer.js'
import { DataTransferLockingQueue, DataTransferSimpleQueue } from '../dataTransferQueue.js'

const TIMEOUT = 1000

class FakeTransfer extends DataTransfer<void> {
	constructor(private readonly onHandle?: () => Promise<void>) {
		super()
	}

	public async startTransfer(): Promise<ProgressTransferResult> {
		return { newState: DataTransferState.Transferring, commands: [] }
	}

	public async handleCommand(
		command: IDeserializedCommand,
		oldState: DataTransferState
	): Promise<ProgressTransferResult> {
		await this.onHandle?.()
		if (command instanceof DataTransferCompleteCommand) {
			this.resolvePromise()
			return { newState: DataTransferState.Finished, commands: [] }
		}
		return { newState: oldState, commands: [] }
	}
}

describe('DataTransferQueue', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})
	afterEach(() => {
		vi.useRealTimers()
	})

	function createQueue() {
		const errors: string[] = []
		let nextId = 0
		const queue = new DataTransferSimpleQueue({
			nextTransferId: () => nextId++,
			onError: (msg) => errors.push(msg),
			inactivityTimeout: TIMEOUT,
		})
		return { queue, errors }
	}

	const data = (transferId: number) => new DataTransferDataCommand({ transferId, body: Buffer.alloc(1) })

	test('aborts a started transfer that hears nothing back', async () => {
		const { queue, errors } = createQueue()
		const transfer = new FakeTransfer()
		const promise = queue.enqueue(transfer)
		promise.catch(() => null) // Avoid an unhandled rejection before it is checked

		await vi.advanceTimersByTimeAsync(TIMEOUT + 10)
		await expect(promise).rejects.toThrow(`Transfer timed out after ${TIMEOUT}ms of inactivity`)
		expect(queue.currentTransferId).toBeNull()
		expect(errors).toEqual([])
	})

	test('activity from the atem keeps the transfer alive', async () => {
		const { queue } = createQueue()
		const transfer = new FakeTransfer()
		const promise = queue.enqueue(transfer)

		for (let i = 0; i < 5; i++) {
			await vi.advanceTimersByTimeAsync(TIMEOUT * 0.8)
			queue.handleCommand(data(0))
		}
		queue.handleCommand(new DataTransferCompleteCommand({ transferId: 0 }))
		await vi.advanceTimersByTimeAsync(0)
		await expect(promise).resolves.toBeUndefined()

		// Completion stops the timer
		expect(vi.getTimerCount()).toEqual(0)
	})

	test('time spent handling a command is not inactivity', async () => {
		const { queue } = createQueue()
		// Eg a clip upload waiting on a slow frame generator
		const transfer = new FakeTransfer(async () => new Promise((resolve) => setTimeout(resolve, TIMEOUT * 3)))
		const promise = queue.enqueue(transfer)
		let settled = false
		promise.finally(() => (settled = true)).catch(() => null)

		await vi.advanceTimersByTimeAsync(10)
		queue.handleCommand(data(0))
		await vi.advanceTimersByTimeAsync(TIMEOUT * 3 + 10)
		expect(settled).toBe(false)

		// Once the handler finishes, the clock starts again
		await vi.advanceTimersByTimeAsync(TIMEOUT + 10)
		await expect(promise).rejects.toThrow('Transfer timed out')
	})

	test('waiting for the lock does not time out', async () => {
		let nextId = 0
		const queue = new DataTransferLockingQueue(0, () => null, {
			nextTransferId: () => nextId++,
			onError: () => null,
			inactivityTimeout: TIMEOUT,
		})
		const promise = queue.enqueue(new FakeTransfer())
		let settled = false
		promise.finally(() => (settled = true)).catch(() => null)

		await vi.advanceTimersByTimeAsync(TIMEOUT * 10)
		expect(settled).toBe(false)

		// Once the lock is obtained the transfer starts, and can time out
		queue.lockObtained()
		await vi.advanceTimersByTimeAsync(TIMEOUT + 10)
		await expect(promise).rejects.toThrow('Transfer timed out')
	})

	test('a transfer that fails to start is rejected, and the queue moves on', async () => {
		const { queue } = createQueue()
		class BrokenTransfer extends FakeTransfer {
			public async startTransfer(): Promise<ProgressTransferResult> {
				throw new Error('No frames available for transfer')
			}
		}

		const broken = queue.enqueue(new BrokenTransfer())
		broken.catch(() => null)
		const next = queue.enqueue(new FakeTransfer())
		await vi.advanceTimersByTimeAsync(0)

		await expect(broken).rejects.toThrow('No frames available for transfer')
		expect(queue.currentTransferId).toEqual(1)

		queue.handleCommand(new DataTransferCompleteCommand({ transferId: 1 }))
		await vi.advanceTimersByTimeAsync(0)
		await expect(next).resolves.toBeUndefined()
	})

	describe('abort signal', () => {
		test('an already aborted signal rejects without starting the transfer', async () => {
			const { queue, errors } = createQueue()
			const transfer = new FakeTransfer()
			const startSpy = vi.spyOn(transfer, 'startTransfer')

			const promise = queue.enqueue(transfer, AbortSignal.abort())
			await expect(promise).rejects.toThrow('This operation was aborted')

			await vi.advanceTimersByTimeAsync(0)
			expect(startSpy).not.toHaveBeenCalled()
			expect(queue.currentTransferId).toBeNull()
			expect(errors).toEqual([])
		})

		test('aborting a queued transfer removes it, without affecting the active one', async () => {
			const { queue, errors } = createQueue()
			const first = queue.enqueue(new FakeTransfer())

			const controller = new AbortController()
			const queued = new FakeTransfer()
			const startSpy = vi.spyOn(queued, 'startTransfer')
			const queuedPromise = queue.enqueue(queued, controller.signal)
			queuedPromise.catch(() => null)
			await vi.advanceTimersByTimeAsync(0)

			controller.abort(new Error('No longer wanted'))
			await expect(queuedPromise).rejects.toThrow('No longer wanted')

			queue.handleCommand(new DataTransferCompleteCommand({ transferId: 0 }))
			await vi.advanceTimersByTimeAsync(0)
			queue.popQueuedCommands(10) // Let the queue see the transfer has finished
			await expect(first).resolves.toBeUndefined()

			// The aborted transfer is never started
			await vi.advanceTimersByTimeAsync(0)
			expect(startSpy).not.toHaveBeenCalled()
			expect(queue.currentTransferId).toBeNull()
			expect(errors).toEqual([])
		})

		test('aborting the active transfer rejects it, and the queue moves on', async () => {
			const { queue, errors } = createQueue()
			const controller = new AbortController()
			const active = queue.enqueue(new FakeTransfer(), controller.signal)
			active.catch(() => null)
			const next = queue.enqueue(new FakeTransfer())
			await vi.advanceTimersByTimeAsync(0)
			expect(queue.currentTransferId).toEqual(0)

			controller.abort(new Error('No longer wanted'))
			await vi.advanceTimersByTimeAsync(0)
			await expect(active).rejects.toThrow('No longer wanted')
			expect(queue.currentTransferId).toEqual(1)

			// A late command for the aborted transfer is ignored
			queue.handleCommand(new DataTransferCompleteCommand({ transferId: 0 }))
			queue.handleCommand(new DataTransferCompleteCommand({ transferId: 1 }))
			await vi.advanceTimersByTimeAsync(0)
			await expect(next).resolves.toBeUndefined()
			expect(errors).toEqual([])
		})

		test('aborting a completed transfer does nothing', async () => {
			const { queue, errors } = createQueue()
			const controller = new AbortController()
			const promise = queue.enqueue(new FakeTransfer(), controller.signal)
			await vi.advanceTimersByTimeAsync(0)

			queue.handleCommand(new DataTransferCompleteCommand({ transferId: 0 }))
			await vi.advanceTimersByTimeAsync(0)
			await expect(promise).resolves.toBeUndefined()

			controller.abort()
			await vi.advanceTimersByTimeAsync(0)
			expect(errors).toEqual([])
		})
	})

	describe('locking', () => {
		function createLockingQueue() {
			const lockCommands: boolean[] = []
			let nextId = 0
			const queue = new DataTransferLockingQueue(
				0,
				(cmd: LockStateCommand) => lockCommands.push(cmd.properties.locked),
				{
					nextTransferId: () => nextId++,
					onError: () => null,
					inactivityTimeout: TIMEOUT,
				}
			)
			return { queue, lockCommands }
		}

		test("another client's lock is not mistaken for ours", async () => {
			const { queue, lockCommands } = createLockingQueue()

			// Another client locks the pool
			queue.updateLock(true)

			// We still have to request the lock, rather than starting the transfer straight away
			const transfer = new FakeTransfer()
			const startSpy = vi.spyOn(transfer, 'startTransfer')
			const promise = queue.enqueue(transfer)
			await vi.advanceTimersByTimeAsync(0)
			expect(lockCommands).toEqual([true])
			expect(startSpy).not.toHaveBeenCalled()

			// The other client unlocking doesn't abort our transfer, which is still waiting for the lock
			queue.updateLock(false)
			await vi.advanceTimersByTimeAsync(0)

			queue.lockObtained()
			await vi.advanceTimersByTimeAsync(0)
			expect(startSpy).toHaveBeenCalledTimes(1)

			queue.handleCommand(new DataTransferCompleteCommand({ transferId: 0 }))
			await vi.advanceTimersByTimeAsync(0)
			queue.popQueuedCommands(10) // Let the queue see the transfer has finished
			await expect(promise).resolves.toBeUndefined()

			// Our lock is released, once
			expect(lockCommands).toEqual([true, false])

			// Then confirming our unlock, and another client taking the lock, changes nothing
			queue.updateLock(false)
			queue.updateLock(true)
			await vi.advanceTimersByTimeAsync(0)
			expect(lockCommands).toEqual([true, false])
		})

		test('losing our lock mid-transfer aborts it', async () => {
			const { queue, lockCommands } = createLockingQueue()

			const promise = queue.enqueue(new FakeTransfer())
			promise.catch(() => null)
			await vi.advanceTimersByTimeAsync(0)
			queue.lockObtained()
			await vi.advanceTimersByTimeAsync(0)

			queue.updateLock(false)
			await vi.advanceTimersByTimeAsync(0)
			await expect(promise).rejects.toThrow('Lost lock mid-transfer')
			// It is already unlocked, so there is nothing to release
			expect(lockCommands).toEqual([true])
		})

		test('aborting with a signal while waiting for the lock cancels the request', async () => {
			const { queue, lockCommands } = createLockingQueue()
			const controller = new AbortController()
			const promise = queue.enqueue(new FakeTransfer(), controller.signal)
			promise.catch(() => null)
			await vi.advanceTimersByTimeAsync(0)
			expect(lockCommands).toEqual([true])

			// Aborted while still waiting for the lock
			controller.abort(new Error('No longer wanted'))
			await vi.advanceTimersByTimeAsync(0)
			await expect(promise).rejects.toThrow('No longer wanted')
			expect(lockCommands).toEqual([true, false])

			// A grant that crossed with the cancellation is not treated as ours
			queue.lockObtained()
			await vi.advanceTimersByTimeAsync(0)
			expect(lockCommands).toEqual([true, false])
		})

		test('aborting a running transfer releases the lock', async () => {
			const { queue, lockCommands } = createLockingQueue()
			const controller = new AbortController()
			const promise = queue.enqueue(new FakeTransfer(), controller.signal)
			promise.catch(() => null)
			await vi.advanceTimersByTimeAsync(0)
			queue.lockObtained()
			await vi.advanceTimersByTimeAsync(0)

			controller.abort(new Error('No longer wanted'))
			await vi.advanceTimersByTimeAsync(0)
			await expect(promise).rejects.toThrow('No longer wanted')
			expect(lockCommands).toEqual([true, false])
		})

		test('aborting while waiting for the lock cancels the request', async () => {
			const { queue, lockCommands } = createLockingQueue()

			const promise = queue.enqueue(new FakeTransfer())
			promise.catch(() => null)
			await vi.advanceTimersByTimeAsync(0)
			expect(lockCommands).toEqual([true])

			queue.tryAbortTransfer(new Error('Gave up'))
			await vi.advanceTimersByTimeAsync(0)
			await expect(promise).rejects.toThrow('Gave up')

			// The atem queues lock requests, so it must be told we no longer want it
			expect(lockCommands).toEqual([true, false])
		})

		test('clearing the queue while waiting for the lock cancels the request', async () => {
			const { queue, lockCommands } = createLockingQueue()

			const promise = queue.enqueue(new FakeTransfer())
			promise.catch(() => null)
			await vi.advanceTimersByTimeAsync(0)

			queue.clearQueueAndAbort(new Error('Stopping connection'))
			await expect(promise).rejects.toThrow('Stopping connection')
			expect(lockCommands).toEqual([true, false])
		})

		test('a lock we did not request is left alone', async () => {
			const { queue, lockCommands } = createLockingQueue()

			// Taken manually through the same connection
			queue.lockObtained()
			await vi.advanceTimersByTimeAsync(0)
			expect(lockCommands).toEqual([])

			// It isn't mistaken as ours by the next transfer, which requests it and then releases only its own lock
			const transfer = new FakeTransfer()
			const startSpy = vi.spyOn(transfer, 'startTransfer')
			const promise = queue.enqueue(transfer)
			await vi.advanceTimersByTimeAsync(0)
			expect(lockCommands).toEqual([true])
			expect(startSpy).not.toHaveBeenCalled()

			queue.lockObtained()
			await vi.advanceTimersByTimeAsync(0)
			queue.handleCommand(new DataTransferCompleteCommand({ transferId: 0 }))
			await vi.advanceTimersByTimeAsync(0)
			queue.popQueuedCommands(10)
			await expect(promise).resolves.toBeUndefined()
			expect(lockCommands).toEqual([true, false])
		})

		test('a transfer aborted while waiting hands the request on to the next one', async () => {
			const { queue, lockCommands } = createLockingQueue()

			const first = queue.enqueue(new FakeTransfer())
			first.catch(() => null)
			const second = new FakeTransfer()
			const startSpy = vi.spyOn(second, 'startTransfer')
			const secondPromise = queue.enqueue(second)
			await vi.advanceTimersByTimeAsync(0)

			queue.tryAbortTransfer(new Error('Gave up'))
			await vi.advanceTimersByTimeAsync(0)
			await expect(first).rejects.toThrow('Gave up')

			// The original request is still queued with the atem, so isn't repeated or cancelled
			expect(lockCommands).toEqual([true])

			queue.lockObtained()
			await vi.advanceTimersByTimeAsync(0)
			expect(startSpy).toHaveBeenCalledTimes(1)

			queue.handleCommand(new DataTransferCompleteCommand({ transferId: 1 }))
			await vi.advanceTimersByTimeAsync(0)
			queue.popQueuedCommands(10)
			await expect(secondPromise).resolves.toBeUndefined()
			expect(lockCommands).toEqual([true, false])
		})
	})
})
