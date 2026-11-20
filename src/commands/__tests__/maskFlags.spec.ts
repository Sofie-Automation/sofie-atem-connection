import { describe, expect, test } from 'vitest'

import { WritableCommand } from '../CommandBase.js'
import * as Commands from '../index.js'

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

// Type-level check: the writable properties of every command must exactly match the keys of its MaskFlags
type AllCommands = typeof Commands
type CommandProps<X> = X extends abstract new (...args: any[]) => WritableCommand<infer T> ? T : never
type CommandMaskFlags<X> = X extends { MaskFlags: infer M } ? (string extends keyof M ? never : M) : never
type WritableCommandNames = {
	[K in keyof AllCommands]: AllCommands[K] extends abstract new (...args: any[]) => WritableCommand<any> ? K : never
}[Exclude<keyof AllCommands, 'WritableCommand'>]
type MaskFlagsMismatch<X> = [CommandMaskFlags<X>] extends [never]
	? 'missing MaskFlags'
	: | Exclude<keyof CommandProps<X>, keyof CommandMaskFlags<X>>
		| Exclude<keyof CommandMaskFlags<X>, keyof CommandProps<X>>
type MaskFlagsMismatches = {
	[K in WritableCommandNames as [MaskFlagsMismatch<AllCommands[K]>] extends [never] ? never : K]: MaskFlagsMismatch<
		AllCommands[K]
	>
}

test('MaskFlags keys match the writable properties of each command', () => {
	// If this fails to compile, the error lists the commands with mismatched keys
	const mismatches: Record<keyof MaskFlagsMismatches, never> = {}
	expect(mismatches).toEqual({})
})
