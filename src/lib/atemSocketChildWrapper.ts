import { AtemSocketChild, OutboundPacketInfo } from './atemSocketChild'

export class SocketWorkerApi {
	private wrappedChild: AtemSocketChild | undefined

	public async init(
		debugBuffers: boolean,
		onDisconnect: () => Promise<void>,
		onLog: (message: string) => Promise<void>,
		onCommandsReceived: (payload: Buffer) => Promise<void>,
		onPacketsAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>
	): Promise<void> {
		if (this.wrappedChild) throw new Error('Already initialised!')

		this.wrappedChild = new AtemSocketChild(
			{
				debugBuffers,
			},
			onDisconnect,
			onLog,
			onCommandsReceived,
			onPacketsAcknowledged
		)
	}

	public async connect(address: string, port: number): Promise<void> {
		if (!this.wrappedChild) throw new Error('Not initialised!')

		await this.wrappedChild.connect(address, port)
	}

	public async disconnect(): Promise<void> {
		if (!this.wrappedChild) throw new Error('Not initialised!')

		await this.wrappedChild.disconnect()
	}

	public async sendPackets(packets: OutboundPacketInfo[]): Promise<void> {
		if (!this.wrappedChild) throw new Error('Not initialised!')

		this.wrappedChild.sendPackets(packets)
	}
}
