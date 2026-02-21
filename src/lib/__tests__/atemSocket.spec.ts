/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/ban-types */
import {
	CutCommand,
	ProductIdentifierCommand,
	VersionCommand,
	ProgramInputUpdateCommand,
	PreviewInputUpdateCommand,
	ISerializableCommand,
	BasicWritableCommand,
	DeserializedCommand,
} from '../../commands/index.js'
import { ProtocolVersion, Model } from '../../enums/index.js'
import { AtemSocket } from '../atemSocket.js'
import { ThreadedClass, ThreadedClassManager } from 'threadedclass'
import { Buffer } from 'buffer'
import { CommandParser } from '../atemCommandParser.js'
import * as fakeTimers from '@sinonjs/fake-timers'
import { AtemSocketChild } from '../atemSocketChild.js'
// import { promisify } from 'util'
jest.mock('../atemSocketChild')

// @ts-ignore
class AtemSocketChildMock implements AtemSocketChild {
	public onDisconnect: () => Promise<void>
	public onLog: (message: string) => Promise<void>
	public onCommandsReceived: (payload: Buffer, packetId: number) => Promise<void>
	public onPacketsAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>

	constructor() {
		// this._debug = options.debug
		// this._address = options.address
		// this._port = options.port

		this.onDisconnect = async (): Promise<void> => Promise.resolve()
		this.onLog = async (msg): Promise<void> => console.log(msg)
		this.onCommandsReceived = async (): Promise<void> => Promise.resolve()
		this.onPacketsAcknowledged = async (): Promise<void> => Promise.resolve()
	}

	public connect = jest.fn(async () => Promise.resolve())
	public disconnect = jest.fn(async () => Promise.resolve())
	public sendPackets = jest.fn(async () => Promise.resolve())
}

const AtemSocketChildSingleton = new AtemSocketChildMock()
;(AtemSocketChild as any).mockImplementation(
	(
		_opts: any,
		onDisconnect: () => Promise<void>,
		onLog: (message: string) => Promise<void>,
		onCommandsReceived: (payload: Buffer, packetId: number) => Promise<void>,
		onPacketsAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>
	) => {
		AtemSocketChildSingleton.onDisconnect = onDisconnect
		AtemSocketChildSingleton.onLog = onLog
		AtemSocketChildSingleton.onCommandsReceived = onCommandsReceived
		AtemSocketChildSingleton.onPacketsAcknowledged = onPacketsAcknowledged
		return AtemSocketChildSingleton
	}
)

class ThreadedClassManagerMock {
	public handlers: Function[] = []

	public onEvent(_socketProcess: any, _event: string, cb: Function): { stop: () => void } {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		ThreadedClassManagerSingleton.handlers.push(cb)
		return {
			stop: (): void => {
				// Ignore
			},
		}
	}
}
const ThreadedClassManagerSingleton = new ThreadedClassManagerMock()
jest.spyOn(ThreadedClassManager, 'onEvent').mockImplementation(ThreadedClassManagerSingleton.onEvent)

describe('AtemSocket', () => {
	let clock: fakeTimers.InstalledClock

	function mockClear(lite?: boolean): void {
		;(AtemSocketChild as any).mockClear()
		AtemSocketChildSingleton.connect.mockClear()
		AtemSocketChildSingleton.disconnect.mockClear()
		AtemSocketChildSingleton.sendPackets.mockClear()

		if (!lite) {
			AtemSocketChildSingleton.onLog = async (): Promise<void> => Promise.resolve()
			AtemSocketChildSingleton.onDisconnect = async (): Promise<void> => Promise.resolve()
			AtemSocketChildSingleton.onPacketsAcknowledged = async (): Promise<void> => Promise.resolve()
			AtemSocketChildSingleton.onCommandsReceived = async (): Promise<void> => Promise.resolve()
		}
	}
	beforeEach(() => {
		clock = fakeTimers.install()
		mockClear()
		ThreadedClassManagerSingleton.handlers = []
	})
	afterEach(() => {
		clock.uninstall()
	})

	function createSocket(): AtemSocket {
		return new AtemSocket({
			debugBuffers: false,
			address: '',
			port: 890,
			disableMultithreaded: true,
			childProcessTimeout: 100,
			maxPacketSize: 1416,
		})
	}

	function getChild(socket: AtemSocket): ThreadedClass<AtemSocketChild> | undefined {
		return (socket as any)._socketProcess
	}

	test('connect initial', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()

		expect((socket as any)._address).toEqual('')
		expect((socket as any)._port).toEqual(890)

		expect(getChild(socket)).toBeTruthy()
		// Connect was not called explicitly
		expect(AtemSocketChildSingleton.connect).toHaveBeenCalledTimes(1)
		expect(AtemSocketChildSingleton.disconnect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.sendPackets).toHaveBeenCalledTimes(0)

		// New child was constructed
		expect(AtemSocketChild).toHaveBeenCalledTimes(1)
		expect(AtemSocketChild).toHaveBeenCalledWith(
			{ address: '', port: 890, debugBuffers: false },
			expect.toBeFunction(),
			expect.toBeFunction(),
			expect.toBeFunction(),
			expect.toBeFunction()
		)
	})
	test('connect initial with params', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect('abc', 765)

		expect((socket as any)._address).toEqual('abc')
		expect((socket as any)._port).toEqual(765)

		expect(getChild(socket)).toBeTruthy()
		// Connect was not called explicitly
		expect(AtemSocketChildSingleton.connect).toHaveBeenCalledTimes(1)
		expect(AtemSocketChildSingleton.disconnect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.sendPackets).toHaveBeenCalledTimes(0)

		// New child was constructed
		expect(AtemSocketChild).toHaveBeenCalledTimes(1)
		expect(AtemSocketChild).toHaveBeenCalledWith(
			{ address: 'abc', port: 765, debugBuffers: false },
			expect.toBeFunction(),
			expect.toBeFunction(),
			expect.toBeFunction(),
			expect.toBeFunction()
		)
	})
	test('connect change details', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()

		expect((socket as any)._address).toEqual('')
		expect((socket as any)._port).toEqual(890)

		expect(getChild(socket)).toBeTruthy()

		// Connect was not called explicitly
		expect(AtemSocketChild).toHaveBeenCalledTimes(1)
		expect(AtemSocketChildSingleton.connect).toHaveBeenCalledTimes(1)
		expect(AtemSocketChildSingleton.disconnect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.sendPackets).toHaveBeenCalledTimes(0)

		mockClear()

		await socket.connect('new', 455)

		expect((socket as any)._address).toEqual('new')
		expect((socket as any)._port).toEqual(455)

		// connect was called explicitly
		expect(AtemSocketChild).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.connect).toHaveBeenCalledTimes(1)
		expect(AtemSocketChildSingleton.disconnect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.sendPackets).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.connect).toHaveBeenCalledWith('new', 455)
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
		expect(AtemSocketChild).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.connect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.disconnect).toHaveBeenCalledTimes(1)
		expect(AtemSocketChildSingleton.sendPackets).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.disconnect).toHaveBeenCalledWith()
	})

	test('disconnect - not open', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.disconnect()

		// connect was called explicitly
		expect(AtemSocketChild).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.connect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.disconnect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.sendPackets).toHaveBeenCalledTimes(0)
	})

	test('sendCommand - not open', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		const cmd = new CutCommand(0)
		await expect(socket.sendCommands([cmd])).rejects.toEqual(new Error('Socket process is not open'))

		// connect was called explicitly
		expect(AtemSocketChild).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.connect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.disconnect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.sendPackets).toHaveBeenCalledTimes(0)
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
		expect(AtemSocketChild).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.connect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.disconnect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.sendPackets).toHaveBeenCalledTimes(0)
	})

	test('sendCommand', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear()
		expect(getChild(socket)).toBeTruthy()

		class MockCommand extends BasicWritableCommand<{}> {
			public static readonly rawName = 'TEST'

			public serialize(): Buffer {
				return Buffer.from('test payload')
			}
		}

		const cmd = new MockCommand({})
		;(socket as any)._nextPacketTrackingId = 835
		await socket.sendCommands([cmd])

		// connect was called explicitly
		expect(AtemSocketChild).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.connect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.disconnect).toHaveBeenCalledTimes(0)
		expect(AtemSocketChildSingleton.sendPackets).toHaveBeenCalledTimes(1)

		const expectedBuffer =
			Buffer.from([0, 20]).toString('hex') +
			'0000' +
			Buffer.from('TEST').toString('hex') +
			cmd.serialize().toString('hex')
		expect(AtemSocketChildSingleton.sendPackets).toHaveBeenCalledWith([
			{
				payloadLength: 20,
				payloadHex: expectedBuffer,
				trackingId: 836,
			},
		])
	})

	test('events', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		expect(getChild(socket)).toBeTruthy()

		const disconnect = jest.fn()
		// const log = jest.fn()
		const ack = jest.fn()

		socket.on('disconnect', disconnect)
		socket.on('ackPackets', ack)

		expect(AtemSocketChildSingleton.onDisconnect).toBeDefined()
		await AtemSocketChildSingleton.onDisconnect()
		await clock.tickAsync(0)
		expect(disconnect).toHaveBeenCalledTimes(1)

		expect(AtemSocketChildSingleton.onPacketsAcknowledged).toBeDefined()
		await AtemSocketChildSingleton.onPacketsAcknowledged([{ packetId: 675, trackingId: 98 }])
		await clock.tickAsync(0)
		expect(ack).toHaveBeenCalledTimes(1)
		expect(ack).toHaveBeenCalledWith([98])
	})

	test('receive - init complete', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear(true)
		expect(getChild(socket)).toBeTruthy()

		const error = jest.fn()
		const change = jest.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		const parser = (socket as any)._commandParser as CommandParser
		expect(parser).toBeTruthy()
		const parserSpy = jest.spyOn(parser, 'commandFromRawName')

		const testBuffer = Buffer.from([0, 8, 0, 0, ...Buffer.from('InCm', 'ascii')])
		const pktId = 822
		expect(AtemSocketChildSingleton.onCommandsReceived).toBeDefined()
		await AtemSocketChildSingleton.onCommandsReceived(testBuffer, pktId)
		await clock.tickAsync(0)

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

		const error = jest.fn()
		const change = jest.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		const parser = (socket as any)._commandParser as CommandParser
		expect(parser).toBeTruthy()
		const parserSpy = jest.spyOn(parser, 'commandFromRawName')
		expect(parser.version).toEqual(ProtocolVersion.V7_2) // Default

		const testBuffer = Buffer.from([0, 12, 0, 0, ...Buffer.from('_ver', 'ascii'), 0x01, 0x02, 0x03, 0x04])
		const pktId = 822
		expect(AtemSocketChildSingleton.onCommandsReceived).toBeDefined()
		await AtemSocketChildSingleton.onCommandsReceived(testBuffer, pktId)
		await clock.tickAsync(0)

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

		const error = jest.fn()
		const change = jest.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		const parser = (socket as any)._commandParser as CommandParser
		expect(parser).toBeTruthy()
		const parserSpy = jest.spyOn(parser, 'commandFromRawName')
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
		const pktId = 822
		expect(AtemSocketChildSingleton.onCommandsReceived).toBeDefined()
		await AtemSocketChildSingleton.onCommandsReceived(Buffer.concat([testCmd1, testCmd2]), pktId)
		await clock.tickAsync(0)

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

		const error = jest.fn()
		const change = jest.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		const testBuffer = Buffer.alloc(0)
		const pktId = 822
		expect(AtemSocketChildSingleton.onCommandsReceived).toBeDefined()
		await AtemSocketChildSingleton.onCommandsReceived(testBuffer, pktId)
		await clock.tickAsync(0)

		expect(error).toHaveBeenCalledTimes(0)
		expect(change).toHaveBeenCalledTimes(0)
	})
	test('receive - corrupt', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear(true)
		expect(getChild(socket)).toBeTruthy()

		const error = jest.fn()
		const change = jest.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		const testBuffer = Buffer.alloc(10, 0)
		const pktId = 822
		expect(AtemSocketChildSingleton.onCommandsReceived).toBeDefined()
		await AtemSocketChildSingleton.onCommandsReceived(testBuffer, pktId)
		await clock.tickAsync(0)

		expect(error).toHaveBeenCalledTimes(0)
		expect(change).toHaveBeenCalledTimes(0)
	})
	test('receive - deserialize error', async () => {
		const socket = createSocket()
		expect(getChild(socket)).toBeFalsy()

		await socket.connect()
		mockClear(true)
		expect(getChild(socket)).toBeTruthy()

		const error = jest.fn()
		const change = jest.fn()

		socket.on('error', error)
		socket.on('receivedCommands', change)

		class BrokenCommand extends DeserializedCommand<{}> {
			public static readonly rawName = 'TEST'

			public deserialize(): void {
				throw new Error('Broken command')
			}
			public applyToState(): string[] {
				throw new Error('Method not implemented.')
			}
		}

		const parser = (socket as any)._commandParser as CommandParser
		expect(parser).toBeTruthy()
		const parserSpy = jest.spyOn(parser, 'commandFromRawName')
		parserSpy.mockImplementationOnce(() => new BrokenCommand({}))

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
		const pktId = 822
		expect(AtemSocketChildSingleton.onCommandsReceived).toBeDefined()
		await AtemSocketChildSingleton.onCommandsReceived(Buffer.concat([testCmd1, testCmd2]), pktId)
		await clock.tickAsync(0)

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

		const connect = (socket.connect = jest.fn(async () => Promise.resolve()))

		const disconnected = jest.fn()
		socket.on('disconnect', disconnected)

		expect(ThreadedClassManagerSingleton.handlers).toHaveLength(2) // 2 eventHandlers: 1 for restart, 1 for thread_closed
		// simulate a restart
		ThreadedClassManagerSingleton.handlers.forEach((handler) => handler())

		expect(disconnected).toHaveBeenCalledTimes(1)
		expect(connect).toHaveBeenCalledTimes(1)
	})
	// testIgnore('receive - thread restart with error', async () => {
	// 	const socket = createSocket()
	// 	expect(getChild(socket)).toBeFalsy()

	// 	await socket.connect()
	// 	mockClear()
	// 	expect(getChild(socket)).toBeTruthy()

	// 	const connect = socket.connect = jest.fn(() => Promise.reject('soemthing'))

	// 	const restarted = jest.fn()
	// 	const error = jest.fn()
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
