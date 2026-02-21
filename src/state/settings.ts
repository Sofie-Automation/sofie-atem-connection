import { VideoMode, MultiViewerLayout, TimeMode } from '../enums/index.js'

export interface MultiViewerSourceState {
	source: number
	readonly windowIndex: number
	readonly supportsVuMeter: boolean
	readonly supportsSafeArea: boolean
}

export interface MultiViewerWindowState extends MultiViewerSourceState {
	safeTitle?: boolean
	audioMeter?: boolean
}

export interface MultiViewerPropertiesState {
	layout: MultiViewerLayout
	programPreviewSwapped: boolean
}

export interface MultiViewer {
	readonly index: number
	readonly windows: Array<MultiViewerWindowState | undefined>
	properties?: MultiViewerPropertiesState
	vuOpacity?: number
}

export interface MediaPool {
	maxFrames: number[]
	unassignedFrames: number
}

export interface SettingsState {
	readonly multiViewers: Array<MultiViewer | undefined>
	videoMode: VideoMode
	mediaPool?: MediaPool
	timeMode?: TimeMode
}
