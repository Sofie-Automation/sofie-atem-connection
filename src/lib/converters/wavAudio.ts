import * as Enums from '../../enums/index.js'
import WaveFile = require('wavefile')

export function convertWAVToRaw(inputBuffer: Buffer, model: Enums.Model | undefined): Buffer {
	const wav = new (WaveFile as any)(inputBuffer)

	if (wav.fmt.bitsPerSample !== 24) {
		throw new Error(`Invalid wav bit bits per sample: ${wav.fmt.bitsPerSample}`)
	}

	if (wav.fmt.numChannels !== 2) {
		throw new Error(`Invalid number of wav channels: ${wav.fmt.numChannels}`)
	}

	const buffer = Buffer.from(wav.data.samples)
	const buffer2 = Buffer.alloc(buffer.length)
	for (let i = 0; i < buffer.length; i += 3) {
		// 24bit samples, change endian from wavfile to atem requirements
		buffer2.writeUIntBE(buffer.readUIntLE(i, 3), i, 3)
	}

	if (model === undefined || model >= Enums.Model.PS4K) {
		// If we don't know the model, assume we want the newer mode as that is more likely
		// Newer models want a weird byte order
		// This works in 4 byte words, but a stereo 24bit frame is 6 bytes. With an odd number of frames, pad with a
		// frame of silence so that the data is a whole number of both
		const padded = buffer2.length % 4 === 0 ? buffer2 : Buffer.concat([buffer2, Buffer.alloc(6)])
		const buffer3 = Buffer.alloc(padded.length)
		for (let i = 0; i < padded.length; i += 4) {
			buffer3.writeUIntBE(padded.readUIntLE(i, 4), i, 4)
		}

		return buffer3
	} else {
		return buffer2
	}
}
