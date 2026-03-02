/* eslint-disable jest/no-export */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CommandParser } from '../../lib/atemCommandParser'
import { ProtocolVersion } from '../../enums'
import { IDeserializedCommand, SymmetricalCommand, ISerializableCommand } from '../CommandBase'
import { createEmptyState } from '../../__tests__/util'
import { DefaultCommandConverters } from './converters-default'
import { V8_0CommandConverters } from './converters-8.0'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export type CommandTestConverterSet = { [key: string]: CommandTestConverter }
export interface PropertyAliasResult {
	name?: string
	val: any
}
export interface CommandTestConverter {
	/** Internal name to LibAtem name */
	idAliases: { [internalName: string]: string }
	/** LibAtem name to Internal name & mutated value */
	propertyAliases: { [libName: string]: (v: any) => PropertyAliasResult }
	/** Mutate the TestCase before comparing */
	customMutate?: (v: any) => any
	/** pre-process deserialized command */
	processDeserialized?: (v: any) => void
}

export interface TestCase {
	name: string
	firstVersion: ProtocolVersion
	bytes: string
	command: { [key: string]: any }
}

const testCasePath = resolve(__dirname, `./libatem-data.json`)
const TestCases: TestCase[] = JSON.parse(readFileSync(testCasePath).toString())

function runTestForCommand(commandParser: CommandParser, i: number, testCase: TestCase, allowUnknown?: boolean): void {
	commandParser.version = testCase.firstVersion

	const cmdConstructor = commandParser.commandFromRawName(testCase.name)
	if (!cmdConstructor && allowUnknown) return

	const versionName = ProtocolVersion[testCase.firstVersion] || `v${testCase.firstVersion}`

	// if (testCase.name !== 'CFMH') return
	// if (i !== 1673) return

	let matchedCase = false
	if (cmdConstructor) {
		const buffer = Buffer.from(testCase.bytes.replace(/-/g, ''), 'hex')
		const length = buffer.readUInt16BE(0)
		const name = buffer.toString('ascii', 4, 8)

		let converter = DefaultCommandConverters[name]
		if (testCase.firstVersion >= ProtocolVersion.V8_0) {
			converter = V8_0CommandConverters[name] || converter
		}

		let mutatedCommand: { [key: string]: any } = {}
		for (const key in testCase.command) {
			const newKey = key[0].toLowerCase() + key.substring(1)
			const propConv = converter
				? converter.propertyAliases[`${name}.${newKey}`] || converter.propertyAliases[newKey]
				: undefined
			const newProp = propConv ? propConv(testCase.command[key]) : { val: testCase.command[key] }

			if (newProp.name) {
				const p = newProp.name.split('.')

				let o = mutatedCommand
				for (let i = p.shift(); i !== undefined; i = p.shift()) {
					if (p.length) {
						o[i] = { ...o[i] }
						o = o[i]
					} else {
						o[i] = newProp.val
					}
				}
			} else {
				mutatedCommand[newKey] = newProp.val
			}
		}

		if (converter && converter.customMutate) {
			mutatedCommand = converter.customMutate(mutatedCommand)
		}

		if (typeof cmdConstructor.deserialize === 'function') {
			matchedCase = true
			test(`Test #${i}: ${testCase.name} (${versionName}) - Deserialize`, () => {
				const cmd: IDeserializedCommand = cmdConstructor.deserialize(
					buffer.subarray(0, length).subarray(8),
					testCase.firstVersion
				)

				// delete cmd.flag // Anything deserialized will never have flags
				// delete (cmd as any).rawCommand

				if (converter) {
					if (converter.processDeserialized) {
						converter.processDeserialized(cmd.properties)
					}

					for (const key in cmd) {
						const newName = converter.idAliases[key]
						if (Object.prototype.hasOwnProperty.call(cmd, key) && newName) {
							if (!cmd.properties) cmd.properties = {}
							cmd.properties[newName] = (cmd as any)[key]
						}
					}
				}

				expect(cmd.properties).toEqual(mutatedCommand)

				const state = createEmptyState(cmd)
				// Ensure state update doesnt error
				expect(cmd.applyToState(state)).toBeTruthy()
			})
		}

		const cmd: ISerializableCommand = new cmdConstructor() // constructor params get filled in below
		if (typeof (cmd as any).serialize === 'function') {
			matchedCase = true
			test(`Test #${i}: ${testCase.name} (${versionName}) - Serialize`, () => {
				if (converter) {
					for (const id of Object.keys(converter.idAliases)) {
						const id2 = converter.idAliases[id]
						;(cmd as any)[id] = mutatedCommand[id2]
						delete mutatedCommand[id2]
					}
				}

				if (mutatedCommand.mask !== undefined) {
					;(cmd as any).flag = mutatedCommand.mask
					delete mutatedCommand.mask
				}

				if (cmd instanceof SymmetricalCommand) {
					// These properties are stored in slightly different place
					;(cmd as any).properties = mutatedCommand
				} else {
					;(cmd as any)._properties = mutatedCommand
				}

				// Ensure all properties appear in the mask
				const maskProps = (cmd as any).constructor.MaskFlags
				if (maskProps) {
					for (const key of Object.keys(mutatedCommand)) {
						// eslint-disable-next-line jest/no-conditional-expect
						expect(maskProps).toHaveProperty(key)
						// expect(maskProps[key]).not.toBeUndefined()
					}
				}

				const hexStr = (buf: Buffer): string => {
					const str = buf.toString('hex')
					let str2 = ''
					for (let i = 0; i < str.length; i += 2) {
						str2 += str[i + 0] + str[i + 1]
						str2 += i % 16 === 14 ? '\n' : '-'
					}
					return str2.substring(0, str2.length - 1)
				}

				const encodedBytes = cmd.serialize(testCase.firstVersion)
				// console.log(hexStr(buffer.subarray(4)))
				expect(length).toEqual(encodedBytes.length + 8)
				expect(hexStr(buffer.subarray(8))).toEqual(hexStr(encodedBytes))
			})
		}
	}

	if (!matchedCase) {
		test(`Test #${i}: ${testCase.name} - Skip`, () => {
			// Command should have either a serialize or deserialize
			expect(false).toBeTruthy()
		})
	}
}

describe('Commands vs LibAtem', () => {
	const commandParser = new CommandParser()

	test('Ensure all commands have test cases', () => {
		// Verify that all commands were tested
		let knownNames: string[] = []
		for (const [name, cmds] of Object.entries<any[]>(commandParser.commands)) {
			for (const cmd of cmds) {
				knownNames.push(`${name}_${cmd.minimumVersion || ProtocolVersion.V7_2}`)
			}
		}

		// knownNames = Object.keys(commandParser.commands).sort()
		const testNames = Array.from(new Set(TestCases.map((c) => `${c.name}_${c.firstVersion}`)))
			.filter((n) => knownNames.indexOf(n) !== -1)
			.sort()

		// Temporarily ignore these missing cases
		knownNames = knownNames.filter(
			(n) =>
				!n.startsWith('InCm') &&
				!n.startsWith('TlSr') &&
				!n.startsWith('_VMC') &&
				!n.startsWith('FAMS') &&
				!n.startsWith('CFMS') &&
				// new multiviewer border
				!n.startsWith('CMvO') &&
				!n.startsWith('MvBC') &&
				!n.startsWith('MvOv') &&
				!n.startsWith('StMw')
		)

		knownNames.sort()

		expect(testNames).toEqual(knownNames)
	})

	for (let i = 0; i < TestCases.length; i++) {
		const testCase = TestCases[i]
		switch (testCase.name) {
			// Temporarily ignore the failures
			case 'KeFS': // TODO - TMP!
			case '_MvC': // Not all properties parsed
			case 'FTSU': // Unkown props getting overwritten by generator: https://github.com/LibAtem/LibAtem/blob/master/LibAtem/Commands/DataTransfer/DataTransferDownloadRequestCommand.cs
			case 'CCmd': // LibAtem is incorrect
			case 'CCdP': // LibAtem is incorrect
			case 'CFMH': // LibAtem is missing properties
				continue
		}

		runTestForCommand(commandParser, i, testCase, true)
	}
})
