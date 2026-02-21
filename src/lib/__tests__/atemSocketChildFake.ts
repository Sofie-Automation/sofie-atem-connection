/**
 * Fake AtemSocketChild for tests.
 *
 * This file may be loaded twice: once by Vitest's module system (for the test's
 * imports) and once by Node's native import() inside threadedclass's worker.js.
 * We use globalThis to share spy instances across both module contexts.
 */
import { vi } from 'vitest'
import type { OutboundPacketInfo } from '../atemSocketChild.js'

type MockCallbacks = {
	onDisconnect: () => Promise<void>
	onLog: (message: string) => Promise<void>
	onCommandsReceived: (payload: Buffer, packetId: number) => Promise<void>
	onPacketsAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>
}

// eslint-disable-next-line no-var
declare global {
	var __atemSocketFake: {
		mockConnect: ReturnType<typeof vi.fn>
		mockDisconnect: ReturnType<typeof vi.fn>
		mockSendPackets: ReturnType<typeof vi.fn>
		mockConstructor: ReturnType<typeof vi.fn>
		mockCallbacks: MockCallbacks
	}
}

// Initialise on first load (always the Vitest context, which has vi.fn available)
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

// mockCallbacks is a live proxy so reassignment in resetMocks/constructor is always visible
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
	fake.mockCallbacks = {
		onDisconnect: async () => undefined,
		onLog: async () => undefined,
		onCommandsReceived: async () => undefined,
		onPacketsAcknowledged: async () => undefined,
	}
}

export class AtemSocketChild {
	constructor(
		options: { address: string; port: number; debugBuffers: boolean },
		onDisconnect: () => Promise<void>,
		onLog: (message: string) => Promise<void>,
		onCommandReceived: (payload: Buffer, packetId: number) => Promise<void>,
		onCommandAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>
	) {
		fake.mockConstructor(options, onDisconnect, onLog, onCommandReceived, onCommandAcknowledged)
		fake.mockCallbacks = {
			onDisconnect,
			onLog,
			onCommandsReceived: onCommandReceived,
			onPacketsAcknowledged: onCommandAcknowledged,
		}
	}

	async connect(address: string, port: number): Promise<void> {
		return fake.mockConnect(address, port)
	}

	async disconnect(): Promise<void> {
		return fake.mockDisconnect()
	}

	sendPackets(packets: OutboundPacketInfo[]): void {
		return fake.mockSendPackets(packets)
	}
}
