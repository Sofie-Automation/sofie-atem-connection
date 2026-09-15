import { DeserializedCommand } from '../CommandBase'
import { AtemState } from '../../state'
import { AtemCapabilites } from '../../state/info'
import { ProtocolVersion } from '../../enums'
import { Mutable } from '../../lib/types'

/**
 * The offsets of each field, for one layout of the command.
 * mixEffects..mediaPlayers are at 0..5 in every layout.
 * Fields which are not present in a layout are omitted, and are left at their default value.
 */
interface TopologyLayout {
	multiviewers?: number
	serialPorts: number
	maxHyperdecks: number
	DVEs: number
	stingers: number
	superSources: number
	talkbackChannels?: number
	cameraControl?: number
	advancedChromaKeyers?: number
	onlyConfigurableOutputs?: number
}

/** v8.1.1 moved the multiviewer count into this command, shifting everything after it */
const LAYOUT_V8_1_1: TopologyLayout = {
	multiviewers: 6,
	serialPorts: 7,
	maxHyperdecks: 8,
	DVEs: 9,
	stingers: 10,
	superSources: 11,
	talkbackChannels: 13,
	cameraControl: 18,
	advancedChromaKeyers: 22,
	onlyConfigurableOutputs: 23,
}

/** v8.0 inserted a byte after superSources */
const LAYOUT_V8_0: TopologyLayout = {
	serialPorts: 6,
	maxHyperdecks: 7,
	DVEs: 8,
	stingers: 9,
	superSources: 10,
	talkbackChannels: 12,
	cameraControl: 17,
	advancedChromaKeyers: 21,
	onlyConfigurableOutputs: 22,
}

const LAYOUT_V7_5_2: TopologyLayout = {
	serialPorts: 6,
	maxHyperdecks: 7,
	DVEs: 8,
	stingers: 9,
	superSources: 10,
	talkbackChannels: 11,
	cameraControl: 16,
	advancedChromaKeyers: 20,
	onlyConfigurableOutputs: 21,
}

/**
 * v7.2 has a shorter body again, and only one capture of it exists.
 * Neither the v7.5.2 layout nor an unshifted reading of it is self consistent past superSources,
 * so nothing beyond that is claimed here. LibAtem does the same.
 */
const LAYOUT_V7_2: TopologyLayout = {
	serialPorts: 6,
	maxHyperdecks: 7,
	DVEs: 8,
	stingers: 9,
	superSources: 10,
}

function getLayout(version: ProtocolVersion): TopologyLayout {
	if (version >= ProtocolVersion.V8_1_1) return LAYOUT_V8_1_1
	if (version >= ProtocolVersion.V8_0) return LAYOUT_V8_0
	if (version >= ProtocolVersion.V7_5_2) return LAYOUT_V7_5_2
	return LAYOUT_V7_2
}

export class TopologyCommand extends DeserializedCommand<AtemCapabilites & { multiviewers: number }> {
	public static readonly rawName = '_top'

	public static deserialize(rawCommand: Buffer, version: ProtocolVersion): TopologyCommand {
		const layout = getLayout(version)

		/** Older firmwares send a shorter body, so the later fields can be missing */
		const readOptional = (index: number | undefined): number | undefined =>
			index !== undefined && index < rawCommand.length ? rawCommand.readUInt8(index) : undefined

		const properties: Mutable<TopologyCommand['properties']> = {
			mixEffects: rawCommand.readUInt8(0),
			sources: rawCommand.readUInt8(1),
			downstreamKeyers: rawCommand.readUInt8(2),
			auxilliaries: rawCommand.readUInt8(3),
			mixMinusOutputs: rawCommand.readUInt8(4),
			mediaPlayers: rawCommand.readUInt8(5),
			multiviewers: readOptional(layout.multiviewers) ?? -1,
			serialPorts: rawCommand.readUInt8(layout.serialPorts),
			maxHyperdecks: rawCommand.readUInt8(layout.maxHyperdecks),
			DVEs: rawCommand.readUInt8(layout.DVEs),
			stingers: rawCommand.readUInt8(layout.stingers),
			superSources: rawCommand.readUInt8(layout.superSources),
			talkbackChannels: readOptional(layout.talkbackChannels) ?? 0,
			cameraControl: readOptional(layout.cameraControl) === 1,
			advancedChromaKeyers: readOptional(layout.advancedChromaKeyers) === 1,
			onlyConfigurableOutputs: readOptional(layout.onlyConfigurableOutputs) === 1,
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
