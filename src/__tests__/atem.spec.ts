/* eslint-disable @typescript-eslint/unbound-method */
import { Atem, DEFAULT_MAX_PACKET_SIZE, DEFAULT_PORT } from '../atem.js'
import { CutCommand } from '../commands/index.js'
import { promisify } from 'util'
import { EventEmitter } from 'events'

import { AtemSocket } from '../lib/atemSocket.js'
jest.mock('../lib/atemSocket.ts')

const setImmediatePromise = promisify(setImmediate)

class MockSocket extends EventEmitter {
	destroy(): void {
		// Nothing
	}
}

describe('Atem', () => {
	beforeEach(() => {
		;(AtemSocket as any).mockClear()
	})

	test('constructor test 1', async () => {
		const conn = new Atem({ disableMultithreaded: true })

		try {
			const socket = (conn as any).socket as AtemSocket
			expect(socket).toBeTruthy()

			expect(AtemSocket).toHaveBeenCalledTimes(1)
			expect(AtemSocket).toHaveBeenCalledWith({
				address: '',
				childProcessTimeout: 600,
				debugBuffers: false,
				disableMultithreaded: true,
				log: (conn as any)._log,
				port: DEFAULT_PORT,
				maxPacketSize: DEFAULT_MAX_PACKET_SIZE,
			})
		} finally {
			await conn.destroy()
		}
	})
	test('constructor test 2', async () => {
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23, maxPacketSize: 500 })

		try {
			const socket = (conn as any).socket as AtemSocket
			expect(socket).toBeTruthy()

			expect(AtemSocket).toHaveBeenCalledTimes(1)
			expect(AtemSocket).toHaveBeenCalledWith({
				address: 'test1',
				childProcessTimeout: 600,
				debugBuffers: true,
				disableMultithreaded: false,
				log: (conn as any)._log,
				port: 23,
				maxPacketSize: 500,
			})
		} finally {
			await conn.destroy()
		}
	})

	test('connect', async () => {
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).socket as AtemSocket
			expect(socket).toBeTruthy()

			socket.connect = jest.fn(() => Promise.resolve(5) as any)

			const res = conn.connect('127.9.8.7', 98)
			expect(await res).toEqual(5)

			expect(socket.connect).toHaveBeenCalledTimes(1)
			expect(socket.connect).toHaveBeenCalledWith('127.9.8.7', 98)
		} finally {
			await conn.destroy()
		}
	})

	test('disconnect', async () => {
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).socket as AtemSocket
			expect(socket).toBeTruthy()

			socket.disconnect = jest.fn(() => Promise.resolve(35) as any)

			const res = await conn.disconnect()
			expect(res).toEqual(35)

			expect(socket.disconnect).toHaveBeenCalledTimes(1)
			expect(socket.disconnect).toHaveBeenCalledWith()
		} finally {
			await conn.destroy()
		}
	})

	test('sendCommand - good', async () => {
		;(AtemSocket as any).mockImplementation(() => new MockSocket())
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).socket as AtemSocket
			expect(socket).toBeTruthy()

			let nextId = 123
			Object.defineProperty(socket, 'nextPacketTrackingId', {
				get: jest.fn(() => nextId++),
				set: jest.fn(),
			})
			expect(socket.nextPacketTrackingId).toEqual(123)

			socket.sendCommands = jest.fn(() => Promise.resolve([124]) as any)

			const sentQueue = (conn as any)._sentQueue as Record<string, unknown>
			expect(Object.keys(sentQueue)).toHaveLength(0)

			const cmd = new CutCommand(0)
			const res = conn.sendCommand(cmd)
			res.catch(() => null) // Dismiss UnhandledPromiseRejection
			await setImmediatePromise()
			expect(Object.keys(sentQueue)).toHaveLength(1)

			expect(socket.sendCommands).toHaveBeenCalledTimes(1)
			expect(socket.sendCommands).toHaveBeenCalledWith([cmd])

			// Trigger the ack, and it should switfy resolve
			socket.emit('ackPackets', [124])
			expect(Object.keys(sentQueue)).toHaveLength(0)

			// Finally, it should now resolve without a timeout
			expect(await res).toBeUndefined()
		} finally {
			await conn.destroy()
		}
	}, 500)

	test('sendCommand - send error', async () => {
		;(AtemSocket as any).mockImplementation(() => new MockSocket())
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).socket as AtemSocket
			expect(socket).toBeTruthy()

			let nextId = 123
			Object.defineProperty(socket, 'nextPacketTrackingId', {
				get: jest.fn(() => nextId++),
				set: jest.fn(),
			})
			expect(socket.nextPacketTrackingId).toEqual(123)

			socket.sendCommands = jest.fn(() => Promise.reject(35) as any)

			const sentQueue = (conn as any)._sentQueue as Record<string, unknown>
			expect(Object.keys(sentQueue)).toHaveLength(0)

			const cmd = new CutCommand(0)
			const res = conn.sendCommand(cmd)
			res.catch(() => null) // Dismiss UnhandledPromiseRejection

			// Send command should be called
			expect(socket.sendCommands).toHaveBeenCalledTimes(1)
			expect(socket.sendCommands).toHaveBeenCalledWith([cmd])

			expect(Object.keys(sentQueue)).toHaveLength(0)

			// Finally, it should now resolve without a timeout
			// Should be the error thrown by sendCommand
			await expect(res).rejects.toBe(35)

			// expect(await res).toEqual(cmd)
		} finally {
			await conn.destroy()
		}
	}, 500)
})
