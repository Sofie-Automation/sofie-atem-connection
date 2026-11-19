import WaveFile = require('wavefile')
import { convertWAVToRaw } from '../wavAudio'
import { Model } from '../../../enums'

function createWav(frames: number): Buffer {
	const wav = new (WaveFile as any)()
	const left = Array.from({ length: frames }, (_, i) => (i + 1) * 1000)
	const right = Array.from({ length: frames }, (_, i) => -(i + 1) * 1000)
	wav.fromScratch(2, 48000, '24', [left, right])
	return Buffer.from(wav.toBuffer())
}

describe('convertWAVToRaw', () => {
	test('an odd number of frames is padded with silence for the newer byte order', () => {
		const even = convertWAVToRaw(createWav(2), Model.PS4K)
		const odd = convertWAVToRaw(createWav(3), Model.PS4K)

		expect(even).toHaveLength(12)
		expect(odd).toHaveLength(24)
		// The frames shared with the even file are unchanged. The swap works within 4 byte words, so the padding is
		// spread over the last two, with the final one entirely silent
		expect(odd.subarray(0, 12)).toEqual(even)
		expect(odd.subarray(20)).toEqual(Buffer.alloc(4))
	})

	test('older models are not padded', () => {
		expect(convertWAVToRaw(createWav(3), Model.TVS)).toHaveLength(18)
	})
})
