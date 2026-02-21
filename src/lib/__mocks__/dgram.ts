import { RemoteInfo, SocketOptions, SocketType } from 'dgram'
import { EventEmitter } from 'events'

import { expect, vi } from 'vitest'

import { DEFAULT_PORT } from '../../atem.js'

export class Socket extends EventEmitter {
	public isOpen = false

	public expectedAddress?: string
	public expectedPort?: number

	constructor() {
		super()
	}

	public sendImpl?: (msg: Buffer) => void

	public async emitMessage(msg: Buffer): Promise<void> {
		expect(Buffer.isBuffer(msg)).toBeTruthy()

		const rinfo: RemoteInfo = {
			address: this.expectedAddress || '127.0.0.1',
			port: this.expectedPort || DEFAULT_PORT,
			family: 'IPv4',
			size: msg.length,
		}
		this.emit('message', msg, rinfo)

		await vi.advanceTimersByTimeAsync(0)
	}

	public bind(port?: number, address?: string, callback?: () => void): void {
		expect(port).toBeUndefined()
		expect(address).toBeUndefined()
		expect(callback).toBeUndefined()

		this.isOpen = true
	}

	public send(
		msg: string | Uint8Array,
		offset: number,
		length: number,
		port: number,
		address?: string,
		callback?: (error: Error | null, bytes: number) => void
	): void {
		expect(Buffer.isBuffer(msg)).toBeTruthy()
		expect(offset).toBeTypeOf('number')
		expect(length).toBeTypeOf('number')
		expect(port).toBeTypeOf('number')
		expect(address).toBeTypeOf('string')
		expect(callback).toBeUndefined()

		if (this.expectedAddress) {
			expect(address).toEqual(this.expectedAddress)
		}
		if (this.expectedPort) {
			expect(port).toEqual(this.expectedPort)
		}

		if (this.sendImpl) {
			this.sendImpl(msg as Buffer)
		}
	}

	public close(cb?: () => void): void {
		this.isOpen = false
		if (cb) cb()
	}
}

export function createSocket(
	options: SocketType | SocketOptions,
	callback?: (msg: Buffer, rinfo: RemoteInfo) => void
): Socket {
	expect(typeof options === 'string' ? options : options.type).toEqual('udp4')
	expect(callback).toBeUndefined()

	return new Socket()
}
