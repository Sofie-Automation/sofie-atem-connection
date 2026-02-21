import { SymmetricalCommand } from '../CommandBase.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { ProtocolVersion } from '../../enums/index.js'

export class RecordingISOCommand extends SymmetricalCommand<{ recordAllInputs: boolean }> {
	public static readonly rawName = 'ISOi'
	public static readonly minimumVersion = ProtocolVersion.V8_1_1

	constructor(recordAllInputs: boolean) {
		super({ recordAllInputs })
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.properties.recordAllInputs ? 1 : 0, 0)
		return buffer
	}

	public static deserialize(rawCommand: Buffer): RecordingISOCommand {
		const recordAllInputs = rawCommand.readUInt8(0) > 0

		return new RecordingISOCommand(recordAllInputs)
	}

	public applyToState(state: AtemState): string {
		if (!state.recording) {
			throw new InvalidIdError('Recording')
		}

		state.recording.recordAllInputs = this.properties.recordAllInputs

		return `recording.recordAllInputs`
	}
}
