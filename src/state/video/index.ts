import * as Enum from '../../enums/index.js'
import * as USK from './upstreamKeyers.js'
import * as DSK from './downstreamKeyers.js'
import * as SuperSource from './superSource.js'

export { USK, DSK, SuperSource }

export interface DipTransitionSettings {
	rate: number
	input: number
}

export interface DVETransitionSettings {
	rate: number
	logoRate: number
	style: Enum.DVEEffect
	fillSource: number
	keySource: number

	enableKey: boolean
	preMultiplied: boolean
	clip: number
	gain: number
	invertKey: boolean
	reverse: boolean
	flipFlop: boolean
}

export interface MixTransitionSettings {
	rate: number // 0...250
}

export interface StingerTransitionSettings {
	source: number
	preMultipliedKey: boolean

	clip: number
	gain: number // 0...1000
	invert: boolean

	preroll: number
	clipDuration: number
	triggerPoint: number
	mixRate: number
}

export interface WipeTransitionSettings {
	rate: number
	pattern: number
	borderWidth: number
	borderInput: number
	symmetry: number
	borderSoftness: number
	xPosition: number
	yPosition: number
	reverseDirection: boolean
	flipFlop: boolean
}

export interface TransitionProperties {
	/** If in a transition, this is the style of the running transition. If no transition is active it will mirror nextStyle */
	readonly style: Enum.TransitionStyle
	/** If in a transition, this is the selection of the running transition. If no transition is active it will mirror nextSelection */
	readonly selection: Enum.TransitionSelection[]
	/** The style for the next transition */
	nextStyle: Enum.TransitionStyle
	/** The selection for the next transition */
	nextSelection: Enum.TransitionSelection[]
}

export interface TransitionSettings {
	dip?: DipTransitionSettings
	DVE?: DVETransitionSettings
	mix?: MixTransitionSettings
	stinger?: StingerTransitionSettings
	wipe?: WipeTransitionSettings
}

export interface TransitionPosition {
	readonly inTransition: boolean
	readonly remainingFrames: number
	handlePosition: number
}

export interface MixEffect {
	readonly index: number
	programInput: number
	previewInput: number
	transitionPreview: boolean
	fadeToBlack?: FadeToBlackProperties
	transitionPosition: TransitionPosition
	transitionProperties: TransitionProperties
	transitionSettings: TransitionSettings
	readonly upstreamKeyers: Array<USK.UpstreamKeyer | undefined>
}

export interface FadeToBlackProperties {
	readonly isFullyBlack: boolean
	readonly inTransition: boolean
	readonly remainingFrames: number
	rate: number
}

export interface AtemVideoState {
	readonly mixEffects: Array<MixEffect | undefined>
	readonly downstreamKeyers: Array<DSK.DownstreamKeyer | undefined>
	readonly auxilliaries: Array<number | undefined>
	readonly superSources: Array<SuperSource.SuperSource | undefined>
}
