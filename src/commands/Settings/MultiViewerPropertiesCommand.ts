import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state/index.js'
import { MultiViewerPropertiesState } from '../../state/settings.js'
import { ProtocolVersion, MultiViewerLayout } from '../../enums/index.js'

export class MultiViewerPropertiesCommand extends WritableCommand<Omit<MultiViewerPropertiesState, 'safeAreaEnabled'>> {
	public static MaskFlags = {
		layout: 1 << 0,
		programPreviewSwapped: 1 << 1,
	}

	public static readonly rawName = 'CMvP'
	public static readonly minimumVersion = ProtocolVersion.V8_0

	public readonly multiViewerId: number

	constructor(multiviewerId: number) {
		super()

		this.multiViewerId = multiviewerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.multiViewerId, 1)
		buffer.writeUInt8(this.properties.layout || 0, 2)
		buffer.writeUInt8(this.properties.programPreviewSwapped ? 1 : 0, 3)
		return buffer
	}
}

export class MultiViewerPropertiesUpdateCommand extends DeserializedCommand<MultiViewerPropertiesState> {
	public static readonly rawName = 'MvPr'
	public static readonly minimumVersion = ProtocolVersion.V8_0

	public readonly multiViewerId: number

	constructor(multiviewerId: number, properties: MultiViewerPropertiesState) {
		super(properties)

		this.multiViewerId = multiviewerId
	}

	public static deserialize(rawCommand: Buffer): MultiViewerPropertiesUpdateCommand {
		const multiViewerId = rawCommand.readUInt8(0)
		const properties = {
			layout: rawCommand.readUInt8(1) as MultiViewerLayout,
			programPreviewSwapped: rawCommand.readUInt8(2) > 0,
		}

		return new MultiViewerPropertiesUpdateCommand(multiViewerId, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.multiviewer || this.multiViewerId >= state.info.multiviewer.count) {
			throw new InvalidIdError('MultiViewer', this.multiViewerId)
		}

		const multiviewer = AtemStateUtil.getMultiViewer(state, this.multiViewerId)
		multiviewer.properties = this.properties

		return `settings.multiViewers.${this.multiViewerId}.properties`
	}
}

/**
 * Before 8.0 the safe area was a property of the whole multiviewer, rather than of each window
 */
export class MultiViewerPropertiesV7Command extends WritableCommand<MultiViewerPropertiesState> {
	// Unverified: the bits are assumed to follow the field order, as they do for 8.0
	public static MaskFlags = {
		layout: 1 << 0,
		safeAreaEnabled: 1 << 1,
		programPreviewSwapped: 1 << 2,
	}

	public static readonly rawName = 'CMvP'

	public readonly multiViewerId: number

	constructor(multiviewerId: number) {
		super()

		this.multiViewerId = multiviewerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.multiViewerId, 1)
		buffer.writeUInt8(this.properties.layout || 0, 2)
		buffer.writeUInt8(this.properties.safeAreaEnabled ? 1 : 0, 3)
		buffer.writeUInt8(this.properties.programPreviewSwapped ? 1 : 0, 4)
		return buffer
	}
}

export class MultiViewerPropertiesUpdateV7Command extends DeserializedCommand<MultiViewerPropertiesState> {
	public static readonly rawName = 'MvPr'

	public readonly multiViewerId: number

	constructor(multiviewerId: number, properties: MultiViewerPropertiesState) {
		super(properties)

		this.multiViewerId = multiviewerId
	}

	public static deserialize(rawCommand: Buffer): MultiViewerPropertiesUpdateV7Command {
		const multiViewerId = rawCommand.readUInt8(0)
		const properties = {
			layout: rawCommand.readUInt8(1) as MultiViewerLayout,
			safeAreaEnabled: rawCommand.readUInt8(2) > 0,
			programPreviewSwapped: rawCommand.readUInt8(3) > 0,
		}

		return new MultiViewerPropertiesUpdateV7Command(multiViewerId, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.info.multiviewer || this.multiViewerId >= state.info.multiviewer.count) {
			throw new InvalidIdError('MultiViewer', this.multiViewerId)
		}

		const multiviewer = AtemStateUtil.getMultiViewer(state, this.multiViewerId)
		multiviewer.properties = this.properties

		return `settings.multiViewers.${this.multiViewerId}.properties`
	}
}
