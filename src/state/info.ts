import { Model, ProtocolVersion, VideoMode } from '../enums'

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
	/** The number of inputs which can carry embedded talkback. Not reported before v8.0 */
	readonly talkbackOverSDIChannels?: number
	readonly downstreamKeyers: number
	readonly cameraControl: boolean
	/** Whether any of the inputs are SDI, rather than every input being HDMI. Not reported before v8.1.1 */
	readonly hasSDI?: boolean
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

export interface FairlightEqualizerFrequencyRangeInfo {
	/** Matches the `frequencyRange` of a FairlightAudioEqualizerBandState */
	readonly frequencyRange: number
	readonly minFrequency: number
	readonly maxFrequency: number
}

export interface FairlightAudioMixerInfo {
	readonly inputs: number
	readonly monitors: number
	/** The frequency range each equalizer band can be set to, and the frequencies each covers */
	readonly equalizerFrequencyRanges?: FairlightEqualizerFrequencyRangeInfo[]
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
	readonly canChangeLayout: boolean
	readonly canRouteInputs: boolean
	readonly supportsVuMeters: boolean
	readonly canToggleSafeArea: boolean
	/** Note: not reported by devices before v8.0 */
	readonly canSwapPreviewProgram: boolean
	/** Note: not reported by devices before v8.0 */
	readonly supportsQuadrants: boolean
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
