import { DisplayClockProperties } from '../../state/displayClock.js'
import { WritableCommand } from '../CommandBase.js'

export interface DisplayClockPropertiesExt extends DisplayClockProperties {
	startFromFrames: number
}

export class DisplayClockPropertiesSetCommand extends WritableCommand<DisplayClockPropertiesExt> {
	public static MaskFlags = {
		enabled: 1 << 0,
		size: 1 << 1,
		opacity: 1 << 2,
		positionX: 1 << 3,
		positionY: 1 << 4,
		autoHide: 1 << 5,
		startFrom: 1 << 6,
		startFromFrames: 1 << 7,
		clockMode: 1 << 8,
	}
	public static readonly rawName = 'DCPC'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(28)

		// Future: id at byte 2

		buffer.writeUint16BE(this.flag, 0)
		buffer.writeUint8(this.properties.enabled ? 1 : 0, 3)
		buffer.writeUint8(this.properties.size ?? 0, 5)
		buffer.writeUint8(this.properties.opacity ?? 0, 7)
		buffer.writeInt16BE(this.properties.positionX ?? 0, 8)
		buffer.writeInt16BE(this.properties.positionY ?? 0, 10)
		buffer.writeUint8(this.properties.autoHide ? 1 : 0, 12)

		buffer.writeUint8(this.properties.startFrom?.hours ?? 0, 13)
		buffer.writeUint8(this.properties.startFrom?.minutes ?? 0, 14)
		buffer.writeUint8(this.properties.startFrom?.seconds ?? 0, 15)
		buffer.writeUint8(this.properties.startFrom?.frames ?? 0, 16)

		buffer.writeUint32BE(this.properties.startFromFrames ?? 0, 20)

		buffer.writeUint8(this.properties.clockMode ?? 0, 24)

		return buffer
	}
}
