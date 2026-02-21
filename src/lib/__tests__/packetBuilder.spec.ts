import type { ISerializableCommand } from '../../commands/index.js'
import { ProtocolVersion } from '../../enums/index.js'
import { PacketBuilder } from '../packetBuilder.js'

class FakeCommand implements ISerializableCommand {
	static readonly rawName: string = 'FAKE'

	constructor(
		public readonly length: number,
		public readonly value: number = 1
	) {}

	public get lengthWithHeader(): number {
		return this.length + 8
	}

	serialize = jest.fn((_version: ProtocolVersion): Buffer => {
		return Buffer.alloc(this.length, this.value)
	})
}

describe('PacketBuilder', () => {
	it('No commands', () => {
		const builder = new PacketBuilder(500, ProtocolVersion.V8_1_1)
		expect(builder.getPackets()).toHaveLength(0)
	})

	it('Single command', () => {
		const builder = new PacketBuilder(500, ProtocolVersion.V8_1_1)

		const cmd = new FakeCommand(10)
		builder.addCommand(cmd)

		expect(builder.getPackets()).toHaveLength(1)
		expect(builder.getPackets()).toHaveLength(1) // Ensure that calling it twice doesnt affect the output
		expect(builder.getPackets()[0]).toHaveLength(cmd.lengthWithHeader)
	})

	it('Once finished cant add more commands', () => {
		const builder = new PacketBuilder(500, ProtocolVersion.V8_1_1)

		const cmd = new FakeCommand(10)
		builder.addCommand(cmd)

		expect(builder.getPackets()).toHaveLength(1)

		expect(() => builder.addCommand(cmd)).toThrow('finished')
	})

	it('Repeated command', () => {
		const builder = new PacketBuilder(500, ProtocolVersion.V8_1_1)

		const cmd = new FakeCommand(10)
		for (let i = 0; i < 5; i++) {
			builder.addCommand(cmd)
		}

		expect(builder.getPackets()).toHaveLength(1)
		expect(builder.getPackets()[0]).toHaveLength(cmd.lengthWithHeader * 5)
	})

	it('Repeated command spanning multiple packets', () => {
		const builder = new PacketBuilder(500, ProtocolVersion.V8_1_1)

		const cmd = new FakeCommand(10)
		for (let i = 0; i < 60; i++) {
			builder.addCommand(cmd)
		}

		expect(cmd.lengthWithHeader).toBe(18)
		expect(builder.getPackets()).toHaveLength(3)

		expect(builder.getPackets()[0]).toHaveLength(cmd.lengthWithHeader * 27)
		expect(builder.getPackets()[1]).toHaveLength(cmd.lengthWithHeader * 27)
		expect(builder.getPackets()[2]).toHaveLength(cmd.lengthWithHeader * 6)
	})

	it('Command too large to fit a packets', () => {
		const builder = new PacketBuilder(500, ProtocolVersion.V8_1_1)

		const cmd = new FakeCommand(501)
		expect(cmd.lengthWithHeader).toBe(501 + 8)
		const smallCmd = new FakeCommand(10)

		builder.addCommand(cmd)
		builder.addCommand(smallCmd)
		expect(builder.getPackets()).toHaveLength(2)
		expect(builder.getPackets()[0]).toHaveLength(cmd.lengthWithHeader)
		expect(builder.getPackets()[1]).toHaveLength(smallCmd.lengthWithHeader)
	})

	it('Command same size as packet', () => {
		const builder = new PacketBuilder(500, ProtocolVersion.V8_1_1)

		const cmd = new FakeCommand(500 - 8)
		expect(cmd.lengthWithHeader).toBe(500)

		builder.addCommand(cmd)
		expect(builder.getPackets()).toHaveLength(1)
		expect(builder.getPackets()[0]).toHaveLength(cmd.lengthWithHeader)
	})

	it('Commands of mixed sizes', () => {
		const builder = new PacketBuilder(500, ProtocolVersion.V8_1_1)

		const largeCmd = new FakeCommand(400)
		const mediumCmd = new FakeCommand(80)
		const smallCmd = new FakeCommand(10)

		// packet 0:
		builder.addCommand(mediumCmd)
		builder.addCommand(smallCmd)

		// packet 1:
		builder.addCommand(largeCmd)
		builder.addCommand(mediumCmd)

		// packet 2:
		builder.addCommand(smallCmd)
		builder.addCommand(smallCmd)
		builder.addCommand(largeCmd)

		expect(builder.getPackets()).toHaveLength(3)
		expect(builder.getPackets()[0]).toHaveLength(mediumCmd.lengthWithHeader + smallCmd.lengthWithHeader)
		expect(builder.getPackets()[1]).toHaveLength(largeCmd.lengthWithHeader + mediumCmd.lengthWithHeader)
		expect(builder.getPackets()[2]).toHaveLength(
			smallCmd.lengthWithHeader + smallCmd.lengthWithHeader + largeCmd.lengthWithHeader
		)
	})
})
