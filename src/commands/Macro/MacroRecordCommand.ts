import { BasicWritableCommand } from '../CommandBase'
import * as Util from '../../lib/atemUtil'

export class MacroRecordCommand extends BasicWritableCommand<{ name: string; description: string }> {
	public static readonly rawName = 'MSRc'
	public readonly index: number

	constructor(index: number, name: string, description: string) {
		super({ name, description })

		this.index = index
	}

	public serialize(): Buffer {
		const name = Buffer.from(this.properties.name || '', 'utf8')
		const description = Buffer.from(this.properties.description || '', 'utf8')

		const buffer = Buffer.alloc(Util.padToMultiple(8 + name.length + description.length, 4))
		buffer.writeUInt16BE(this.index, 0)
		buffer.writeUInt16BE(name.length, 2)
		buffer.writeUInt16BE(description.length, 4)
		name.copy(buffer, 6)
		description.copy(buffer, 6 + name.length)
		return buffer
	}
}
