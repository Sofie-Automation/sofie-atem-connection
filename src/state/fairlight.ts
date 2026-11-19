import {
	FairlightAudioMixOption,
	FairlightInputConfiguration,
	FairlightAnalogInputLevel,
	FairlightAudioSourceType,
	ExternalPortType,
	FairlightInputType,
	AudioChannelPair,
	AudioInternalPortType,
} from '../enums/index.js'

export interface FairlightAudioDynamicsState {
	makeUpGain?: number

	limiter?: FairlightAudioLimiterState
	compressor?: FairlightAudioCompressorState
	expander?: FairlightAudioExpanderState
}

export interface FairlightAudioLimiterState {
	limiterEnabled: boolean
	threshold: number
	attack: number
	hold: number
	release: number
}

export interface FairlightAudioCompressorState {
	compressorEnabled: boolean
	threshold: number
	ratio: number
	attack: number
	hold: number
	release: number
}

export interface FairlightAudioExpanderState {
	expanderEnabled: boolean
	gateEnabled: boolean
	threshold: number
	range: number
	ratio: number
	attack: number
	hold: number
	release: number
}

export interface FairlightAudioEqualizerBandState {
	bandEnabled: boolean

	readonly supportedShapes: number[] // TODO
	shape: number // TODO

	readonly supportedFrequencyRanges: number[] // TODO
	frequencyRange: number // TODO

	frequency: number

	gain: number
	qFactor: number
}

export interface FairlightAudioMasterChannelPropertiesState {
	/** Gain in decibel, -Infinity to +6dB */
	faderGain: number
	followFadeToBlack: boolean
}
export interface FairlightAudioMasterChannel {
	properties?: FairlightAudioMasterChannelPropertiesState

	equalizer?: FairlightAudioEqualizerState
	dynamics?: Omit<FairlightAudioDynamicsState, 'expander'>
	//levels?: FairlightAudioMasterLevelsState | undefined
}

export interface FairlightAudioMonitorChannel {
	gain: number
	inputMasterGain: number
	inputMasterMuted: boolean
	inputTalkbackGain: number
	inputTalkbackMuted: boolean
	inputSidetoneGain: number
	// inputSidetoneMuted: boolean
}

export interface FairlightAudioMonitorSolo {
	solo: boolean
	index: number
	source: string
}

export interface FairlightAudioSource {
	properties?: FairlightAudioSourcePropertiesState
	equalizer?: FairlightAudioEqualizerState
	dynamics?: FairlightAudioDynamicsState
	//levels?: FairlightAudioSourceLevelsState | undefined
}
export interface FairlightAudioEqualizerState {
	enabled: boolean
	gain: number
	readonly bands: Array<FairlightAudioEqualizerBandState | undefined>
}
export interface FairlightAudioSourcePropertiesState {
	readonly sourceType: FairlightAudioSourceType

	readonly maxFramesDelay: number
	framesDelay: number

	readonly hasStereoSimulation: boolean
	stereoSimulation: number

	gain: number
	balance: number
	faderGain: number

	readonly supportedMixOptions: FairlightAudioMixOption[]
	mixOption: FairlightAudioMixOption
}

export interface FairlightAudioInput {
	properties?: FairlightAudioInputProperties
	sources: { [sourceId: string]: FairlightAudioSource | undefined }

	// analog?: FairlightAudioInputAnalog
}

// export interface FairlightAudioInputAnalog {
// 	readonly supportedInputLevels: FairlightAnalogInputLevel[]
// 	inputLevel: FairlightAnalogInputLevel
// }

export interface FairlightAudioInputProperties {
	readonly inputType: FairlightInputType
	readonly externalPortType: ExternalPortType

	readonly supportedConfigurations: FairlightInputConfiguration[]
	activeConfiguration: FairlightInputConfiguration

	readonly supportedInputLevels: FairlightAnalogInputLevel[]
	activeInputLevel: FairlightAnalogInputLevel
}

export interface FairlightAudioRoutingSource {
	readonly audioSourceId: number
	readonly audioChannelPair: AudioChannelPair

	readonly externalPortType: ExternalPortType
	readonly internalPortType: AudioInternalPortType

	name: string
}

export interface FairlightAudioRoutingOutput {
	readonly audioOutputId: number
	readonly audioChannelPair: AudioChannelPair

	readonly externalPortType: ExternalPortType
	readonly internalPortType: AudioInternalPortType

	sourceId: number
	name: string
}

export interface FairlightAudioRouting {
	sources: Record<number, FairlightAudioRoutingSource>
	outputs: Record<number, FairlightAudioRoutingOutput>
}

export interface AtemFairlightAudioState {
	inputs: { [input: number]: FairlightAudioInput | undefined }
	master?: FairlightAudioMasterChannel
	monitor?: FairlightAudioMonitorChannel
	solo?: FairlightAudioMonitorSolo

	audioFollowVideoCrossfadeTransitionEnabled?: boolean

	audioRouting?: FairlightAudioRouting
}
