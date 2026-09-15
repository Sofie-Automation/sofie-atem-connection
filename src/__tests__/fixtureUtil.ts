import { readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { CommandParser } from '../lib/atemCommandParser'
import { IDeserializedCommand, VersionCommand } from '../commands'
import { AtemState, AtemStateUtil, InvalidIdError } from '../state'

const FIXTURE_DIR = resolve(__dirname, './connection')

export function listFixtures(): string[] {
	return readdirSync(FIXTURE_DIR)
		.filter((f) => f.endsWith('.data'))
		.map((f) => f.slice(0, -'.data'.length))
		.sort()
}

export function parseFixtureCommands(filename: string): IDeserializedCommand[] {
	const fileData = readFileSync(resolve(FIXTURE_DIR, `${filename}.data`))
		.toString()
		.split('\n')

	const commandParser = new CommandParser()
	const commands: IDeserializedCommand[] = []

	for (const line of fileData) {
		let buffer = Buffer.from(line.trim(), 'hex')

		while (buffer.length > 8) {
			const length = buffer.readUInt16BE(0)
			const name = buffer.toString('ascii', 4, 8)
			if (length < 8) break

			const cmdConstructor = commandParser.commandFromRawName(name)
			if (cmdConstructor && typeof cmdConstructor.deserialize === 'function') {
				const cmd: IDeserializedCommand = cmdConstructor.deserialize(
					buffer.subarray(8, length),
					commandParser.version
				)
				if (cmd instanceof VersionCommand) {
					commandParser.version = cmd.properties.version
				}
				commands.push(cmd)
			}

			buffer = buffer.subarray(length)
		}
	}

	return commands
}

/**
 * Replay a connection dump into a state object, as a real connection would.
 * Commands which are not valid for the device are ignored, as they are during a real connection.
 */
export function parseFixtureState(filename: string): AtemState {
	const state = AtemStateUtil.Create()

	for (const cmd of parseFixtureCommands(filename)) {
		try {
			cmd.applyToState(state)
		} catch (e) {
			if (!(e instanceof InvalidIdError)) throw e
		}
	}

	return state
}
