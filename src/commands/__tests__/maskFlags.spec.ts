import * as Commands from '..'
import { WritableCommand } from '../CommandBase'

class TestCommandWithoutMaskFlags extends WritableCommand<{ value: number }> {
	public serialize(): Buffer {
		return Buffer.alloc(0)
	}
}

describe('WritableCommand MaskFlags', () => {
	test('updateProps throws when MaskFlags is missing', () => {
		const command = new TestCommandWithoutMaskFlags()
		expect(() => command.updateProps({ value: 1 })).toThrow(/missing MaskFlags/)
	})

	const writableCommands = Object.entries<unknown>(Commands).filter(
		([, cmd]) => typeof cmd === 'function' && cmd.prototype instanceof WritableCommand
	)

	test('found writable commands', () => {
		expect(writableCommands.length).toBeGreaterThan(0)
	})

	test.each(writableCommands)('%s has MaskFlags', (_name, cmd) => {
		const maskFlags = (cmd as any).MaskFlags
		expect(maskFlags).toBeTruthy()
		expect(Object.keys(maskFlags).length).toBeGreaterThan(0)
	})
})
