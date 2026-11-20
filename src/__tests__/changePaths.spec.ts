import { readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'

import { describe, expect, test } from 'vitest'

import { IDeserializedCommand, VersionCommand } from '../commands/index.js'
import { CommandParser } from '../lib/atemCommandParser.js'
import { AtemState, AtemStateUtil } from '../state/index.js'

/**
 * Replay real device dumps one command at a time, and check that the change paths each command returns cover
 * everything it actually changed in the state. Consumers rely on these paths to know what changed.
 */

const DUMP_DIR = resolve(__dirname, './connection')

/** Deep clone which keeps array holes, unlike a JSON round trip (which turns them into null) */
function clone<T>(value: T): T {
	if (Buffer.isBuffer(value)) return Buffer.from(value) as unknown as T
	if (Array.isArray(value)) {
		const result: unknown[] = new Array(value.length)
		for (const key of Object.keys(value)) result[Number(key)] = clone(value[Number(key)])
		return result as unknown as T
	}
	if (value && typeof value === 'object') {
		const result: Record<string, unknown> = {}
		for (const [key, child] of Object.entries<unknown>(value as Record<string, unknown>)) result[key] = clone(child)
		return result as T
	}
	return value
}

function isContainer(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Buffer.isBuffer(value)
}

interface Change {
	path: string
	/** The object at this path was created, eg by a state getter filling in defaults on first sight of an entity */
	created: boolean
}

/** List the paths that differ, down to the leaves, or to the root of a newly created object */
function listChanges(before: unknown, after: unknown, path: string[], changes: Change[]): void {
	if (Object.is(before, after)) return
	if (Buffer.isBuffer(before) && Buffer.isBuffer(after) && before.equals(after)) return

	if (before === undefined && isContainer(after)) {
		changes.push({ path: path.join('.'), created: true })
		return
	}

	if (isContainer(before) && (isContainer(after) || after === undefined)) {
		const keys = new Set([...Object.keys(before), ...Object.keys(after ?? {})])
		for (const key of keys) {
			listChanges(before[key], (after as any)?.[key], [...path, key], changes)
		}
		return
	}

	changes.push({ path: path.join('.'), created: false })
}

function isCovered(change: Change, paths: string[]): boolean {
	return paths.some(
		(path) =>
			change.path === path ||
			change.path.startsWith(path + '.') ||
			// Creating an object with defaults is fine, as long as something inside it is reported
			(change.created && path.startsWith(change.path + '.'))
	)
}

function* readDumpCommands(file: string): Generator<{ name: string; body: Buffer }> {
	for (const line of readFileSync(resolve(DUMP_DIR, file), 'utf8').split('\n')) {
		let buffer = Buffer.from(line.trim(), 'hex')
		while (buffer.length > 8) {
			const length = buffer.readUInt16BE(0)
			if (length < 8) break
			yield { name: buffer.toString('ascii', 4, 8), body: buffer.subarray(8, length) }
			buffer = buffer.subarray(length)
		}
	}
}

const dumps = readdirSync(DUMP_DIR).filter((file) => file.endsWith('.data'))

function stringify(value: unknown): string {
	return JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v)) ?? 'undefined'
}

/**
 * A copy of the state as it was before the last command. Comparing every command against a full deep clone is slow
 * for the larger devices, so each top level section is only diffed and cloned again when its JSON has changed
 */
class StateSnapshot {
	readonly #copy = new Map<string, unknown>()
	readonly #json = new Map<string, string>()

	constructor(state: AtemState) {
		this.takeChanges(state)
	}

	/** Find what changed since the snapshot, and update the snapshot to match */
	takeChanges(state: AtemState): Change[] {
		const changes: Change[] = []
		for (const key of new Set([...this.#copy.keys(), ...Object.keys(state)])) {
			const value = (state as any)[key]
			const json = stringify(value)
			if (json === this.#json.get(key)) continue

			listChanges(this.#copy.get(key), value, [key], changes)
			this.#copy.set(key, clone(value))
			this.#json.set(key, json)
		}
		return changes
	}
}

describe('Change paths', () => {
	test.each(dumps)(
		'%s',
		(file) => {
			const parser = new CommandParser()
			let state: AtemState = AtemStateUtil.Create()
			let snapshot = new StateSnapshot(state)

			// Keyed by command and generalised path, so each problem is only reported once per dump
			const failures = new Map<string, string>()

			for (const { name, body } of readDumpCommands(file)) {
				const constructor = parser.commandFromRawName(name)
				if (!constructor?.deserialize) continue

				let command: IDeserializedCommand
				try {
					command = constructor.deserialize(body, parser.version)
				} catch (_e) {
					// Some dumps contain garbled commands
					continue
				}
				if (command instanceof VersionCommand) {
					parser.version = command.properties.version
					// As the connection does, start a new state when the version arrives
					state = AtemStateUtil.Create()
					snapshot = new StateSnapshot(state)
				}

				let paths: string[]
				try {
					const result = command.applyToState(state)
					paths = Array.isArray(result) ? result : [result]
				} catch (e) {
					// A rejected command must leave the state untouched
					for (const { path } of snapshot.takeChanges(state)) {
						failures.set(
							`${name} threw:${path.replace(/\d+/g, 'N')}`,
							`${name} threw (${e}) but changed ${path}`
						)
					}
					continue
				}

				for (const change of snapshot.takeChanges(state)) {
					if (!isCovered(change, paths)) {
						failures.set(
							`${name}:${change.path.replace(/\d+/g, 'N')}`,
							`${name} changed ${change.path} but reported [${paths.join(', ')}]`
						)
					}
				}
			}

			expect([...failures.values()]).toEqual([])
		},
		60_000
	) // The larger devices take a few seconds
})
