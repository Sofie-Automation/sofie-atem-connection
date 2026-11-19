import { DataTransferDataCommand, DataTransferUploadContinueCommand } from '../../commands/DataTransfer'
import { DataTransferState } from '../dataTransfer'
import { DataTransferUploadMacro } from '../dataTransferUploadMacro'

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
})
