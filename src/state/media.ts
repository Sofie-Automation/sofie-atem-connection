import * as Enums from '../enums/index.js'

export interface MediaPlayer {
	playing: boolean
	loop: boolean
	atBeginning: boolean
	clipFrame: number
}

export interface MediaPlayerSource {
	sourceType: Enums.MediaSourceType
	clipIndex: number
	stillIndex: number
}

export type MediaPlayerState = MediaPlayer & MediaPlayerSource

export interface MediaState {
	readonly stillPool: Array<StillFrame | undefined>
	readonly clipPool: Array<ClipBank | undefined>
	readonly players: Array<MediaPlayerState | undefined>
}

export interface StillFrame {
	isUsed: boolean
	hash: string
	fileName: string
}

export interface ClipBank {
	isUsed: boolean
	name: string
	frameCount: number
	frames: Array<StillFrame | undefined>
}
