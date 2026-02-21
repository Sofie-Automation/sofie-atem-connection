import { DeserializedCommand } from './CommandBase.js'

export class InitCompleteCommand extends DeserializedCommand<null> {
	public static readonly rawName = 'InCm'

	constructor() {
		super(null)
	}

	public static deserialize(): InitCompleteCommand {
		return new InitCompleteCommand()
	}

	public applyToState(): string {
		return `info`
	}
}
