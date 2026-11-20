import { BasicWritableCommand } from '../CommandBase.js'

export class FairlightMixerResetPeakLevelsCommand extends BasicWritableCommand<{ all: boolean; master: boolean }> {
	public static readonly rawName = 'RFLP'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)

		let val = 0
		if (this.properties.all) {
			val |= 1 << 0

			// some magic number that is needed for this to work
			buffer.writeUInt8(0x01, 1)
		}
		if (this.properties.master) {
			val |= 1 << 1

			// some magic number that is needed for this to work
			buffer.writeUInt8(0x04, 3)
		}

		buffer.writeUInt8(val, 0)
		return buffer
	}
}
