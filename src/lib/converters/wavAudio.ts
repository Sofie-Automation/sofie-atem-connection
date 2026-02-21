import * as Enums from '../../enums/index.js'
import WaveFile from 'wavefile'

export function convertWAVToRaw(inputBuffer: Buffer, model: Enums.Model | undefined): Buffer {
	const wav = new (WaveFile as any)(inputBuffer)

	if (wav.fmt.bitsPerSample !== 24) {
		throw new Error(`Invalid wav bit bits per sample: ${wav.fmt.bitsPerSample}`)
	}

	if (wav.fmt.numChannels !== 2) {
		throw new Error(`Invalid number of wav channels: ${wav.fmt.numChannel}`)
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
		const buffer3 = Buffer.alloc(buffer2.length)
		for (let i = 0; i < buffer.length; i += 4) {
			buffer3.writeUIntBE(buffer2.readUIntLE(i, 4), i, 4)
		}

		return buffer3
	} else {
		return buffer2
	}
}
