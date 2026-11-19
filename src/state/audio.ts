import { AudioSourceType, ExternalPortType, AudioMixOption } from '../enums/index.js'

export type AudioChannel = ClassicAudioChannel
export type AudioMasterChannel = ClassicAudioMasterChannel
export type AtemAudioState = AtemClassicAudioState

export interface ClassicAudioChannel {
	readonly sourceType: AudioSourceType
	portType: ExternalPortType
	mixOption: AudioMixOption
	/** Gain in decibel, -Infinity to +6dB */
	gain: number
	/** Balance, -50 to +50 */
	balance: number

	readonly supportsRcaToXlrEnabled: boolean
	rcaToXlrEnabled: boolean
}

export interface ClassicAudioMasterChannel {
	/** Gain in decibel, -Infinity to +6dB */
	gain: number
	/** Balance, -50 to +50 */
	balance: number
	followFadeToBlack: boolean
}

export interface ClassicAudioMonitorChannel {
	enabled: boolean
	/** Gain in decibel, -Infinity to +6dB */
	gain: number

	mute: boolean

	solo: boolean
	soloSource: number

	dim: boolean
	dimLevel: number
}

export interface ClassicAudioHeadphoneOutputChannel {
	/** Gain in decibel, -Infinity to ?dB */
	gain: number
	/** Gain in decibel, -Infinity to ?dB */
	programOutGain: number
	/** Gain in decibel, -Infinity to ?dB */
	sidetoneGain: number
	/** Gain in decibel, -Infinity to ?dB */
	talkbackGain: number
}

export interface AtemClassicAudioState {
	readonly numberOfChannels?: number
	readonly hasMonitor?: boolean
	channels: { [channelId: number]: ClassicAudioChannel | undefined }
	monitor?: ClassicAudioMonitorChannel
	headphones?: ClassicAudioHeadphoneOutputChannel
	master?: ClassicAudioMasterChannel

	audioFollowVideoCrossfadeTransitionEnabled?: boolean
}
