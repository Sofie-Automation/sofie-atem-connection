import { WritableCommand } from '../CommandBase'
import { FairlightDynamicsResetProps } from './common'

export class FairlightMixerMasterDynamicsResetCommand extends WritableCommand<FairlightDynamicsResetProps> {
	public static MaskFlags = {
		dynamics: 1 << 0,
		expander: 1 << 1,
		compressor: 1 << 2,
		limiter: 1 << 3,
	}

	public static readonly rawName = 'RMOD'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)

		let val = 0
		if (this.properties.dynamics) {
			val |= 1 << 0
		}
		if (this.properties.expander) {
			val |= 1 << 1
		}
		if (this.properties.compressor) {
			val |= 1 << 2
		}
		if (this.properties.limiter) {
			val |= 1 << 3
		}

		buffer.writeUInt8(val, 1)
		return buffer
	}
}
