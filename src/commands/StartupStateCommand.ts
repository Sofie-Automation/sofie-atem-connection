import { BasicWritableCommand } from './CommandBase.js'

export class StartupStateSaveCommand extends BasicWritableCommand<unknown> {
	public static readonly rawName = 'SRsv'

	constructor() {
		super({})
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		// 0 is the 'mode' parameter, which is always 0 for now
		return buffer
	}
}

export class StartupStateClearCommand extends BasicWritableCommand<unknown> {
	public static readonly rawName = 'SRcl'

	constructor() {
		super({})
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		// 0 is the 'mode' parameter, which is always 0 for now
		return buffer
	}
}
