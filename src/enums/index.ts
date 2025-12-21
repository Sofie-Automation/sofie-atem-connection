export enum Model {
	Unknown = 0x00,
	TVS = 0x01,
	OneME = 0x02,
	TwoME = 0x03,
	PS4K = 0x04,
	OneME4K = 0x05,
	TwoME4K = 0x06,
	TwoMEBS4K = 0x07,
	TVSHD = 0x08,
	TVSProHD = 0x09,
	TVSPro4K = 0x0a,
	Constellation = 0x0b,
	Constellation8K = 0x0c,
	Mini = 0x0d,
	MiniPro = 0x0e,
	MiniProISO = 0x0f,
	MiniExtreme = 0x10,
	MiniExtremeISO = 0x11,
	ConstellationHD1ME = 0x12,
	ConstellationHD2ME = 0x13,
	ConstellationHD4ME = 0x14,
	SDI = 0x15,
	SDIProISO = 0x16,
	SDIExtremeISO = 0x17,
	// 0x18 ??
	// 0x19 ??
	TelevisionStudioHD8 = 0x1a,
	TelevisionStudioHD8ISO = 0x1b,
	Constellation4K1ME = 0x1c,
	Constellation4K2ME = 0x1d,
	Constellation4K4ME = 0x1e,
	Constellation4K4MEPlus = 0x1f,
	TelevisionStudio4K8 = 0x20,
	MiniExtremeISOG2 = 0x21,
}

export enum ProtocolVersion {
	V7_2 = 0x00020016, // 2.22 // TODO - verify this is correct
	V7_5_2 = 0x0002001b, // 2.27 // The naming of this may be off
	V8_0 = 0x0002001c, // 2.28
	V8_0_1 = 0x0002001d, // 2.29
	V8_1_1 = 0x0002001e, // 2.30
	V9_4 = 0x0002001f, // 2.31
	V9_6 = 0x00020020, // 2.32
}

export enum TransitionStyle {
	MIX = 0x00,
	DIP = 0x01,
	WIPE = 0x02,
	DVE = 0x03,
	STING = 0x04,
}

export enum TransitionSelection {
	Background = 1 << 0,
	Key1 = 1 << 1,
	Key2 = 1 << 2,
	Key3 = 1 << 3,
	Key4 = 1 << 4,
}

export enum DVEEffect {
	SwooshTopLeft = 0,
	SwooshTop = 1,
	SwooshTopRight = 2,
	SwooshLeft = 3,
	SwooshRight = 4,
	SwooshBottomLeft = 5,
	SwooshBottom = 6,
	SwooshBottomRight = 7,

	SpinCCWTopRight = 13,
	SpinCWTopLeft = 8,
	SpinCCWBottomRight = 15,
	SpinCWBottomLeft = 10,
	SpinCWTopRight = 9,
	SpinCCWTopLeft = 12,
	SpinCWBottomRight = 11,
	SpinCCWBottomLeft = 14,

	SqueezeTopLeft = 16,
	SqueezeTop = 17,
	SqueezeTopRight = 18,
	SqueezeLeft = 19,
	SqueezeRight = 20,
	SqueezeBottomLeft = 21,
	SqueezeBottom = 22,
	SqueezeBottomRight = 23,

	PushTopLeft = 24,
	PushTop = 25,
	PushTopRight = 26,
	PushLeft = 27,
	PushRight = 28,
	PushBottomLeft = 29,
	PushBottom = 30,
	PushBottomRight = 31,

	GraphicCWSpin = 32,
	GraphicCCWSpin = 33,
	GraphicLogoWipe = 34,
}

export enum MacroAction {
	Run = 0,
	Stop = 1,
	StopRecord = 2,
	InsertUserWait = 3,
	Continue = 4,
	Delete = 5,
}

export enum ExternalPortType {
	Unknown = 0,
	SDI = 1,
	HDMI = 2,
	Component = 4,
	Composite = 8,
	SVideo = 16,
	XLR = 32,
	AESEBU = 64,
	RCA = 128,
	Internal = 256,
	TSJack = 512,
	MADI = 1024,
	TRSJack = 2048,
	RJ45 = 4096,
}

export enum InternalPortType {
	External = 0,
	Black = 1,
	ColorBars = 2,
	ColorGenerator = 3,
	MediaPlayerFill = 4,
	MediaPlayerKey = 5,
	SuperSource = 6,
	// Since V8_1_1
	ExternalDirect = 7,

	MEOutput = 128,
	Auxiliary = 129,
	Mask = 130,
	// Since V8_1_1
	MultiViewer = 131,
}

export enum SourceAvailability {
	None = 0,
	Auxiliary = 1 << 0,
	Multiviewer = 1 << 1,
	SuperSourceArt = 1 << 2,
	SuperSourceBox = 1 << 3,
	KeySource = 1 << 4,
	Auxiliary1 = 1 << 5,
	Auxiliary2 = 1 << 6,
	All = Auxiliary | Multiviewer | SuperSourceArt | SuperSourceBox | KeySource | Auxiliary1 | Auxiliary2,
}

export enum MeAvailability {
	None = 0,
	Me1 = 1 << 0,
	Me2 = 1 << 1,
	Me3 = 1 << 2,
	Me4 = 1 << 3,
	All = Me1 | Me2 | Me3 | Me4,
}

export enum BorderBevel {
	None = 0,
	InOut = 1,
	In = 2,
	Out = 3,
}

export enum IsAtKeyFrame {
	None = 0,
	A = 1 << 0,
	B = 1 << 1,
	RunToInfinite = 1 << 2,
}

export enum Pattern {
	LeftToRightBar = 0,
	TopToBottomBar = 1,
	HorizontalBarnDoor = 2,
	VerticalBarnDoor = 3,
	CornersInFourBox = 4,
	RectangleIris = 5,
	DiamondIris = 6,
	CircleIris = 7,
	TopLeftBox = 8,
	TopRightBox = 9,
	BottomRightBox = 10,
	BottomLeftBox = 11,
	TopCentreBox = 12,
	RightCentreBox = 13,
	BottomCentreBox = 14,
	LeftCentreBox = 15,
	TopLeftDiagonal = 16,
	TopRightDiagonal = 17,
}

export enum MixEffectKeyType {
	Luma = 0,
	Chroma = 1,
	Pattern = 2,
	DVE = 3,
}

export enum FlyKeyKeyFrame {
	None = 0,
	A = 1,
	B = 2,
	Full = 3,
	RunToInfinite = 4,
}

export enum FlyKeyDirection {
	CentreOfKey = 0,
	TopLeft = 1,
	TopCentre = 2,
	TopRight = 3,
	MiddleLeft = 4,
	MiddleCentre = 5,
	MiddleRight = 6,
	BottomLeft = 7,
	BottomCentre = 8,
	BottomRight = 9,
}

export enum SuperSourceArtOption {
	Background,
	Foreground,
}

export enum VideoFormat {
	SD,
	HD720,
	HD1080,
	UHD4K,
	UDH8K,
}

export enum VideoMode {
	N525i5994NTSC = 0,
	P625i50PAL = 1,
	N525i5994169 = 2,
	P625i50169 = 3,

	P720p50 = 4,
	N720p5994 = 5,
	P1080i50 = 6,
	N1080i5994 = 7,
	N1080p2398 = 8,
	N1080p24 = 9,
	P1080p25 = 10,
	N1080p2997 = 11,
	P1080p50 = 12,
	N1080p5994 = 13,

	N4KHDp2398 = 14,
	N4KHDp24 = 15,
	P4KHDp25 = 16,
	N4KHDp2997 = 17,

	P4KHDp5000 = 18,
	N4KHDp5994 = 19,

	N8KHDp2398 = 20,
	N8KHDp24 = 21,
	P8KHDp25 = 22,
	N8KHDp2997 = 23,
	P8KHDp50 = 24,
	N8KHDp5994 = 25,

	N1080p30 = 26,
	N1080p60 = 27,
}

export enum MediaSourceType {
	Still = 1,
	Clip,
}

export enum AudioMixOption {
	Off = 0,
	On = 1,
	AudioFollowVideo = 2,
}

export enum AudioSourceType {
	ExternalVideo,
	MediaPlayer,
	ExternalAudio,
}

export enum StreamingError {
	None,
	InvalidState = 1 << 4,
	Unknown = 1 << 15,
}

export enum StreamingStatus {
	Idle = 1 << 0,
	Connecting = 1 << 1,
	Streaming = 1 << 2,
	Stopping = 1 << 5, // + Streaming
}

export enum RecordingError {
	None = 1 << 1,
	NoMedia = 0,
	MediaFull = 1 << 2,
	MediaError = 1 << 3,
	MediaUnformatted = 1 << 4,
	DroppingFrames = 1 << 5,
	Unknown = 1 << 15,
}

export enum RecordingStatus {
	Idle = 0,
	Recording = 1 << 0,
	Stopping = 1 << 7,
}

export enum RecordingDiskStatus {
	Idle = 1 << 0,
	Unformatted = 1 << 1,
	Active = 1 << 2,
	Recording = 1 << 3,

	Removed = 1 << 5,
}

export enum FairlightAudioMixOption {
	Off = 1,
	On = 2,
	AudioFollowVideo = 4,
}

export enum FairlightInputConfiguration {
	Mono = 1,
	Stereo = 2,
	DualMono = 4,
}

export enum FairlightAnalogInputLevel {
	Microphone = 1,
	ConsumerLine = 2,
	// [Since(ProtocolVersion.V8_1_1)]
	ProLine = 4,
}

export enum FairlightAudioSourceType {
	Mono = 0,
	Stereo = 1,
}

export enum FairlightInputType {
	EmbeddedWithVideo = 0,
	MediaPlayer = 1,
	AudioIn = 2,
	MADI = 4,
}

export enum MultiViewerLayout {
	Default = 0,
	TopLeftSmall = 1,
	TopRightSmall = 2,
	ProgramBottom = TopLeftSmall | TopRightSmall,
	BottomLeftSmall = 4,
	ProgramRight = TopLeftSmall | BottomLeftSmall,
	BottomRightSmall = 8,
	ProgramLeft = TopRightSmall | BottomRightSmall,
	ProgramTop = BottomLeftSmall | BottomRightSmall,
}

export enum DisplayClockClockState {
	Stopped = 0,
	Running = 1,
	Reset = 2,
}

export enum DisplayClockClockMode {
	Countdown = 0,
	Countup = 1,
	TimeOfDay = 2,
}

export enum AudioChannelPair {
	Channel1_2 = 0,
	Channel3_4 = 1,
	Channel5_6 = 2,
	Channel7_8 = 3,
	Channel9_10 = 4,
	Channel11_12 = 5,
	Channel13_14 = 6,
	Channel15_16 = 7,
}

export enum AudioInternalPortType {
	NotInternal = 0, // TODO - verify
	NoAudio = 1, // TODO - verify
	TalkbackMix = 2, // TODO - verify
	EngineeringTalkbackMix = 3, // TODO - verify
	ProductionTalkbackMix = 4, // TODO - verify
	MediaPlayer = 5, // TODO - verify
	Program = 6,
	Return = 7,
	Monitor = 8, // TODO - verify
	Madi = 9,
	AuxOut = 10,
	AudioAuxOut = 11, // TODO - verify
}

export enum TimeMode {
	FreeRun = 0,
	TimeOfDay = 1,
}
