/* eslint-disable @typescript-eslint/unbound-method */
import { EventEmitter } from 'events'
import { promisify } from 'util'

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { Atem, DEFAULT_MAX_PACKET_SIZE, DEFAULT_PORT } from '../atem.js'
import { CutCommand, ProductIdentifierCommand, VersionCommand } from '../commands/index.js'
import { Model, ProtocolVersion } from '../enums/index.js'
import { createInProcessChild } from '../lib/__tests__/atemSocketChildFake.js'
import { AtemSocket } from '../lib/atemSocket.js'

vi.mock('../lib/atemSocket.js')

const setImmediatePromise = promisify(setImmediate)

class MockSocket extends EventEmitter {
	destroy(): void {
		// Nothing
	}
}

describe('Atem', () => {
	beforeEach(() => {
		vi.mocked(AtemSocket).mockClear()
	})

	test('constructor test 1', async () => {
		const conn = new Atem({ createChildBridge: createInProcessChild })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			expect(AtemSocket).toHaveBeenCalledTimes(1)
			expect(AtemSocket).toHaveBeenCalledWith({
				address: '',
				debugBuffers: false,
				port: DEFAULT_PORT,
				maxPacketSize: DEFAULT_MAX_PACKET_SIZE,
				workerFilePath: undefined,
				createChildBridge: createInProcessChild,
			})
		} finally {
			await conn.destroy()
		}
	})
	test('constructor test 2', async () => {
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23, maxPacketSize: 500 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			expect(AtemSocket).toHaveBeenCalledTimes(1)
			expect(AtemSocket).toHaveBeenCalledWith({
				address: 'test1',
				debugBuffers: true,
				port: 23,
				maxPacketSize: 500,
				workerFilePath: undefined,
				createChildBridge: undefined,
			})
		} finally {
			await conn.destroy()
		}
	})

	test('connect', async () => {
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			socket.connect = vi.fn(() => Promise.resolve(5) as any)

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
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			socket.disconnect = vi.fn(() => Promise.resolve(35) as any)

			const res = await conn.disconnect()
			expect(res).toEqual(35)

			expect(socket.disconnect).toHaveBeenCalledTimes(1)
			expect(socket.disconnect).toHaveBeenCalledWith()
		} finally {
			await conn.destroy()
		}
	})

	test('sendCommand - good', async () => {
		vi.mocked(AtemSocket).mockImplementation(function () {
			return new MockSocket() as any
		})
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			let nextId = 123
			Object.defineProperty(socket, 'nextPacketTrackingId', {
				get: vi.fn(() => nextId++),
				set: vi.fn(),
			})
			expect(socket.nextPacketTrackingId).toEqual(123)

			socket.sendCommands = vi.fn(() => Promise.resolve([124]) as any)

			const sentQueue = (conn as any).client._sentQueue as Record<string, unknown>
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

	test('sendCommand - rejects when the connection is lost before the ack', async () => {
		vi.mocked(AtemSocket).mockImplementation(function () {
			return new MockSocket() as any
		})
		const conn = new Atem({ address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			socket.sendCommands = vi.fn(() => Promise.resolve([124, 125]) as any)

			const res = conn.sendCommand(new CutCommand(0))
			await setImmediatePromise()

			// One packet is acked, then the connection drops before the other is
			socket.emit('ackPackets', [124])
			socket.emit('disconnect')

			await expect(res).rejects.toThrow('Connection lost before the command was acknowledged')
			expect(Object.keys((conn as any).client._sentQueue)).toHaveLength(0)
		} finally {
			await conn.destroy()
		}
	})

	test('a helper with nothing to change sends nothing, and resolves', async () => {
		vi.mocked(AtemSocket).mockImplementation(function () {
			return new MockSocket() as any
		})
		const conn = new Atem({ address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			socket.sendCommands = vi.fn(() => Promise.resolve([]) as any)

			await expect(conn.setInputSettings({})).resolves.toBeUndefined()
			expect(socket.sendCommands).not.toHaveBeenCalled()
		} finally {
			await conn.destroy()
		}
	})

	test('sendCommand - send error', async () => {
		vi.mocked(AtemSocket).mockImplementation(function () {
			return new MockSocket() as any
		})
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			let nextId = 123
			Object.defineProperty(socket, 'nextPacketTrackingId', {
				get: vi.fn(() => nextId++),
				set: vi.fn(),
			})
			expect(socket.nextPacketTrackingId).toEqual(123)

			// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
			socket.sendCommands = vi.fn(() => Promise.reject(35) as any)

			const sentQueue = (conn as any).client._sentQueue as Record<string, unknown>
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

	test('sendCommands - default group sent together in a single call', async () => {
		vi.mocked(AtemSocket).mockImplementation(function () {
			return new MockSocket() as any
		})
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			socket.sendCommands = vi.fn(() => Promise.resolve([]) as any)

			// All commands use the default runOrderGroup (0), so they are sent as one batch
			const cmds = [new CutCommand(0), new CutCommand(1), new CutCommand(2)]
			await conn.sendCommands(cmds)

			expect(socket.sendCommands).toHaveBeenCalledTimes(1)
			expect(socket.sendCommands).toHaveBeenCalledWith(cmds)
		} finally {
			await conn.destroy()
		}
	})

	test('sendCommands - splits by runOrderGroup and sends groups in ascending numeric order', async () => {
		vi.mocked(AtemSocket).mockImplementation(function () {
			return new MockSocket() as any
		})
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			socket.sendCommands = vi.fn(() => Promise.resolve([]) as any)

			const mk = (group: number): CutCommand => {
				const cmd = new CutCommand(0)
				cmd.runOrderGroup = group
				return cmd
			}

			// Deliberately out of order, mixing a negative and a multi-digit group.
			// A lexicographic sort would place group 10 before group 2 - this catches that.
			const gNeg = mk(-5)
			const g0a = mk(0)
			const g0b = mk(0)
			const g2 = mk(2)
			const g10 = mk(10)

			await conn.sendCommands([g10, g2, g0a, gNeg, g0b])

			// One socket.sendCommands call per group, ordered by ascending runOrderGroup,
			// with same-group commands preserving their original input order
			const callArgs = (socket.sendCommands as ReturnType<typeof vi.fn>).mock.calls.map((call) => call[0])
			expect(callArgs).toEqual([[gNeg], [g0a, g0b], [g2], [g10]])
		} finally {
			await conn.destroy()
		}
	})

	test('a throwing event listener does not stop the state from updating', async () => {
		vi.mocked(AtemSocket).mockImplementation(function () {
			return new MockSocket() as any
		})
		const conn = new Atem({ address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket

			const errors: string[] = []
			conn.on('error', (e) => errors.push(e))
			conn.on('receivedCommands', () => {
				throw new Error('listener failed')
			})

			socket.emit('receivedCommands', [
				new ProductIdentifierCommand({ productIdentifier: 'test', model: Model.Mini }),
			])

			expect(conn.state?.info.productIdentifier).toEqual('test')
			expect(errors).toEqual([`Error in 'receivedCommands' event handler: Error: listener failed`])
		} finally {
			await conn.destroy()
		}
	})

	test('disconnected is only emitted once per lost connection', async () => {
		vi.mocked(AtemSocket).mockImplementation(function () {
			return new MockSocket() as any
		})
		const conn = new Atem({ address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			const disconnected = vi.fn()
			conn.on('disconnected', disconnected)

			// Never connected, eg the atem is unreachable, or disconnect() followed by destroy()
			socket.emit('disconnect')
			socket.emit('disconnect')
			expect(disconnected).toHaveBeenCalledTimes(0)

			// Connection starts, then is lost and the reconnect attempts fail
			socket.emit('receivedCommands', [new VersionCommand(ProtocolVersion.V8_0)])
			socket.emit('disconnect')
			socket.emit('disconnect')
			expect(disconnected).toHaveBeenCalledTimes(1)
		} finally {
			await conn.destroy()
		}
	})
})
