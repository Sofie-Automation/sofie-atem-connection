/**
 * @todo: MINT - 2018-5-24:
 * Create util functions that handle proper colour spaces in UHD.
 */

import { ColorConvertConstantsBT709, ColorConvertConstantsBT601 } from './colorConstants.js'

export function convertRGBAToYUV422(width: number, height: number, data: Buffer): Buffer {
	const constants = height >= 720 ? ColorConvertConstantsBT709 : ColorConvertConstantsBT601

	const genColor = (rawA: number, uv16: number, y16: number): number => {
		const a = ((rawA << 2) * 219) / 255 + (16 << 2)
		const y = Math.round(y16) >> 6
		const uv = Math.round(uv16) >> 6

		return (a << 20) + (uv << 10) + y
	}

	const buffer = Buffer.alloc(width * height * 4)
	for (let i = 0; i < width * height * 4; i += 8) {
		const r1 = data[i + 0]
		const g1 = data[i + 1]
		const b1 = data[i + 2]

		const r2 = data[i + 4]
		const g2 = data[i + 5]
		const b2 = data[i + 6]

		const a1 = data[i + 3]
		const a2 = data[i + 7]

		const y16a =
			constants.YOffset +
			constants.KR * constants.YRange * r1 +
			constants.KG * constants.YRange * g1 +
			constants.KB * constants.YRange * b1
		const cb16 =
			constants.CbCrOffset + (-constants.KRoKBi * r1 - constants.KGoKBi * g1 + constants.HalfCbCrRange * b1)
		const y16b =
			constants.YOffset +
			constants.KR * constants.YRange * r2 +
			constants.KG * constants.YRange * g2 +
			constants.KB * constants.YRange * b2
		const cr16 =
			constants.CbCrOffset + (constants.HalfCbCrRange * r1 - constants.KGoKRi * g1 - constants.KBoKRi * b1)

		buffer.writeUInt32BE(genColor(a1, cb16, y16a), i)
		buffer.writeUInt32BE(genColor(a2, cr16, y16b), i + 4)
	}
	return buffer
}
