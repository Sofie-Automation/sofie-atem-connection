/**
 * @todo: MINT - 2018-5-24:
 * Create util functions that handle proper colour spaces in UHD.
 */

import { ColorConvertConstantsBT709, ColorConvertConstantsBT601 } from './colorConstants.js'

function clamp(v: number) {
	if (v <= 0) return 0
	if (v >= 255) return 255
	return v
}

export function convertYUV422ToRGBA(width: number, height: number, data: Buffer): Buffer {
	const constants = height >= 720 ? ColorConvertConstantsBT709 : ColorConvertConstantsBT601

	const splitSample = (raw: number): [y: number, uv: number, a: number] => {
		const y = (raw & 0x000003ff) << 6
		const uv = (raw & 0x000ffc00) >> 4 // same as << 6 >> 10
		const a = (raw & 0x3ff00000) >> 20

		const y_full = (y - constants.YOffset) / constants.YRange
		const uv_full = (uv - constants.CbCrOffset) / constants.HalfCbCrRange
		const a_full = (((a - (16 << 2)) / 219) * 255) >> 2 // TODO - confirm correct range

		return [y_full, uv_full, a_full]
	}

	const genColor = (
		y8: number,
		cb8: number,
		cr8: number,
		a10: number
	): [r: number, g: number, b: number, a: number] => {
		const r = clamp(Math.round(y8 + constants.KRi * cr8))
		const g = clamp(Math.round(y8 - constants.KRKRioKG * cr8 - constants.KBKBioKG * cb8))
		const b = clamp(Math.round(y8 + constants.KBi * cb8))
		const a = Math.round(a10)

		return [r, g, b, a]
	}

	const buffer = Buffer.alloc(width * height * 4)
	for (let i = 0; i < width * height * 4; i += 8) {
		const sample1 = data.readUint32BE(i)
		const sample2 = data.readUint32BE(i + 4)

		const [y8a, cb8, a10a] = splitSample(sample1)
		const [y8b, cr8, a10b] = splitSample(sample2)

		const [r1, g1, b1, a1] = genColor(y8a, cb8, cr8, a10a)
		const [r2, g2, b2, a2] = genColor(y8b, cb8, cr8, a10b)

		buffer.writeUint8(r1, i)
		buffer.writeUint8(g1, i + 1)
		buffer.writeUint8(b1, i + 2)
		buffer.writeUint8(a1, i + 3)
		buffer.writeUint8(r2, i + 4)
		buffer.writeUint8(g2, i + 5)
		buffer.writeUint8(b2, i + 6)
		buffer.writeUint8(a2, i + 7)
	}
	return buffer
}
