import { types } from 'util'
import { CommandParser } from '../../lib/atemCommandParser.js'
import { ProtocolVersion } from '../../enums/index.js'
import { AtemState, AtemStateUtil, InvalidIdError } from '../../state/index.js'

/**
 * Feed random bytes to every command, to check that malformed data from a device is handled cleanly:
 * deserializing and applying to the state must only fail by throwing an Error, and must not blow up the state
 */

const ITERATIONS = 200
const MAX_LENGTH = 300
/** Device ids are at most 16 bits, so no array in the state should get longer than this */
const MAX_ARRAY_LENGTH = 1 << 16

/** Small deterministic PRNG, so failures are reproducible */
/** Errors thrown by node internals (eg Buffer bounds checks) are from outside the jest sandbox, so fail `instanceof Error` */
function isError(e: unknown): e is Error {
	return e instanceof Error || types.isNativeError(e)
}

function hashString(str: string): number {
	let hash = 0
	for (let i = 0; i < str.length; i++) hash = (Math.imul(hash, 31) + str.charCodeAt(i)) | 0
	return hash
}

function mulberry32(seed: number): () => number {
	return () => {
		seed |= 0
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

function randomBuffer(rand: () => number): Buffer {
	// Favour short buffers, as most commands are small and so exercise their bounds checking
	const length = rand() < 0.5 ? Math.floor(rand() * 32) : Math.floor(rand() * MAX_LENGTH)
	const buffer = Buffer.alloc(length)
	for (let i = 0; i < length; i++) {
		const r = rand()
		// Bias towards small and boundary values, as those are more likely to be valid ids
		buffer[i] = r < 0.3 ? 0 : r < 0.45 ? 0xff : r < 0.7 ? Math.floor(rand() * 4) : Math.floor(rand() * 256)
	}
	return buffer
}

function createState(): AtemState {
	const state = AtemStateUtil.Create()
	state.info.capabilities = {
		mixEffects: 4,
		sources: 40,
		auxilliaries: 24,
		mixMinusOutputs: 24,
		mediaPlayers: 4,
		serialPorts: 1,
		maxHyperdecks: 4,
		DVEs: 2,
		stingers: 1,
		superSources: 2,
		talkbackChannels: 2,
		downstreamKeyers: 4,
		cameraControl: true,
		advancedChromaKeyers: true,
		onlyConfigurableOutputs: false,
	}
	return state
}

function findOversizedArray(value: unknown, path: string, seen = new Set<unknown>()): string | undefined {
	if (!value || typeof value !== 'object' || seen.has(value)) return undefined
	seen.add(value)

	if (Array.isArray(value) && value.length > MAX_ARRAY_LENGTH) return `${path} (length ${value.length})`
	for (const [key, child] of Object.entries<unknown>(value as Record<string, unknown>)) {
		const found = findOversizedArray(child, `${path}.${key}`, seen)
		if (found) return found
	}
	return undefined
}

const parser = new CommandParser()
const commands = Object.values<any[]>(parser.commands)
	.flat()
	.filter((cmd) => typeof cmd.deserialize === 'function')
const versions = Object.values<string | ProtocolVersion>(ProtocolVersion).filter(
	(v): v is ProtocolVersion => typeof v === 'number'
)

describe('Command fuzzing', () => {
	test.each(commands.map((cmd) => [cmd.name, cmd]))('%s', (_name, cmd) => {
		const failures: string[] = []

		for (const version of versions) {
			const rand = mulberry32(version ^ hashString(cmd.name))
			const state = createState()

			for (let i = 0; i < ITERATIONS; i++) {
				const buffer = randomBuffer(rand)
				const context = `v${version.toString(16)} ${buffer.toString('hex')}`

				let command
				try {
					command = cmd.deserialize(buffer, version)
				} catch (e) {
					if (!isError(e)) failures.push(`deserialize threw a non-Error: ${context}`)
					continue
				}

				try {
					command.applyToState(state)
				} catch (e) {
					if (!isError(e)) {
						failures.push(`applyToState threw a non-Error: ${context}`)
					} else if (!(e instanceof InvalidIdError) && e.name !== 'RangeError') {
						failures.push(`applyToState threw ${e}: ${context}`)
					}
				}

				const oversized = findOversizedArray(state, 'state')
				if (oversized) failures.push(`State has an oversized array ${oversized}: ${context}`)
			}
		}

		expect(failures).toEqual([])
	})
})
