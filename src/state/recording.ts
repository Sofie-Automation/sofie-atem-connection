import { RecordingError, RecordingStatus, RecordingDiskStatus } from '../enums/index.js'
import { Timecode } from './common.js'

export interface RecordingState {
	status?: RecordingStateStatus
	properties: RecordingStateProperties

	recordAllInputs?: boolean

	duration?: Timecode

	disks: { [id: number]: RecordingDiskProperties | undefined }
}

export interface RecordingDiskProperties {
	diskId: number
	volumeName: string
	recordingTimeAvailable: number
	status: RecordingDiskStatus
}

export interface RecordingStateStatus {
	state: RecordingStatus
	error: RecordingError

	recordingTimeAvailable: number
}

export interface RecordingStateProperties {
	filename: string

	workingSet1DiskId: number
	workingSet2DiskId: number

	recordInAllCameras: boolean
}
