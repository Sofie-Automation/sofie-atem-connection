import { DeserializedCommand } from '../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state/index.js'
import { DownstreamKeyerBase } from '../../state/video/downstreamKeyers.js'
import { ProtocolVersion } from '../../enums/index.js'

export class DownstreamKeyStateCommand extends DeserializedCommand<DownstreamKeyerBase> {
	public static readonly rawName = 'DskS'

	public readonly downstreamKeyerId: number

	constructor(downstreamKeyerId: number, properties: DownstreamKeyerBase) {
		super(properties)

		this.downstreamKeyerId = downstreamKeyerId
	}

	public static deserialize(rawCommand: Buffer): DownstreamKeyStateCommand {
		const downstreamKeyerId = rawCommand.readUInt8(0)
		const properties = {
			onAir: rawCommand.readUInt8(1) === 1,
			inTransition: rawCommand.readUInt8(2) === 1,
			isAuto: rawCommand.readUInt8(3) === 1,
			remainingFrames: rawCommand.readUInt8(4),
		}

		return new DownstreamKeyStateCommand(downstreamKeyerId, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.downstreamKeyerId >= state.info.capabilities.downstreamKeyers) {
			throw new InvalidIdError('DownstreamKeyer', this.downstreamKeyerId)
		}

		state.video.downstreamKeyers[this.downstreamKeyerId] = {
			...AtemStateUtil.getDownstreamKeyer(state, this.downstreamKeyerId),
			...this.properties,
		}
		return `video.downstreamKeyers.${this.downstreamKeyerId}`
	}
}

export class DownstreamKeyStateV8Command extends DeserializedCommand<DownstreamKeyerBase> {
	public static readonly rawName = 'DskS'
	public static readonly minimumVersion = ProtocolVersion.V8_0_1

	public readonly downstreamKeyerId: number

	constructor(downstreamKeyerId: number, properties: DownstreamKeyerBase) {
		super(properties)

		this.downstreamKeyerId = downstreamKeyerId
	}

	public static deserialize(rawCommand: Buffer): DownstreamKeyStateV8Command {
		const downstreamKeyerId = rawCommand.readUInt8(0)
		const properties = {
			onAir: rawCommand.readUInt8(1) === 1,
			inTransition: rawCommand.readUInt8(2) === 1,
			isAuto: rawCommand.readUInt8(3) === 1,
			isTowardsOnAir: rawCommand.readUInt8(4) === 1,
			remainingFrames: rawCommand.readUInt8(5),
		}

		return new DownstreamKeyStateV8Command(downstreamKeyerId, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.capabilities || this.downstreamKeyerId >= state.info.capabilities.downstreamKeyers) {
			throw new InvalidIdError('DownstreamKeyer', this.downstreamKeyerId)
		}

		state.video.downstreamKeyers[this.downstreamKeyerId] = {
			...AtemStateUtil.getDownstreamKeyer(state, this.downstreamKeyerId),
			...this.properties,
		}
		return `video.downstreamKeyers.${this.downstreamKeyerId}`
	}
}
