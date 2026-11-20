import { DisplayClockClockMode, DisplayClockClockState } from '../enums/index.js'

export interface DisplayClockTime {
	hours: number
	minutes: number
	seconds: number
	frames: number
}

export interface DisplayClockProperties {
	enabled: boolean
	size: number
	opacity: number
	positionX: number
	positionY: number
	autoHide: boolean
	startFrom: DisplayClockTime
	clockMode: DisplayClockClockMode
	clockState: DisplayClockClockState
}

export interface DisplayClockState {
	properties: DisplayClockProperties

	/**
	 * Note: this is only updated following a call to DisplayClockRequestTime
	 */
	currentTime: DisplayClockTime
}
