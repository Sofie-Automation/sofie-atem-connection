import * as fakeTimers from '@sinonjs/fake-timers'
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
	let clock: fakeTimers.InstalledClock
	beforeEach(() => {
		clock = fakeTimers.install()
	})
	afterEach(() => {
		clock.uninstall()
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

		await clock.tickAsync(TIMEOUT + 10)
		await expect(promise).rejects.toThrow(`Transfer timed out after ${TIMEOUT}ms of inactivity`)
		expect(queue.currentTransferId).toBeNull()
		expect(errors).toEqual([])
	})

	test('activity from the atem keeps the transfer alive', async () => {
		const { queue } = createQueue()
		const transfer = new FakeTransfer()
		const promise = queue.enqueue(transfer)

		for (let i = 0; i < 5; i++) {
			await clock.tickAsync(TIMEOUT * 0.8)
			queue.handleCommand(data(0))
		}
		queue.handleCommand(new DataTransferCompleteCommand({ transferId: 0 }))
		await clock.tickAsync(0)
		await expect(promise).resolves.toBeUndefined()

		// Completion stops the timer
		expect(clock.countTimers()).toEqual(0)
	})

	test('time spent handling a command is not inactivity', async () => {
		const { queue } = createQueue()
		// Eg a clip upload waiting on a slow frame generator
		const transfer = new FakeTransfer(async () => new Promise((resolve) => setTimeout(resolve, TIMEOUT * 3)))
		const promise = queue.enqueue(transfer)
		let settled = false
		promise.finally(() => (settled = true)).catch(() => null)

		await clock.tickAsync(10)
		queue.handleCommand(data(0))
		await clock.tickAsync(TIMEOUT * 3 + 10)
		expect(settled).toBe(false)

		// Once the handler finishes, the clock starts again
		await clock.tickAsync(TIMEOUT + 10)
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

		await clock.tickAsync(TIMEOUT * 10)
		expect(settled).toBe(false)

		// Once the lock is obtained the transfer starts, and can time out
		queue.lockObtained()
		await clock.tickAsync(TIMEOUT + 10)
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
		await clock.tickAsync(0)

		await expect(broken).rejects.toThrow('No frames available for transfer')
		expect(queue.currentTransferId).toEqual(1)

		queue.handleCommand(new DataTransferCompleteCommand({ transferId: 1 }))
		await clock.tickAsync(0)
		await expect(next).resolves.toBeUndefined()
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
			await clock.tickAsync(0)
			expect(lockCommands).toEqual([true])
			expect(startSpy).not.toHaveBeenCalled()

			// The other client unlocking doesn't abort our transfer, which is still waiting for the lock
			queue.updateLock(false)
			await clock.tickAsync(0)

			queue.lockObtained()
			await clock.tickAsync(0)
			expect(startSpy).toHaveBeenCalledTimes(1)

			queue.handleCommand(new DataTransferCompleteCommand({ transferId: 0 }))
			await clock.tickAsync(0)
			queue.popQueuedCommands(10) // Let the queue see the transfer has finished
			await expect(promise).resolves.toBeUndefined()

			// Our lock is released, once
			expect(lockCommands).toEqual([true, false])

			// Then confirming our unlock, and another client taking the lock, changes nothing
			queue.updateLock(false)
			queue.updateLock(true)
			await clock.tickAsync(0)
			expect(lockCommands).toEqual([true, false])
		})

		test('losing our lock mid-transfer aborts it', async () => {
			const { queue, lockCommands } = createLockingQueue()

			const promise = queue.enqueue(new FakeTransfer())
			promise.catch(() => null)
			await clock.tickAsync(0)
			queue.lockObtained()
			await clock.tickAsync(0)

			queue.updateLock(false)
			await clock.tickAsync(0)
			await expect(promise).rejects.toThrow('Lost lock mid-transfer')
			// It is already unlocked, so there is nothing to release
			expect(lockCommands).toEqual([true])
		})
	})
})
