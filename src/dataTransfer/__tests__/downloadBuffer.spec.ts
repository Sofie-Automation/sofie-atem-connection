import { DataTransferCompleteCommand, DataTransferDataCommand } from '../../commands/DataTransfer'
import { DataTransferState } from '../dataTransfer'
import { DataTransferDownloadMacro } from '../dataTransferDownloadMacro'
import { DataTransferDownloadStill } from '../dataTransferDownloadStill'

describe('DataTransferDownloadBuffer', () => {
	test('accumulates data across multiple packets', async () => {
		const transfer = new DataTransferDownloadMacro(4)

		const chunks = [Buffer.from('aaa'), Buffer.from('bbb'), Buffer.from('ccc')]
		for (const body of chunks) {
			await transfer.handleCommand(
				new DataTransferDataCommand({ transferId: 0, body }),
				DataTransferState.Transferring
			)
		}

		await transfer.handleCommand(new DataTransferCompleteCommand({ transferId: 0 }), DataTransferState.Transferring)

		// Regression: the macro download used to overwrite #data with each packet, keeping only the last chunk
		await expect(transfer.promise).resolves.toEqual(Buffer.concat(chunks))
	})

	test('aborts once the downloaded size exceeds the cap', async () => {
		const transfer = new DataTransferDownloadMacro(4)

		// Don't let the rejection go unhandled before we assert on it
		const promise = transfer.promise.catch((e) => e)

		// Feed more than the 1MB macro cap without ever sending a completion command
		const chunk = Buffer.alloc(256 * 1024)
		let lastResult
		for (let i = 0; i < 5; i++) {
			lastResult = await transfer.handleCommand(
				new DataTransferDataCommand({ transferId: 0, body: chunk }),
				DataTransferState.Transferring
			)
		}

		// The transfer should have finished (aborted) rather than continuing to ack more data
		expect(lastResult?.newState).toBe(DataTransferState.Finished)
		expect(lastResult?.commands).toHaveLength(0)

		const error = await promise
		expect(error).toBeInstanceOf(Error)
		expect(error.message).toMatch(/maximum expected size/)
	})

	test('still download acks data and resolves on completion', async () => {
		const transfer = new DataTransferDownloadStill(0, 2)

		const result = await transfer.handleCommand(
			new DataTransferDataCommand({ transferId: 0, body: Buffer.from('hello') }),
			DataTransferState.Transferring
		)
		// Each accepted packet is acknowledged
		expect(result.commands).toHaveLength(1)

		await transfer.handleCommand(new DataTransferCompleteCommand({ transferId: 0 }), DataTransferState.Transferring)

		await expect(transfer.promise).resolves.toEqual(Buffer.from('hello'))
	})
})
