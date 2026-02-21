/* eslint-disable jest/no-conditional-expect */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { AtemSocketChild } from '../lib/atemSocketChild.js'
import { ThreadedClass } from 'threadedclass'
import { BasicAtem } from '../atem.js'
import { AtemState, InvalidIdError } from '../state/index.js'
import { IDeserializedCommand, ProductIdentifierCommand, VersionCommand } from '../commands/index.js'
import * as objectPath from 'object-path'
import { Model, ProtocolVersion } from '../enums/index.js'
jest.mock('../lib/atemSocketChild')

function cloneJson<T>(v: T): T {
	return JSON.parse(JSON.stringify(v))
}

// @ts-ignore
class AtemSocketChildMock implements AtemSocketChild {
	public onDisconnect: () => Promise<void>
	public onLog: (message: string) => Promise<void>
	public onCommandsReceived: (payload: Buffer, packetId: number) => Promise<void>
	public onPacketsAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>

	constructor(
		onDisconnect: () => Promise<void>,
		onLog: (message: string) => Promise<void>,
		onCommandsReceived: (payload: Buffer, packetId: number) => Promise<void>,
		onPacketsAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>
	) {
		this.onDisconnect = onDisconnect
		this.onLog = onLog
		this.onCommandsReceived = onCommandsReceived
		this.onPacketsAcknowledged = onPacketsAcknowledged
	}

	public connect = jest.fn(async () => Promise.resolve())
	public disconnect = jest.fn(async () => Promise.resolve())
	public sendCommands = jest.fn(async () => Promise.resolve())
}

;(AtemSocketChild as any).mockImplementation(
	(
		_opts: any,
		onDisconnect: () => Promise<void>,
		onLog: (message: string) => Promise<void>,
		onCommandsReceived: (payload: Buffer, packetId: number) => Promise<void>,
		onPacketsAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>
	) => {
		return new AtemSocketChildMock(onDisconnect, onLog, onCommandsReceived, onPacketsAcknowledged)
	}
)

function createConnection(): BasicAtem {
	return new BasicAtem({
		debugBuffers: false,
		address: '',
		port: 890,
		disableMultithreaded: true,
	})
}

function getChild(conn: BasicAtem): ThreadedClass<AtemSocketChildMock> {
	return (conn as any).socket._socketProcess
}

function expectIsValidEnumValue<T>(enumObj: Record<string, T>, value: T): void {
	expect(Object.values<T>(enumObj)).toContain(value)
}

function runTest(name: string, filename: string): void {
	const filePath = resolve(__dirname, `./connection/${filename}.data`)
	const fileData = readFileSync(filePath).toString().split('\n')

	// eslint-disable-next-line jest/valid-title
	describe(name, () => {
		test(`Connection`, async () => {
			const conn = createConnection()
			await conn.connect('')

			const child = getChild(conn)
			expect(child).toBeTruthy()
			expect(child.onCommandsReceived).toBeTruthy()

			const errors: any[] = []
			conn.on('error', (e: any) => {
				// Ignore any errors that are due to bad ids, as they are 'good' errors
				if (!(e instanceof InvalidIdError)) {
					errors.push(e)
				}
			})

			// eslint-disable-next-line @typescript-eslint/no-for-in-array
			for (const i in fileData) {
				const buffer = Buffer.from(fileData[i].trim(), 'hex')
				await child.onCommandsReceived(buffer, Number(i))
			}

			expect(errors).toEqual([])

			expect(conn.state?.info.apiVersion).toBeOneOf(Object.values<any>(ProtocolVersion))
		})

		describe('Paths', () => {
			const conn = createConnection()
			const parser: (b: Buffer) => IDeserializedCommand[] = (conn as any).socket._parseCommands.bind(
				(conn as any).socket
			)

			const commands: IDeserializedCommand[] = []
			// eslint-disable-next-line @typescript-eslint/no-for-in-array
			for (const i in fileData) {
				const buffer = Buffer.from(fileData[i].trim(), 'hex')
				commands.push(...parser(buffer))
			}

			const state = cloneJson(conn.state)

			// eslint-disable-next-line jest/no-standalone-expect
			expect(commands).not.toBeEmpty()
			// eslint-disable-next-line jest/no-standalone-expect
			expect(state).toBeTruthy()

			const state0 = state as AtemState

			for (const cmd of commands) {
				test(`${cmd.constructor.name}`, async () => {
					if (cmd instanceof VersionCommand) {
						expectIsValidEnumValue(ProtocolVersion, cmd.properties.version)
					} else if (cmd instanceof ProductIdentifierCommand) {
						expectIsValidEnumValue(Model, cmd.properties.model)
					}

					const newState = cloneJson(state0)
					try {
						const paths0 = cmd.applyToState(newState)
						const paths = Array.isArray(paths0) ? paths0 : [paths0]

						switch (cmd.constructor.name) {
							case 'TallyBySourceCommand':
							case 'LockStateUpdateCommand':
							case 'CameraControlUpdateCommand': // Temporary?
								// Some commands are not expected to update the state
								expect(paths).toBeEmpty()
								break
							default:
								expect(paths).not.toBeEmpty()
								break
						}

						// Ensure the paths are all valid
						// const trimmedRawState = cloneJson(state0)
						// const trimmedNewState = cloneJson(newState)
						if (paths.length > 0) {
							for (const path of paths) {
								// Start by making sure that the paths are valid
								const subObj = objectPath.get(newState, path)
								expect(subObj).not.toBeUndefined()
								// objectPath.del(trimmedNewState, path)
								// objectPath.del(trimmedRawState, path)
							}
						}

						// // Ensure nothing outside the paths changed
						// TODO - this wont do much as the current state is too similar. Also it is horrifically slow
						// expect(trimmedNewState).toEqual(trimmedRawState)
					} catch (e) {
						if (e instanceof InvalidIdError) {
							// Ignore it
						} else {
							throw e
						}
					}

					//
				})
			}
		})
	})
}

describe('connection', () => {
	/**
	 * Test cases can be generated with the dump.js script.
	 * These tests run the payload through the parser to ensure that the commands does not error.
	 */

	runTest('1me v8.1', '1me-v8.1')
	runTest('2me v8.1', '2me-v8.1')
	runTest('2me v8.1.2', '2me-v8.1.2')
	runTest('ps4k v7.2', 'ps4k-v7.2')
	runTest('1me4k v8.2', '1me4k-v8.2')
	runTest('2me4k v8.4', '2me4k-v8.4')
	runTest('4me4k v7.5.2', '4me4k-v7.5.2')
	runTest('4me4k v8.2', '4me4k-v8.2')
	runTest('tvshd v8.0.0', 'tvshd-v8.0.0')
	runTest('tvshd v8.1.0', 'tvshd-v8.1.0')
	runTest('tvshd v8.2.0', 'tvshd-v8.2.0')
	runTest('constellation v8.0.2', 'constellation-v8.0.2')
	runTest('constellation v8.2.3', 'constellation-v8.2.3')
	runTest('mini v8.1', 'mini-v8.1')
	runTest('mini v8.1.1', 'mini-v8.1.1')
	runTest('mini v8.6', 'mini-v8.6')
	runTest('mini pro v8.2', 'mini-pro-v8.2')
	runTest('mini pro iso v8.4', 'mini-pro-iso-v8.4')
	runTest('mini extreme v8.6', 'mini-extreme-v8.6')
	runTest('constellation hd 2me v8.7', 'constellation-2me-hd-v8.7.0')
	runTest('tvs hd8 v9.0', 'tvs-hd8-v9.0')
	runTest('sdi extreme iso v8.8', 'sdi-extreme-iso-v8.8')
	runTest('constellation 4k 4me v9.1', 'constellation-4me-4k-v9.1')
	runTest('tvs 4k8 v9.3', 'tvs-4k8-v9.3')
	runTest('mini extreme iso v9.5', 'mini-extreme-iso-v9.5')
	runTest('constellation hd 2me v9.6.2', 'constellation-2me-hd-v9.6.2')
	runTest('mini extreme iso g2 v10.1.1', 'mini-extreme-iso-g2-v10.1.1')
})
