import { DeserializedCommand } from './CommandBase.js'
import { AtemState } from '../state/index.js'

export interface TallyBySourceProps {
	[source: number]: { program: boolean; preview: boolean } | undefined
}

export class TallyBySourceCommand extends DeserializedCommand<TallyBySourceProps> {
	public static readonly rawName = 'TlSr'

	public static deserialize(rawCommand: Buffer): TallyBySourceCommand {
		const sourceCount = rawCommand.readUInt16BE(0)

		const sources: TallyBySourceProps = {}
		for (let i = 0; i < sourceCount; i++) {
			const source = rawCommand.readUInt16BE(2 + i * 3)
			const value = rawCommand.readUInt8(4 + i * 3)
			sources[source] = {
				program: (value & 0x01) > 0,
				preview: (value & 0x02) > 0,
			}
		}

		return new TallyBySourceCommand(sources)
	}

	public applyToState(_state: AtemState): string[] {
		return []
	}
}
