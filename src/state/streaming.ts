import { StreamingError, StreamingStatus } from '../enums/index.js'
import { Timecode } from './common.js'

export interface StreamingState {
	status?: StreamingStateStatus
	stats?: StreamingStateStats
	service: StreamingServiceProperties

	duration?: Timecode

	audioBitrates?: StreamingAudioBitrates
}

export interface StreamingStateStatus {
	readonly state: StreamingStatus
	readonly error: StreamingError
}

export interface StreamingStateStats {
	readonly cacheUsed: number
	readonly encodingBitrate: number
}

export interface StreamingServiceProperties {
	serviceName: string
	url: string
	key: string

	bitrates: [number, number]
}

export interface StreamingAudioBitrates {
	lowBitrate: number
	highBitrate: number
}
