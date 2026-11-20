/**
 * Fake child bridge for in-process use in tests.
 *
 * Pass `createInProcessChild` as `createChildBridge` in AtemOptions/AtemSocketOptions
 * to wire an in-memory bridge instead of spawning a real worker thread.
 */
import { vi } from 'vitest'
import type { Mock } from 'vitest'

import type { ChildBridgeFactory, ChildBridgeHandle } from '../atemSocket.js'
import type { OutboundPacketInfo } from '../atemSocketChild.js'

type AnyMock = Mock<(...args: any[]) => any>

type MockCallbacks = {
	onDisconnect: () => Promise<void>
	onLog: (message: string) => Promise<void>
	onCommandsReceived: (payload: Buffer) => Promise<void>
	onPacketsAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>
}

declare global {
	var __atemSocketFake: {
		mockConnect: AnyMock
		mockDisconnect: AnyMock
		mockSendPackets: AnyMock
		mockConstructor: AnyMock
		mockCallbacks: MockCallbacks
	}
}

if (!globalThis.__atemSocketFake) {
	globalThis.__atemSocketFake = {
		mockConnect: vi.fn(async () => undefined),
		mockDisconnect: vi.fn(async () => undefined),
		mockSendPackets: vi.fn(() => null),
		mockConstructor: vi.fn(),
		mockCallbacks: {
			onDisconnect: async () => undefined,
			onLog: async () => undefined,
			onCommandsReceived: async () => undefined,
			onPacketsAcknowledged: async () => undefined,
		},
	}
}

const fake = globalThis.__atemSocketFake

export const mockConnect = fake.mockConnect
export const mockDisconnect = fake.mockDisconnect
export const mockSendPackets = fake.mockSendPackets
export const mockConstructor = fake.mockConstructor

// mockCallbacks is a live proxy so reassignment in resetMocks/createInProcessChild is always visible
export const mockCallbacks = new Proxy({} as MockCallbacks, {
	get(_: MockCallbacks, prop: string | symbol) {
		return (fake.mockCallbacks as Record<string | symbol, unknown>)[prop]
	},
})

export function getMockCallbacks(): MockCallbacks {
	return fake.mockCallbacks
}

export function resetMocks(): void {
	fake.mockConnect.mockReset().mockImplementation(() => undefined)
	fake.mockDisconnect.mockReset().mockImplementation(() => undefined)
	fake.mockSendPackets.mockReset().mockReturnValue(null)
	fake.mockConstructor.mockReset()
	// Do not reset fake.mockCallbacks here — they are owned by the bridge lifecycle
	// and get updated when createInProcessChild is called during socket.connect().
}

/**
 * In-process child bridge factory. Pass as `createChildBridge` in AtemSocketOptions/AtemOptions.
 */
export const createInProcessChild: ChildBridgeFactory = (options, callbacks): ChildBridgeHandle => {
	fake.mockConstructor(options)

	// Wire the parent's callbacks so tests can trigger them via mockCallbacks
	fake.mockCallbacks = {
		onDisconnect: async () => callbacks.onDisconnect(),
		onLog: async (message: string) => callbacks.onLog(message),
		onCommandsReceived: async (payload: Buffer) => callbacks.onCommandsReceived(new Uint8Array(payload)),
		onPacketsAcknowledged: async (ids: Array<{ packetId: number; trackingId: number }>) =>
			callbacks.onPacketsAcknowledged(ids),
	}

	return {
		connect: async (address: string, port: number) => {
			await fake.mockConnect(address, port)
		},
		disconnect: async () => {
			await fake.mockDisconnect()
		},
		sendPackets: (packets: OutboundPacketInfo[]) => {
			fake.mockSendPackets(packets)
		},
	}
}
