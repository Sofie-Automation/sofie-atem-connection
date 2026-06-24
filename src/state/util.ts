import { AtemState } from './index.js'
import * as Enums from '../enums/index.js'
import { MultiViewer } from './settings.js'
import { MediaPlayerState, ClipBank } from './media.js'
import { MixEffect, SuperSource, DSK, USK } from './video/index.js'

export function Create(): AtemState {
	return {
		info: {
			apiVersion: Enums.ProtocolVersion.Unknown,
			model: Enums.Model.Unknown,
			superSources: [],
			mixEffects: [],
			power: [],
		},
		video: {
			mixEffects: [],
			downstreamKeyers: [],
			auxilliaries: [],
			superSources: [],
		},
		media: {
			stillPool: [],
			clipPool: [],
			players: [],
		},
		inputs: {},
		macro: {
			macroPlayer: {
				isRunning: false,
				isWaiting: false,
				loop: false,
				macroIndex: 0,
			},
			macroRecorder: {
				isRecording: false,
				macroIndex: 0,
			},
			macroProperties: [],
		},
		settings: {
			multiViewers: [],
			videoMode: 0,
			mediaPool: undefined,
		},
	}
}

export function getMultiViewer(state: AtemState, index: number): MultiViewer {
	const multiViewer = state.settings.multiViewers[index]
	if (!multiViewer) {
		return (state.settings.multiViewers[index] = { index, windows: [] })
	}

	return multiViewer
}

export function getMediaPlayer(state: AtemState, index: number, dontCreate?: boolean): MediaPlayerState {
	let player = state.media.players[index]
	if (!player) {
		player = {
			playing: false,
			loop: false,
			atBeginning: true,
			clipFrame: 0,
			sourceType: Enums.MediaSourceType.Still,
			clipIndex: 0,
			stillIndex: 0,
		}

		if (!dontCreate) {
			state.media.players[index] = player
		}
	}

	return player
}

export function getClip(state: AtemState, index: number): ClipBank {
	const clip = state.media.clipPool[index]
	if (!clip) {
		return (state.media.clipPool[index] = {
			isUsed: false,
			name: '',
			frameCount: 0,
			frames: [],
		})
	}

	return clip
}

export function getMixEffect(state: AtemState, index: number, dontCreate?: boolean): MixEffect {
	let me = state.video.mixEffects[index]
	if (!me) {
		me = {
			index,
			programInput: 0,
			previewInput: 0,
			transitionPreview: false,
			transitionPosition: {
				inTransition: false,
				handlePosition: 0,
				remainingFrames: 0,
			},
			transitionProperties: {
				style: Enums.TransitionStyle.MIX,
				selection: [Enums.TransitionSelection.Background],
				nextStyle: Enums.TransitionStyle.MIX,
				nextSelection: [Enums.TransitionSelection.Background],
			},
			transitionSettings: {},
			upstreamKeyers: [],
		}

		if (!dontCreate) {
			state.video.mixEffects[index] = me
		}
	}

	return me
}

export function getSuperSource(state: AtemState, index: number, dontCreate?: boolean): SuperSource.SuperSource {
	let ssrc = state.video.superSources[index]
	if (!ssrc) {
		ssrc = {
			index,
			boxes: [undefined, undefined, undefined, undefined],
		}

		if (!dontCreate) {
			state.video.superSources[index] = ssrc
		}
	}

	return ssrc
}

export function getDownstreamKeyer(state: AtemState, index: number, dontCreate?: boolean): DSK.DownstreamKeyer {
	let dsk = state.video.downstreamKeyers[index]
	if (!dsk) {
		dsk = {
			isAuto: false,
			remainingFrames: 0,
			onAir: false,
			inTransition: false,
		}

		if (!dontCreate) {
			state.video.downstreamKeyers[index] = dsk
		}
	}

	return dsk
}

export function getUpstreamKeyer(mixEffect: MixEffect, index: number, dontCreate?: boolean): USK.UpstreamKeyer {
	let usk = mixEffect.upstreamKeyers[index]
	if (!usk) {
		usk = {
			canFlyKey: false,
			upstreamKeyerId: index,
			mixEffectKeyType: 0,
			cutSource: 0,
			fillSource: 0,
			onAir: false,
			flyEnabled: false,
			flyKeyframes: [undefined, undefined],
			maskSettings: {
				maskEnabled: false,
				maskTop: 0,
				maskBottom: 0,
				maskLeft: 0,
				maskRight: 0,
			},
		}

		if (!dontCreate) {
			mixEffect.upstreamKeyers[index] = usk
		}
	}

	return usk
}
