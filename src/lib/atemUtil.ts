import type { IDeserializedCommand, ISerializableCommand } from '../commands/index.js'

export { getVideoModeInfo } from './videoMode.js'

export function bufToBase64String(buffer: Buffer, start: number, length: number): string {
	return buffer.toString('base64', start, start + length)
}

export function bufToNullTerminatedString(buffer: Buffer, start: number, length: number): string {
	const slice = buffer.slice(start, start + length)
	const nullIndex = slice.indexOf('\0')
	return slice.toString('utf8', 0, nullIndex < 0 ? slice.length : nullIndex)
}

export function UInt16BEToDecibel(input: number): number {
	// 0 = -inf, 32768 = 0, 65381 = +6db
	return Math.round(Math.log10(input / 32768) * 20 * 100) / 100
}

export function DecibelToUInt16BE(input: number): number {
	return Math.floor(Math.pow(10, input / 20) * 32768)
}

export function IntToBalance(input: number): number {
	// -100000 = -50, 0x0000 = 0, 0x2710 = +50
	return Math.round(input / 200)
}
export function BalanceToInt(input: number): number {
	return Math.round(input * 200)
}

export function padToMultiple(val: number, multiple: number): number {
	const r = val % multiple
	if (r === 0) {
		return val
	} else {
		return val + (multiple - r)
	}
}

export function getComponents(val: number): number[] {
	const res: number[] = []
	for (let next = 1; next <= val; next = next << 1) {
		if ((val & next) > 0) {
			res.push(next)
		}
	}
	return res
}

export function combineComponents(vals: number[]): number {
	let res = 0
	for (const val of vals) {
		res |= val
	}
	return res
}

export function commandStringify(command: IDeserializedCommand | ISerializableCommand): string {
	return JSON.stringify(command, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
}

export function omit<T, K extends keyof T>(o: T, ...keys: K[]): Omit<T, K> {
	const obj: any = { ...o }
	for (const key of keys) {
		delete obj[key]
	}
	return obj
}

export function assertNever(_val: never): void {
	// Nothing to do
}

export function isRunningInTests(): boolean {
	return process.env.VITEST_POOL_ID !== undefined
}
