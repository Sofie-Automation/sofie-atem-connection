import { VideoMode, MultiViewerLayout, TimeMode } from '../enums'

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
export interface MultiViewerBorderColorState {
	/** Red component 0-1000 */
	red: number
	/** Green component 0-1000 */
	green: number
	/** Blue component 0-1000 */
	blue: number
	/** Alpha component 0-1000 */
	alpha: number
}

export interface MultiViewer {
	readonly index: number
	readonly windows: Array<MultiViewerWindowState | undefined>
	properties?: MultiViewerPropertiesState
	vuOpacity?: number

	borderColor?: MultiViewerBorderColorState
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
