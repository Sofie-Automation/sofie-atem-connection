import { IPCMessageType } from '../enums'
import * as pRetry from 'p-retry'

export namespace Util {
	export function stringToBytes (str: string): Array<number> {
		const array = []
		for (const val of Buffer.from(str).values()) {
			array.push(val)
		}
		return array
	}

	export function bufToNullTerminatedString (buffer: Buffer, start: number, length: number): string {
		const slice = buffer.slice(start, start + length)
		const nullIndex = slice.indexOf('\0')
		return slice.toString('ascii', 0, nullIndex < 0 ? slice.length : nullIndex)
	}

	export function parseNumberBetween (num: number, min: number, max: number): number {
		if (num > max) throw Error(`Number too big: ${num} > ${max}`)
		else if (num < min) throw Error(`Number too small: ${num} < ${min}`)
		return num
	}

	export function parseEnum<G> (value: G, type: any): G {
		if (!type[value]) throw Error('Value is not a valid option in enum')
		return value
	}

	export function sendIPCMessage (
		scope: any,
		processProperty: string,
		message: {cmd: IPCMessageType; payload?: any, _messageId?: number},
		log: Function
	) {
		return pRetry(() => {
			return new Promise((resolve, reject) => {
				// This ensures that we will always grab the currently in-use process, if it has been re-made.
				const destProcess = scope[processProperty]
				if (!destProcess || typeof destProcess.send !== 'function') {
					return reject(new Error('Destination process has gone away'))
				}

				let handled = false

				// From https://nodejs.org/api/child_process.html#child_process_subprocess_send_message_sendhandle_options_callback:
				// "subprocess.send() will return false if the channel has closed or when the backlog of
				// unsent messages exceeds a threshold that makes it unwise to send more.
				// Otherwise, the method returns true."
				const sendResult = destProcess.send(message, (error: Error) => {
					if (handled) {
						return
					}

					if (error) {
						handled = true
						reject(error)
					} else {
						resolve()
					}

					handled = true
				})

				if (!sendResult && !handled) {
					reject(new Error('Failed to send IPC message'))
					handled = true
				}
			})
		}, {
			onFailedAttempt: error => {
				if (log) {
					log(`Failed to send IPC message (attempt ${error.attemptNumber}/${error.attemptNumber + error.attemptsLeft}).`)
				}
			},
			retries: 5
		})
	}

	export const COMMAND_CONNECT_HELLO = Buffer.from([
		0x10, 0x14, 0x53, 0xAB,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x3A, 0x00, 0x00,
		0x01, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00
	])

	export const COMMAND_CONNECT_HELLO_ANSWER = Buffer.from([
		0x80, 0x0C, 0x53, 0xAB,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x03, 0x00, 0x00
	])
}
