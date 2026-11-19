import { DeserializedCommand } from '../CommandBase'
import { AtemState } from '../../state'
import * as Util from '../../lib/atemUtil'
import { Enums } from '../..'
import { DeviceInfo } from '../../state/info'

export class ProductIdentifierCommand extends DeserializedCommand<Pick<DeviceInfo, 'model' | 'productIdentifier'>> {
	public static readonly rawName = '_pin'

	public static deserialize(rawCommand: Buffer): ProductIdentifierCommand {
		const properties = {
			productIdentifier: Util.bufToNullTerminatedString(rawCommand, 0, 40),
			model: rawCommand.readUInt8(40),
		}

		return new ProductIdentifierCommand(properties)
	}

	public applyToState(state: AtemState): string {
		state.info.productIdentifier = this.properties.productIdentifier
		state.info.model = this.properties.model

		// Model specific features that aren't specified by the protocol
		switch (state.info.model) {
			case Enums.Model.TwoME:
			case Enums.Model.TwoME4K:
			case Enums.Model.TwoMEBS4K:
			case Enums.Model.Constellation:
			case Enums.Model.Constellation8K:
			case Enums.Model.ConstellationHD4ME:
			case Enums.Model.Constellation4K4ME:
			case Enums.Model.Constellation4K4MEPlus:
				state.info.power = [false, false]
				break
			default:
				state.info.power = [false]
				break
		}

		return `info`
	}
}
