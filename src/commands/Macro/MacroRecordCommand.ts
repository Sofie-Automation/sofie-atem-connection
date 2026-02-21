import { BasicWritableCommand } from '../CommandBase.js'
import { Util } from '../../index.js'

export class MacroRecordCommand extends BasicWritableCommand<{ name: string; description: string }> {
	public static readonly rawName = 'MSRc'
	public readonly index: number

	constructor(index: number, name: string, description: string) {
		super({ name, description })

		this.index = index
	}

	public serialize(): Buffer {
		const name = this.properties.name || ''
		const description = this.properties.description || ''

		const buffer = Buffer.alloc(Util.padToMultiple(8 + name.length + description.length, 4))
		buffer.writeUInt16BE(this.index, 0)
		buffer.writeUInt16BE(name.length, 2)
		buffer.writeUInt16BE(description.length, 4)
		buffer.write(name, 6, 'utf8')
		buffer.write(description, 6 + name.length, 'utf8')
		return buffer
	}
}
