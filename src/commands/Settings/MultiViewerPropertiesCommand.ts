import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state/index.js'
import { MultiViewerPropertiesState } from '../../state/settings.js'
import { ProtocolVersion, MultiViewerLayout } from '../../enums/index.js'

export class MultiViewerPropertiesCommand extends WritableCommand<MultiViewerPropertiesState> {
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
