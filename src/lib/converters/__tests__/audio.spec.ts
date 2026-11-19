import { describe, expect, test } from 'vitest'
import wavefile from 'wavefile'

import { Model } from '../../../enums/index.js'
import { convertPCMToAtemAudio } from '../audio.js'

/** Distinct non-zero bytes, so any byte misplacement is visible */
function createSamples(length: number): Buffer {
	const samples = Buffer.alloc(length)
	for (let i = 0; i < length; i++) samples[i] = (i % 255) + 1
	return samples
}

/** The original implementation, which did the conversion as two separate byte-flipping passes */
function referenceConvert(samples: Buffer, newer: boolean): Buffer {
	const buffer2 = Buffer.alloc(samples.length)
	for (let i = 0; i < samples.length; i += 3) {
		buffer2.writeUIntBE(samples.readUIntLE(i, 3), i, 3)
	}
	if (!newer) return buffer2

	const buffer3 = Buffer.alloc(buffer2.length)
	for (let i = 0; i < buffer2.length; i += 4) {
		buffer3.writeUIntBE(buffer2.readUIntLE(i, 4), i, 4)
	}
	return buffer3
}

describe('convertPCMToAtemAudio', () => {
	test('older models get big-endian samples', () => {
		const samples = createSamples(6 * 3)

		const output = convertPCMToAtemAudio(samples, Model.TVS)
		expect(output).toEqual(referenceConvert(samples, false))
		expect([...output.subarray(0, 3)]).toEqual([3, 2, 1])
	})

	test.each([Model.PS4K, Model.Constellation8K, undefined])('newer models get word swapped samples (%s)', (model) => {
		const samples = createSamples(6 * 10)
		expect(convertPCMToAtemAudio(samples, model)).toEqual(referenceConvert(samples, true))
	})

	test('newer models pad an odd number of frames with silence', () => {
		const samples = createSamples(6 * 5)

		const output = convertPCMToAtemAudio(samples, Model.PS4K)
		expect(output).toHaveLength(36)
		expect(output).toEqual(referenceConvert(Buffer.concat([samples, Buffer.alloc(6)]), true))
	})

	test('rejects partial frames', () => {
		expect(() => convertPCMToAtemAudio(createSamples(6 * 2 + 3), Model.PS4K)).toThrow(/whole stereo 24bit frames/)
	})

	test('accepts the samples from a wav file', () => {
		const frames = 4801
		const channels = [0, 1].map((c) =>
			Array.from({ length: frames }, (_, f) => ((f * 7919 + c * 104729) % 16777216) - 8388608)
		)
		const wav = new wavefile.WaveFile()
		wav.fromScratch(2, 48000, '24', channels)

		// Load it back as a user would
		const samples = Buffer.from((new wavefile.WaveFile(wav.toBuffer()).data as { samples: Uint8Array }).samples)
		expect(samples).toHaveLength(frames * 6)

		expect(convertPCMToAtemAudio(samples, Model.TVS)).toEqual(referenceConvert(samples, false))
		expect(convertPCMToAtemAudio(samples, Model.PS4K)).toEqual(
			referenceConvert(Buffer.concat([samples, Buffer.alloc(6)]), true)
		)
	})
})
