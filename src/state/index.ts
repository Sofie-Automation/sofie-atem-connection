import * as Info from './info.js'
import * as Video from './video/index.js'
import * as ClassicAudio from './audio.js'
import * as Media from './media.js'
import * as Input from './input.js'
import * as Macro from './macro.js'
import * as Settings from './settings.js'
import * as Recording from './recording.js'
import * as Streaming from './streaming.js'
import * as Fairlight from './fairlight.js'
import * as DisplayClock from './displayClock.js'
import * as AtemStateUtil from './util.js'
import { ColorGeneratorState } from './color.js'

export {
	AtemStateUtil,
	Info,
	Video,
	ClassicAudio,
	Media,
	Input,
	Macro,
	Settings,
	Recording,
	Streaming,
	Fairlight,
	DisplayClock,
	ColorGeneratorState,
}

export interface AtemState {
	info: Info.DeviceInfo
	video: Video.AtemVideoState
	audio?: ClassicAudio.AtemClassicAudioState
	fairlight?: Fairlight.AtemFairlightAudioState
	media: Media.MediaState
	inputs: { [inputId: number]: Input.InputChannel | undefined }
	macro: Macro.MacroState
	settings: Settings.SettingsState
	recording?: Recording.RecordingState
	streaming?: Streaming.StreamingState
	colorGenerators?: { [index: number]: ColorGeneratorState | undefined }
	displayClock?: DisplayClock.DisplayClockState
}

export class InvalidIdError extends Error {
	constructor(message: string, ...ids: Array<number | string>) {
		super(InvalidIdError.BuildErrorString(message, ids))
		Object.setPrototypeOf(this, new.target.prototype)
	}

	private static BuildErrorString(message: string, ids: Array<number | string>): string {
		if (ids && ids.length > 0) {
			return `${message} ${ids.join('-')} is not valid`
		} else {
			return message
		}
	}
}
