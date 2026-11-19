import * as fakeTimers from '@sinonjs/fake-timers'
import { DataTransferCompleteCommand, DataTransferDataCommand } from '../../commands/DataTransfer'
import { IDeserializedCommand } from '../../commands/CommandBase'
import { DataTransfer, DataTransferState, ProgressTransferResult } from '../dataTransfer'
import { DataTransferLockingQueue, DataTransferSimpleQueue } from '../dataTransferQueue'

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

describe('DataTransferQueue inactivity timeout', () => {
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
		expect(settled).toBeFalse()

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
		expect(settled).toBeFalse()

		// Once the lock is obtained the transfer starts, and can time out
		queue.lockObtained()
		await clock.tickAsync(TIMEOUT + 10)
		await expect(promise).rejects.toThrow('Transfer timed out')
	})
})
