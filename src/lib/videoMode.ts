import * as Enums from '../enums/index.js'

export interface VideoModeInfo {
	format: Enums.VideoFormat
	width: number
	height: number
}
const dimsPAL: Pick<VideoModeInfo, 'width' | 'height' | 'format'> = {
	format: Enums.VideoFormat.SD,
	width: 720,
	height: 576,
}
const dimsNTSC: Pick<VideoModeInfo, 'width' | 'height' | 'format'> = {
	format: Enums.VideoFormat.SD,
	width: 640,
	height: 480,
}
const dims720p: Pick<VideoModeInfo, 'width' | 'height' | 'format'> = {
	format: Enums.VideoFormat.HD720,
	width: 1280,
	height: 720,
}
const dims1080p: Pick<VideoModeInfo, 'width' | 'height' | 'format'> = {
	format: Enums.VideoFormat.HD1080,
	width: 1920,
	height: 1080,
}
const dims4k: Pick<VideoModeInfo, 'width' | 'height' | 'format'> = {
	format: Enums.VideoFormat.UHD4K,
	width: 3840,
	height: 2160,
}
const dims8k: Pick<VideoModeInfo, 'width' | 'height' | 'format'> = {
	format: Enums.VideoFormat.UDH8K,
	width: 7680,
	height: 4260,
}
const VideoModeInfoImpl: {
	[key in Enums.VideoMode]: VideoModeInfo
} = {
	[Enums.VideoMode.N525i5994NTSC]: {
		...dimsNTSC,
	},
	[Enums.VideoMode.P625i50PAL]: {
		...dimsPAL,
	},
	[Enums.VideoMode.N525i5994169]: {
		...dimsNTSC,
	},
	[Enums.VideoMode.P625i50169]: {
		...dimsPAL,
	},

	[Enums.VideoMode.P720p50]: {
		...dims720p,
	},
	[Enums.VideoMode.N720p5994]: {
		...dims720p,
	},
	[Enums.VideoMode.P1080i50]: {
		...dims1080p,
	},
	[Enums.VideoMode.N1080i5994]: {
		...dims1080p,
	},
	[Enums.VideoMode.N1080p2398]: {
		...dims1080p,
	},
	[Enums.VideoMode.N1080p24]: {
		...dims1080p,
	},
	[Enums.VideoMode.P1080p25]: {
		...dims1080p,
	},
	[Enums.VideoMode.N1080p2997]: {
		...dims1080p,
	},
	[Enums.VideoMode.P1080p50]: {
		...dims1080p,
	},
	[Enums.VideoMode.N1080p5994]: {
		...dims1080p,
	},

	[Enums.VideoMode.N4KHDp2398]: {
		...dims4k,
	},
	[Enums.VideoMode.N4KHDp24]: {
		...dims4k,
	},
	[Enums.VideoMode.P4KHDp25]: {
		...dims4k,
	},
	[Enums.VideoMode.N4KHDp2997]: {
		...dims4k,
	},

	[Enums.VideoMode.P4KHDp5000]: {
		...dims4k,
	},
	[Enums.VideoMode.N4KHDp5994]: {
		...dims4k,
	},

	[Enums.VideoMode.N8KHDp2398]: {
		...dims8k,
	},
	[Enums.VideoMode.N8KHDp24]: {
		...dims8k,
	},
	[Enums.VideoMode.P8KHDp25]: {
		...dims8k,
	},
	[Enums.VideoMode.N8KHDp2997]: {
		...dims8k,
	},
	[Enums.VideoMode.P8KHDp50]: {
		...dims8k,
	},
	[Enums.VideoMode.N8KHDp5994]: {
		...dims8k,
	},

	[Enums.VideoMode.N1080p30]: {
		...dims1080p,
	},
	[Enums.VideoMode.N1080p60]: {
		...dims1080p,
	},
}

export function getVideoModeInfo(videoMode: Enums.VideoMode): VideoModeInfo | undefined {
	return VideoModeInfoImpl[videoMode]
}
