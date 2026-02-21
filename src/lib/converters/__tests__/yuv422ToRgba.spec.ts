import { describe, expect, test } from 'vitest'

import { convertRGBAToYUV422 } from '../rgbaToYuv422.js'
import { convertYUV422ToRGBA } from '../yuv422ToRgba.js'

function encodeAlphaPair(alpha10: number): Buffer {
	const word = ((alpha10 << 20) | (512 << 10) | 64) >>> 0
	const buf = Buffer.alloc(8)
	buf.writeUInt32BE(word, 0)
	buf.writeUInt32BE(word, 4)
	return buf
}

describe('yuv422 alpha conversion', () => {
	test('decode clamps alpha outside of the limited range', () => {
		// Stills captured on the switcher can use values outside of 64-940
		expect(convertYUV422ToRGBA(2, 1, encodeAlphaPair(0))[3]).toBe(0)
		expect(convertYUV422ToRGBA(2, 1, encodeAlphaPair(63))[3]).toBe(0)
		expect(convertYUV422ToRGBA(2, 1, encodeAlphaPair(944))[3]).toBe(255)
		expect(convertYUV422ToRGBA(2, 1, encodeAlphaPair(1023))[3]).toBe(255)
	})

	test('alpha matches values produced by the switcher', () => {
		// Pairs observed from a still uploaded to a Constellation HD
		const observed: Array<[alpha8: number, alpha10: number]> = [
			[0, 64],
			[1, 67],
			[2, 71],
			[127, 500],
			[128, 504],
			[254, 937],
			[255, 940],
		]
		for (const [alpha8, alpha10] of observed) {
			expect(convertYUV422ToRGBA(2, 1, encodeAlphaPair(alpha10))[3]).toBe(alpha8)

			const rgba = Buffer.alloc(8)
			rgba[3] = alpha8
			rgba[7] = alpha8
			expect(convertRGBAToYUV422(2, 1, rgba).readUInt32BE(0) >>> 20).toBe(alpha10)
		}
	})

	test('alpha round trips', () => {
		for (let alpha8 = 0; alpha8 <= 255; alpha8++) {
			const rgba = Buffer.alloc(8)
			rgba[3] = alpha8
			rgba[7] = alpha8
			const result = convertYUV422ToRGBA(2, 1, convertRGBAToYUV422(2, 1, rgba))
			expect(result[3]).toBe(alpha8)
			expect(result[7]).toBe(alpha8)
		}
	})
})
