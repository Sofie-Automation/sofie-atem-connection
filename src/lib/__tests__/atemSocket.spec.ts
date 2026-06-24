/* eslint-disable @typescript-eslint/unbound-method */
import { Buffer } from 'buffer'

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
	BasicWritableCommand,
	CutCommand,
	DeserializedCommand,
	ISerializableCommand,
	PreviewInputUpdateCommand,
	ProductIdentifierCommand,
	ProgramInputUpdateCommand,
	VersionCommand,
} from '../../commands/index.js'
import { Model, ProtocolVersion } from '../../enums/index.js'
import { CommandParser } from '../atemCommandParser.js'
import { AtemSocket } from '../atemSocket.js'
import {
	createInProcessChild,
	mockCallbacks,
	mockConnect,
	mockConstructor,
	mockDisconnect,
	mockSendPackets,
	resetMocks,
} from './atemSocketChildFake.js'

describe('AtemSocket', () => {
	function mockClear(lite?: boolean): void {
		if (lite) {
			mockConstructor.mockClear()
			mockConnect.mockClear()
			mockDisconnect.mockClear()
			mockSendPackets.mockClear()
		} else {
			resetMocks()
		}
	}
	beforeEach(() => {
		vi.useFakeTimers()
		mockClear()
	})
	afterEach(() => {
		vi.useRealTimers()
	})

	function createSocket(): AtemSocket {
		return new AtemSocket({
			debugBuffers: false,
			address: '',
			port: 890,
			maxPacketSize: 1416,
			createChildBridge: createInProcessChild,
		})
	}

	function getChild(socket: AtemSocket): unknown {
		return (socket as any)._monitor
	}

	test('connect initial', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()

		expect((socket as any)._address).toEqual('')
		expect((socket as any)._port).toEqual(890)

		expect(getChild(socket)).toBeTruthy()
		// Connect was not called explicitly
		expect(mockConnect).toHaveBeenCalledTimes(1)
		expect(mockDisconnect).toHaveBeenCalledTimes(0)
		expect(mockSendPackets).toHaveBeenCalledTimes(0)

		// New child was constructed
		expect(mockConstructor).toHaveBeenCalledTimes(1)
		expect(mockConstructor).toHaveBeenCalledWith({ address: '', port: 890, debugBuffers: false })
	})
	test('connect initial with params', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect('abc', 765)

		expect((socket as any)._address).toEqual('abc')
		expect((socket as any)._port).toEqual(765)

		expect(getChild(socket)).toBeTruthy()
		// Connect was not called explicitly
		expect(mockConnect).toHaveBeenCalledTimes(1)
		expect(mockDisconnect).toHaveBeenCalledTimes(0)
		expect(mockSendPackets).toHaveBeenCalledTimes(0)

		// New child was constructed
		expect(mockConstructor).toHaveBeenCalledTimes(1)
		expect(mockConstructor).toHaveBeenCalledWith({ address: 'abc', port: 765, debugBuffers: false })
	})
	test('connect change details', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()

		expect((socket as any)._address).toEqual('')
		expect((socket as any)._port).toEqual(890)

		expect(getChild(socket)).toBeTruthy()

		// Connect was not called explicitly
		expect(mockConstructor).toHaveBeenCalledTimes(1)
		expect(mockConnect).toHaveBeenCalledTimes(1)
		expect(mockDisconnect).toHaveBeenCalledTimes(0)
		expect(mockSendPackets).toHaveBeenCalledTimes(0)

		mockClear()

		await socket.connect('new', 455)

		expect((socket as any)._address).toEqual('new')
		expect((socket as any)._port).toEqual(455)

		// connect was called explicitly
		expect(mockConstructor).toHaveBeenCalledTimes(0)
		expect(mockConnect).toHaveBeenCalledTimes(1)
		expect(mockDisconnect).toHaveBeenCalledTimes(0)
		expect(mockSendPackets).toHaveBeenCalledTimes(0)
		expect(mockConnect).toHaveBeenCalledWith('new', 455)
	})

	test('nextPacketTrackingId', () => {
		const socket = createSocket()

		expect(socket.nextPacketTrackingId).toEqual(1)
		expect(socket.nextPacketTrackingId).toEqual(2)
		expect(socket.nextPacketTrackingId).toEqual(3)
	})

	test('disconnect', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()

		expect(getChild(socket)).toBeTruthy()
		mockClear()

		await socket.disconnect()

		// connect was called explicitly
		expect(mockConstructor).toHaveBeenCalledTimes(0)
		expect(mockConnect).toHaveBeenCalledTimes(0)
		expect(mockDisconnect).toHaveBeenCalledTimes(1)
		expect(mockSendPackets).toHaveBeenCalledTimes(0)
		expect(mockDisconnect).toHaveBeenCalledWith()
	})

	test('disconnect - not open', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.disconnect()

		// connect was called explicitly
		expect(mockConstructor).toHaveBeenCalledTimes(0)
		expect(mockConnect).toHaveBeenCalledTimes(0)
		expect(mockDisconnect).toHaveBeenCalledTimes(0)
		expect(mockSendPackets).toHaveBeenCalledTimes(0)
	})

	test('sendCommand - not open', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		const cmd = new CutCommand(0)
		await expect(socket.sendCommands([cmd])).rejects.toEqual(new Error('Socket process is not open'))

		// connect was called explicitly
		expect(mockConstructor).toHaveBeenCalledTimes(0)
		expect(mockConnect).toHaveBeenCalledTimes(0)
		expect(mockDisconnect).toHaveBeenCalledTimes(0)
		expect(mockSendPackets).toHaveBeenCalledTimes(0)
	})

	test('sendCommand - not serializable', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear()
		expect(getChild(socket)).toBeTruthy()

		const cmd = new ProductIdentifierCommand({
			model: Model.OneME,
			productIdentifier: 'ATEM OneME',
		}) as any as ISerializableCommand
		expect(cmd.serialize).toBeFalsy()
		await expect(socket.sendCommands([cmd])).rejects.toEqual(
			new Error('Command ProductIdentifierCommand is not serializable')
		)

		// connect was called explicitly
		expect(mockConstructor).toHaveBeenCalledTimes(0)
		expect(mockConnect).toHaveBeenCalledTimes(0)
		expect(mockDisconnect).toHaveBeenCalledTimes(0)
		expect(mockSendPackets).toHaveBeenCalledTimes(0)
	})

	test('sendCommand', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear()
		expect(getChild(socket)).toBeTruthy()

		class MockCommand extends BasicWritableCommand<Record<string, never>> {
			public static readonly rawName = 'TEST'

			public serialize(): Buffer {
				return Buffer.from('test payload')
			}
		}

		const cmd = new MockCommand({})
		;(socket as any)._nextPacketTrackingId = 835
		await socket.sendCommands([cmd])

		// connect was called explicitly
		expect(mockConstructor).toHaveBeenCalledTimes(0)
		expect(mockConnect).toHaveBeenCalledTimes(0)
		expect(mockDisconnect).toHaveBeenCalledTimes(0)
		expect(mockSendPackets).toHaveBeenCalledTimes(1)

		const expectedBuffer = Buffer.concat([Buffer.from([0, 20, 0, 0]), Buffer.from('TEST'), cmd.serialize()])
		expect(mockSendPackets).toHaveBeenCalledWith([
			{
				payload: expectedBuffer,
				trackingId: 836,
			},
		])
	})

	test('events', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		expect(getChild(socket)).toBeTruthy()

		const disconnect = vi.fn()
		// const log = vi.fn()
		const ack = vi.fn()

		socket.on('disconnect', disconnect)
		socket.on('ackPackets', ack)

		expect(mockCallbacks.onDisconnect).toBeDefined()
		await mockCallbacks.onDisconnect()
		await vi.advanceTimersByTimeAsync(0)
		expect(disconnect).toHaveBeenCalledTimes(1)

		expect(mockCallbacks.onPacketsAcknowledged).toBeDefined()
		await mockCallbacks.onPacketsAcknowledged([{ packetId: 675, trackingId: 98 }])
		await vi.advanceTimersByTimeAsync(0)
		expect(ack).toHaveBeenCalledTimes(1)
		expect(ack).toHaveBeenCalledWith([98])
	})

	test('receive - init complete', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear(true)
		expect(getChild(socket)).toBeTruthy()

		const error = vi.fn()
		const change = vi.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		const parser = (socket as any)._commandParser as CommandParser
		expect(parser).toBeTruthy()
		const parserSpy = vi.spyOn(parser, 'commandFromRawName')

		const testBuffer = Buffer.from([0, 8, 0, 0, ...Buffer.from('InCm', 'ascii')])
		expect(mockCallbacks.onCommandsReceived).toBeDefined()
		await mockCallbacks.onCommandsReceived(testBuffer)
		await vi.advanceTimersByTimeAsync(0)

		expect(error).toHaveBeenCalledTimes(0)
		expect(change).toHaveBeenCalledTimes(0)

		expect(parserSpy).toHaveBeenCalledTimes(0)
	})
	test('receive - protocol version', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear(true)
		expect(getChild(socket)).toBeTruthy()

		const error = vi.fn()
		const change = vi.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		const parser = (socket as any)._commandParser as CommandParser
		expect(parser).toBeTruthy()
		const parserSpy = vi.spyOn(parser, 'commandFromRawName')
		expect(parser.version).toEqual(ProtocolVersion.V7_2) // Default

		const testBuffer = Buffer.from([0, 12, 0, 0, ...Buffer.from('_ver', 'ascii'), 0x01, 0x02, 0x03, 0x04])
		expect(mockCallbacks.onCommandsReceived).toBeDefined()
		await mockCallbacks.onCommandsReceived(testBuffer)
		await vi.advanceTimersByTimeAsync(0)

		expect(error).toHaveBeenCalledTimes(0)
		expect(change).toHaveBeenCalledTimes(1)

		expect(parserSpy).toHaveBeenCalledTimes(1)
		expect(parserSpy).toHaveBeenCalledWith('_ver')

		expect(parser.version).toEqual(0x01020304) // Parsed

		// A change with the command
		const expectedCmd = new VersionCommand(0x01020304 as ProtocolVersion)
		expect(change).toHaveBeenCalledWith([expectedCmd])
	})
	test('receive - multiple commands', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear(true)
		expect(getChild(socket)).toBeTruthy()

		const error = vi.fn()
		const change = vi.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		const parser = (socket as any)._commandParser as CommandParser
		expect(parser).toBeTruthy()
		const parserSpy = vi.spyOn(parser, 'commandFromRawName')
		expect(parser.version).toEqual(ProtocolVersion.V7_2) // Default

		const expectedCmd1 = new ProgramInputUpdateCommand(0, { source: 0x0123 })
		const expectedCmd2 = new PreviewInputUpdateCommand(1, { source: 0x0444 })

		const testCmd1 = Buffer.from([
			0,
			12,
			0,
			0,
			...Buffer.from(ProgramInputUpdateCommand.rawName, 'ascii'),
			0x00,
			0x00,
			0x01,
			0x23,
		])
		const testCmd2 = Buffer.from([
			0,
			12,
			0,
			0,
			...Buffer.from(PreviewInputUpdateCommand.rawName, 'ascii'),
			0x01,
			0x00,
			0x04,
			0x44,
		])
		expect(mockCallbacks.onCommandsReceived).toBeDefined()
		await mockCallbacks.onCommandsReceived(Buffer.concat([testCmd1, testCmd2]))
		await vi.advanceTimersByTimeAsync(0)

		expect(error).toHaveBeenCalledTimes(0)
		expect(change).toHaveBeenCalledTimes(1)

		expect(parserSpy).toHaveBeenCalledTimes(2)
		expect(parserSpy).toHaveBeenCalledWith(ProgramInputUpdateCommand.rawName)
		expect(parserSpy).toHaveBeenCalledWith(PreviewInputUpdateCommand.rawName)

		// A change with the command
		expect(change).toHaveBeenCalledWith([expectedCmd1, expectedCmd2])
	})
	test('receive - empty buffer', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear(true)
		expect(getChild(socket)).toBeTruthy()

		const error = vi.fn()
		const change = vi.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		const testBuffer = Buffer.alloc(0)
		expect(mockCallbacks.onCommandsReceived).toBeDefined()
		await mockCallbacks.onCommandsReceived(testBuffer)
		await vi.advanceTimersByTimeAsync(0)

		expect(error).toHaveBeenCalledTimes(0)
		expect(change).toHaveBeenCalledTimes(0)
	})
	test('receive - payload as a Uint8Array, as it arrives from the worker thread', async () => {
		const socket = createSocket()
		await socket.connect()
		mockClear(true)

		const change = vi.fn()
		socket.on('receivedCommands', change)

		const command = Buffer.from([
			0,
			12,
			0,
			0,
			...Buffer.from(ProgramInputUpdateCommand.rawName, 'ascii'),
			0,
			0,
			1,
			0x23,
		])
		// Offset into a larger buffer, to check the view is taken correctly
		const backing = new Uint8Array(command.length + 4)
		backing.set(command, 4)
		await mockCallbacks.onCommandsReceived(backing.subarray(4) as any)
		await vi.advanceTimersByTimeAsync(0)

		expect(change).toHaveBeenCalledWith([new ProgramInputUpdateCommand(0, { source: 0x0123 })])
	})

	test('receive - corrupt', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear(true)
		expect(getChild(socket)).toBeTruthy()

		const error = vi.fn()
		const change = vi.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		const testBuffer = Buffer.alloc(10, 0)
		expect(mockCallbacks.onCommandsReceived).toBeDefined()
		await mockCallbacks.onCommandsReceived(testBuffer)
		await vi.advanceTimersByTimeAsync(0)

		expect(error).toHaveBeenCalledTimes(0)
		expect(change).toHaveBeenCalledTimes(0)
	})
	test('receive - command longer than the packet', async () => {
		const socket = createSocket()
		await socket.connect()
		mockClear(true)

		const error = vi.fn()
		const change = vi.fn()
		socket.on('error', error)
		socket.on('receivedCommands', change)

		// Claims to be 20 bytes, but only 12 are present
		const testCmd = Buffer.from([
			0,
			20,
			0,
			0,
			...Buffer.from(ProgramInputUpdateCommand.rawName, 'ascii'),
			0,
			0,
			1,
			0x23,
		])
		await mockCallbacks.onCommandsReceived(testCmd)
		await vi.advanceTimersByTimeAsync(0)

		expect(change).toHaveBeenCalledTimes(0)
		expect(error).toHaveBeenCalledWith('Received command PrgI with length 20, but only 12 bytes remain')
	})
	test('receive - deserialize error', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear(true)
		expect(getChild(socket)).toBeTruthy()

		const error = vi.fn()
		const change = vi.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		class BrokenCommand extends DeserializedCommand<Record<string, never>> {
			public static readonly rawName = 'TEST'

			public static deserialize(): BrokenCommand {
				throw new Error('Broken command')
			}
			public applyToState(): string[] {
				throw new Error('Method not implemented.')
			}
		}

		const parser = (socket as any)._commandParser as CommandParser
		expect(parser).toBeTruthy()
		const parserSpy = vi.spyOn(parser, 'commandFromRawName')
		parserSpy.mockImplementationOnce(() => BrokenCommand)

		// const expectedCmd1 = new ProgramInputUpdateCommand(0, { source: 0x0123 })
		const expectedCmd2 = new PreviewInputUpdateCommand(1, { source: 0x0444 })

		const testCmd1 = Buffer.from([
			0,
			12,
			0,
			0,
			...Buffer.from(ProgramInputUpdateCommand.rawName, 'ascii'),
			0x00,
			0x00,
			0x01,
			0x23,
		])
		const testCmd2 = Buffer.from([
			0,
			12,
			0,
			0,
			...Buffer.from(PreviewInputUpdateCommand.rawName, 'ascii'),
			0x01,
			0x00,
			0x04,
			0x44,
		])
		expect(mockCallbacks.onCommandsReceived).toBeDefined()
		await mockCallbacks.onCommandsReceived(Buffer.concat([testCmd1, testCmd2]))
		await vi.advanceTimersByTimeAsync(0)

		expect(error).toHaveBeenCalledTimes(1)
		expect(change).toHaveBeenCalledTimes(1)

		expect(parserSpy).toHaveBeenCalledTimes(2)
		expect(parserSpy).toHaveBeenCalledWith(ProgramInputUpdateCommand.rawName)
		expect(parserSpy).toHaveBeenCalledWith(PreviewInputUpdateCommand.rawName)

		// The second command should have been a success
		expect(change).toHaveBeenCalledWith([expectedCmd2])
		expect(error).toHaveBeenCalledWith('Failed to deserialize command: BrokenCommand: Error: Broken command')
	})

	test('receive - thread restart', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear()
		expect(getChild(socket)).toBeTruthy()

		const connect = (socket.connect = vi.fn(async () => Promise.resolve()))

		const disconnected = vi.fn()
		socket.on('disconnect', disconnected)

		// Simulate a disconnect notification from the child
		await mockCallbacks.onDisconnect()
		await vi.advanceTimersByTimeAsync(0)
		expect(disconnected).toHaveBeenCalledTimes(1)

		// Simulate a worker respawn (triggers reconnect via the spawn handler)
		;(socket as any)._monitor?.emit?.('spawn')
		await vi.advanceTimersByTimeAsync(0)
		expect(connect).toHaveBeenCalledTimes(1)
	})
	// testIgnore('receive - thread restart with error', async () => {
	// 	const socket = createSocket()
	// 	expect(getChild(socket)).toBeFalsy()

	// 	await socket.connect()
	// 	mockClear()
	// 	expect(getChild(socket)).toBeTruthy()

	// 	const connect = socket.connect = vi.fn(() => Promise.reject('soemthing'))

	// 	const restarted = vi.fn()
	// 	const error = vi.fn()
	// 	socket.on('restarted', restarted)
	// 	socket.on('error', error)

	// 	expect(ThreadedClassManagerSingleton.handlers).toHaveLength(1)
	// 	// simulate a restart
	// 	ThreadedClassManagerSingleton.handlers.forEach(handler => handler())
	// 	await promisify(setImmediate)()

	// 	expect(restarted).toHaveBeenCalledTimes(1)
	// 	expect(connect).toHaveBeenCalledTimes(1)
	// 	expect(error).toHaveBeenCalledTimes(1)
	// 	expect(error).toHaveBeenCalledWith('soemthing')
	// })
})
