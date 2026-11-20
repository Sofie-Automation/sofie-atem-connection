import type { OutboundPacketInfo } from './atemSocketChild.js'

/**
 * Messages sent from the parent thread to the worker (AtemSocketChild).
 */
export interface ParentToChildIpc {
	connect: (data: { address: string; port: number }) => void
	disconnect: (data: Record<string, never>) => void
	sendPackets: (data: { packets: OutboundPacketInfo[] }) => never
}

/**
 * Messages sent from the worker (AtemSocketChild) to the parent thread.
 * All are fire-and-forget (return never).
 */
export interface ChildToParentIpc {
	onDisconnect: (data: Record<string, never>) => never
	onLog: (data: { message: string }) => never
	onCommandsReceived: (data: { payload: Uint8Array }) => never
	onPacketsAcknowledged: (data: { ids: Array<{ packetId: number; trackingId: number }> }) => never
}
