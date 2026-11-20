import * as Enums from '../../enums/index.js'

const BYTES_PER_SAMPLE = 3
const BYTES_PER_FRAME = BYTES_PER_SAMPLE * 2

/**
 * Convert interleaved stereo 24bit little-endian PCM samples into the format expected by the ATEM
 * @param samples Interleaved stereo 24bit little-endian PCM samples, as found in the data chunk of a wav file
 * @param model The model of the ATEM. If unknown, the format for newer models is used
 */
export function convertPCMToAtemAudio(samples: Uint8Array, model: Enums.Model | undefined): Buffer {
	if (samples.length % BYTES_PER_FRAME !== 0) {
		throw new Error(`Audio must be whole stereo 24bit frames (${BYTES_PER_FRAME} bytes each)`)
	}

	// If we don't know the model, assume we want the newer mode as that is more likely
	if (model === undefined || model >= Enums.Model.PS4K) {
		return convertSamplesWordSwapped(samples)
	} else {
		return convertSamplesBigEndian(samples)
	}
}

/**
 * Older models want each 24bit sample in big-endian order
 */
function convertSamplesBigEndian(samples: Uint8Array): Buffer {
	const output = Buffer.alloc(samples.length)
	for (let i = 0; i < samples.length; i += BYTES_PER_SAMPLE) {
		output[i] = samples[i + 2]
		output[i + 1] = samples[i + 1]
		output[i + 2] = samples[i]
	}
	return output
}

/**
 * Newer models want the big-endian 24bit sample stream, but with every 32bit word of that stream byte-swapped.
 * As samples don't align to words, each output byte is mapped directly back to its source byte.
 */
function convertSamplesWordSwapped(samples: Uint8Array): Buffer {
	// The stream must be a whole number of words, so pad an odd number of frames with a frame of silence
	const outputLength = samples.length % 4 === 0 ? samples.length : samples.length + BYTES_PER_FRAME
	const output = Buffer.alloc(outputLength)
	for (let i = 0; i < outputLength; i++) {
		// Position in the big-endian sample stream which lands at this offset once its word is swapped
		const streamIndex = i - (i % 4) + 3 - (i % 4)
		// Position of that byte in the little-endian input
		const sampleOffset = streamIndex % BYTES_PER_SAMPLE
		const inputIndex = streamIndex - sampleOffset + 2 - sampleOffset

		// Bytes in the padding are left as silence
		if (inputIndex < samples.length) output[i] = samples[inputIndex]
	}
	return output
}
