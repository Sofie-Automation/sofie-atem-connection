import { Model, ProtocolVersion, VideoMode } from '../enums/index.js'

export interface AtemCapabilites {
	readonly mixEffects: number
	readonly sources: number
	readonly auxilliaries: number
	readonly mixMinusOutputs: number
	readonly mediaPlayers: number
	readonly serialPorts: number
	readonly maxHyperdecks: number
	readonly DVEs: number
	readonly stingers: number
	readonly superSources: number
	readonly talkbackChannels: number
	readonly downstreamKeyers: number
	readonly cameraControl: boolean
	readonly advancedChromaKeyers: boolean
	readonly onlyConfigurableOutputs: boolean
}

export interface MixEffectInfo {
	readonly keyCount: number
}

export interface SuperSourceInfo {
	readonly boxCount: number
}

export interface AudioMixerInfo {
	readonly inputs: number
	readonly monitors: number
	readonly headphones: number
}

export interface FairlightAudioMixerInfo {
	readonly inputs: number
	readonly monitors: number
}

export interface MacroPoolInfo {
	readonly macroCount: number
}

export interface MediaPoolInfo {
	readonly stillCount: number
	readonly clipCount: number
}

export interface MultiviewerInfo {
	readonly count: number
	readonly windowCount: number
}

export interface TimeInfo {
	hour: number
	minute: number
	second: number
	frame: number
	dropFrame: boolean
}

export interface DeviceInfo {
	apiVersion: ProtocolVersion
	capabilities?: AtemCapabilites
	model: Model
	productIdentifier?: string
	superSources: Array<SuperSourceInfo | undefined>
	mixEffects: Array<MixEffectInfo | undefined>
	power: boolean[]
	audioMixer?: AudioMixerInfo
	fairlightMixer?: FairlightAudioMixerInfo
	macroPool?: MacroPoolInfo
	mediaPool?: MediaPoolInfo
	multiviewer?: MultiviewerInfo
	// lastTime?: TimeInfo
	supportedVideoModes?: Readonly<Array<SupportedVideoMode>>
}

export interface SupportedVideoMode {
	mode: VideoMode

	requiresReconfig: boolean

	multiviewerModes: Array<VideoMode>
	downConvertModes: Array<VideoMode>
}
