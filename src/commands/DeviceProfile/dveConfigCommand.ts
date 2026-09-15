import { DeserializedCommand } from '../CommandBase'
import { AtemState } from '../../state'
import { DVEInfo } from '../../state/info'
import { DVEEffect } from '../../enums'

export class DVEConfigCommand extends DeserializedCommand<DVEInfo> {
	public static readonly rawName = '_DVE'

	constructor(properties: DVEInfo) {
		super(properties)
	}

	public static deserialize(rawCommand: Buffer): DVEConfigCommand {
		const effectCount = rawCommand.readUInt16BE(2)

		const supportedEffects: DVEEffect[] = []
		for (let i = 0; i < effectCount; i++) {
			supportedEffects.push(rawCommand.readUInt8(4 + i))
		}

		return new DVEConfigCommand({
			canRotate: rawCommand.readUInt8(0) !== 0,
			canScaleUp: rawCommand.readUInt8(1) !== 0,
			supportedEffects,
		})
	}

	public applyToState(state: AtemState): string {
		state.info.dve = this.properties

		return `info.dve`
	}
}
