import { DeserializedCommand } from '../CommandBase.js'
import { AtemState } from '../../state/index.js'
import { AtemCapabilites } from '../../state/info.js'
import { ProtocolVersion } from '../../enums/index.js'
import { Mutable } from '../../lib/types.js'

export class TopologyCommand extends DeserializedCommand<AtemCapabilites & { multiviewers: number }> {
	public static readonly rawName = '_top'

	public static deserialize(rawCommand: Buffer, version: ProtocolVersion): TopologyCommand {
		const v230offset = version > ProtocolVersion.V8_0_1 ? 1 : 0
		const properties: Mutable<TopologyCommand['properties']> = {
			mixEffects: rawCommand.readUInt8(0),
			sources: rawCommand.readUInt8(1),
			downstreamKeyers: rawCommand.readUInt8(2),
			auxilliaries: rawCommand.readUInt8(3),
			mixMinusOutputs: rawCommand.readUInt8(4),
			mediaPlayers: rawCommand.readUInt8(5),
			multiviewers: v230offset > 0 ? rawCommand.readUInt8(6) : -1,
			serialPorts: rawCommand.readUInt8(6 + v230offset),
			maxHyperdecks: rawCommand.readUInt8(7 + v230offset),
			DVEs: rawCommand.readUInt8(8 + v230offset),
			stingers: rawCommand.readUInt8(9 + v230offset),
			superSources: rawCommand.readUInt8(10 + v230offset),
			talkbackChannels: rawCommand.readUInt8(12 + v230offset),

			cameraControl: rawCommand.readUInt8(17 + v230offset) === 1,

			// Note: these are defined below as they can overflow in older firmwares
			advancedChromaKeyers: false,
			onlyConfigurableOutputs: false,
		}

		// in 7.4?
		if (rawCommand.length > 20) {
			properties.advancedChromaKeyers = rawCommand.readUInt8(21 + v230offset) === 1
			properties.onlyConfigurableOutputs = rawCommand.readUInt8(22 + v230offset) === 1
		}

		return new TopologyCommand(properties)
	}

	public applyToState(state: AtemState): string {
		state.info.capabilities = {
			...state.info.capabilities,
			...this.properties,
		}
		if (this.properties.multiviewers > 0) {
			state.info.multiviewer = {
				windowCount: 10,
				...state.info.multiviewer,
				count: this.properties.multiviewers,
			}
		}
		return `info.capabilities`
	}
}
