import { EventEmitter } from 'eventemitter3'
import { AtemState, AtemStateUtil, InvalidIdError, ColorGeneratorState } from './state'
import { AtemSocket } from './lib/atemSocket'
import { ISerializableCommand, IDeserializedCommand } from './commands/CommandBase'
import * as Commands from './commands'
import * as DataTransferCommands from './commands/DataTransfer'
import { MediaPlayer, MediaPlayerSource } from './state/media'
import {
	DipTransitionSettings,
	DVETransitionSettings,
	MixTransitionSettings,
	StingerTransitionSettings,
	SuperSource,
	TransitionProperties,
	WipeTransitionSettings,
} from './state/video'
import * as USK from './state/video/upstreamKeyers'
import { InputChannel } from './state/input'
import { DownstreamKeyerGeneral, DownstreamKeyerMask } from './state/video/downstreamKeyers'
import * as DT from './dataTransfer'
import * as Util from './lib/atemUtil'
import { VideoModeInfo, getVideoModeInfo } from './lib/videoMode'
import * as Enums from './enums'
import {
	ClassicAudioMonitorChannel,
	ClassicAudioMasterChannel,
	ClassicAudioChannel,
	ClassicAudioHeadphoneOutputChannel,
} from './state/audio'
import { listVisibleInputs } from './lib/tally'
import { RecordingStateProperties } from './state/recording'
import { OmitReadonly } from './lib/types'
import { StreamingServiceProperties } from './state/streaming'
import {
	FairlightAudioMonitorChannel,
	FairlightAudioCompressorState,
	FairlightAudioLimiterState,
	FairlightAudioEqualizerBandState,
	FairlightAudioExpanderState,
	FairlightAudioRoutingSource,
	FairlightAudioRoutingOutput,
	FairlightAudioMonitorSolo,
} from './state/fairlight'
import { FairlightDynamicsResetProps } from './commands/Fairlight/common'
import { MultiViewerPropertiesState } from './state/settings'
import {
	calculateGenerateMultiviewerLabelProps,
	generateMultiviewerLabel,
	hasInternalMultiviewerLabelGeneration,
	loadFont,
} from './lib/multiviewLabel'
import { FontFace } from 'freetype2'
import PLazy = require('p-lazy')
import { TimeCommand } from './commands'
import { TimeInfo } from './state/info'
import { SomeAtemAudioLevels } from './state/levels'
import { generateUploadBufferInfo, UploadBufferInfo } from './dataTransfer/dataTransferUploadBuffer'
import { convertWAVToRaw } from './lib/converters/wavAudio'
import { decodeRLE } from './lib/converters/rle'
import { convertYUV422ToRGBA } from './lib/converters/yuv422ToRgba'

export interface AtemOptions {
	address?: string
	port?: number
	debugBuffers?: boolean
	disableMultithreaded?: boolean
	childProcessTimeout?: number
	/**
	 * Maximum size of packets to transmit
	 */
	maxPacketSize?: number
}

export type AtemEvents = {
	error: [string]
	info: [string]
	debug: [string]
	connected: []
	disconnected: []
	stateChanged: [AtemState, string[]]
	levelChanged: [SomeAtemAudioLevels]
	receivedCommands: [IDeserializedCommand[]]
	updatedTime: [TimeInfo]
}

interface SentPackets {
	resolve: () => void
	reject: () => void
}

export enum AtemConnectionStatus {
	CLOSED,
	CONNECTING,
	CONNECTED,
}

export const DEFAULT_PORT = 9910
export const DEFAULT_MAX_PACKET_SIZE = 1416 // Matching ATEM software

export class BasicAtem extends EventEmitter<AtemEvents> {
	private readonly socket: AtemSocket
	protected readonly dataTransferManager: DT.DataTransferManager
	private _state: AtemState | undefined
	private _sentQueue: { [packetId: string]: SentPackets } = {}
	private _status: AtemConnectionStatus

	constructor(options?: AtemOptions) {
		super()

		this._state = AtemStateUtil.Create()
		this._status = AtemConnectionStatus.CLOSED
		this.socket = new AtemSocket({
			debugBuffers: options?.debugBuffers ?? false,
			address: options?.address || '',
			port: options?.port || DEFAULT_PORT,
			disableMultithreaded: options?.disableMultithreaded ?? false,
			childProcessTimeout: options?.childProcessTimeout || 600,
			maxPacketSize: options?.maxPacketSize ?? DEFAULT_MAX_PACKET_SIZE,
		})
		this.dataTransferManager = new DT.DataTransferManager(this.sendCommands.bind(this))

		this.socket.on('receivedCommands', (commands) => {
			this.emit('receivedCommands', commands)
			this._mutateState(commands)
		})
		this.socket.on('ackPackets', (trackingIds) => this._resolveCommands(trackingIds))
		this.socket.on('info', (msg) => this.emit('info', msg))
		this.socket.on('debug', (msg) => this.emit('debug', msg))
		this.socket.on('error', (e) => this.emit('error', e))
		this.socket.on('disconnect', () => {
			this._status = AtemConnectionStatus.CLOSED
			this.dataTransferManager.stopCommandSending()
			this._rejectAllCommands()
			this.emit('disconnected')
			this._state = undefined
		})
	}

	private _onInitComplete(): void {
		this.dataTransferManager.startCommandSending()
		this.emit('connected')
	}

	get status(): AtemConnectionStatus {
		return this._status
	}

	get state(): Readonly<AtemState> | undefined {
		return this._state
	}

	/**
	 * Get the current videomode of the ATEM, if known
	 */
	get videoMode(): Readonly<VideoModeInfo> | undefined {
		if (!this.state) return undefined

		return getVideoModeInfo(this.state.settings.videoMode)
	}

	public async connect(address: string, port?: number): Promise<void> {
		return this.socket.connect(address, port)
	}

	public async disconnect(): Promise<void> {
		return this.socket.disconnect()
	}

	public async destroy(): Promise<void> {
		this.dataTransferManager.stopCommandSending()
		return this.socket.destroy()
	}

	public async sendCommands(commands: ISerializableCommand[]): Promise<void> {
		const trackingIds = await this.socket.sendCommands(commands)

		const promises: Promise<void>[] = []

		for (const trackingId of trackingIds) {
			promises.push(
				new Promise<void>((resolve, reject) => {
					this._sentQueue[trackingId] = {
						resolve,
						reject,
					}
				})
			)
		}

		await Promise.allSettled(promises)
	}

	public async sendCommand(command: ISerializableCommand): Promise<void> {
		return await this.sendCommands([command])
	}

	private _mutateState(commands: IDeserializedCommand[]): void {
		// Is this the start of a new connection?
		if (commands.find((cmd) => cmd instanceof Commands.VersionCommand)) {
			// On start of connection, create a new state object
			this._state = AtemStateUtil.Create()
			this._status = AtemConnectionStatus.CONNECTING
		}

		const allChangedPaths: string[] = []

		const state = this._state
		for (const command of commands) {
			if (command instanceof TimeCommand) {
				this.emit('updatedTime', command.properties)
			} else if (command instanceof Commands.FairlightMixerMasterLevelsUpdateCommand) {
				this.emit('levelChanged', {
					system: 'fairlight',
					type: 'master',
					levels: command.properties,
				})
			} else if (command instanceof Commands.FairlightMixerSourceLevelsUpdateCommand) {
				this.emit('levelChanged', {
					system: 'fairlight',
					type: 'source',
					source: command.source,
					index: command.index,
					levels: command.properties,
				})
			} else if (state) {
				try {
					const changePaths = command.applyToState(state)
					if (!Array.isArray(changePaths)) {
						allChangedPaths.push(changePaths)
					} else {
						allChangedPaths.push(...changePaths)
					}
				} catch (e) {
					if (e instanceof InvalidIdError) {
						this.emit(
							'debug',
							`Invalid command id: ${e}. Command: ${command.constructor.name} ${Util.commandStringify(
								command
							)}`
						)
					} else {
						this.emit(
							'error',
							`MutateState failed: ${e}. Command: ${command.constructor.name} ${Util.commandStringify(
								command
							)}`
						)
					}
				}
			}

			for (const commandName in DataTransferCommands) {
				// TODO - this is fragile
				if (command.constructor.name === commandName) {
					this.dataTransferManager.queueHandleCommand(command)
				}
			}
		}

		const initComplete = commands.find((cmd) => cmd instanceof Commands.InitCompleteCommand)
		if (initComplete) {
			this._status = AtemConnectionStatus.CONNECTED
			this._onInitComplete()
		} else if (state && this._status === AtemConnectionStatus.CONNECTED && allChangedPaths.length > 0) {
			this.emit('stateChanged', state, allChangedPaths)
		}
	}

	private _resolveCommands(trackingIds: number[]): void {
		trackingIds.forEach((trackingId) => {
			const sent = this._sentQueue[trackingId]
			if (sent) {
				sent.resolve()
				delete this._sentQueue[trackingId]
			}
		})
	}

	private _rejectAllCommands(): void {
		// Take a copy in case the promises cause more mutations
		const sentQueue = this._sentQueue
		this._sentQueue = {}

		Object.values<SentPackets>(sentQueue).forEach((sent) => sent.reject())
	}
}

export class Atem extends BasicAtem {
	#multiviewerFontFace: Promise<FontFace>
	#multiviewerFontScale: number

	constructor(options?: AtemOptions) {
		super(options)

		this.#multiviewerFontFace = PLazy.from(async () => loadFont())
		this.#multiviewerFontScale = 1.0
	}

	/**
	 * Set the font to use for the multiviewer, or reset to default
	 */
	public async setMultiviewerFontFace(font: FontFace | string | null): Promise<void> {
		let loadedFont: FontFace
		if (font) {
			if (typeof font === 'string') {
				loadedFont = await loadFont(font)
			} else {
				loadedFont = font
			}
		} else {
			loadedFont = await loadFont()
		}

		this.#multiviewerFontFace = Promise.resolve(loadedFont)
	}
	/**
	 * Set the scale factor for the multiviewer text. Default is 1
	 */
	public setMultiviewerFontScale(scale: number | null): void {
		if (typeof scale === 'number') {
			if (scale <= 0) throw new Error('Scale must be greater than 0')
			this.#multiviewerFontScale = scale
		} else if (scale === null) {
			this.#multiviewerFontScale = 1.0
		}
	}

	public async changeProgramInput(input: number, me = 0): Promise<void> {
		const command = new Commands.ProgramInputCommand(me, input)
		return this.sendCommand(command)
	}

	public async changePreviewInput(input: number, me = 0): Promise<void> {
		const command = new Commands.PreviewInputCommand(me, input)
		return this.sendCommand(command)
	}

	public async cut(me = 0): Promise<void> {
		const command = new Commands.CutCommand(me)
		return this.sendCommand(command)
	}

	public async autoTransition(me = 0): Promise<void> {
		const command = new Commands.AutoTransitionCommand(me)
		return this.sendCommand(command)
	}

	public async fadeToBlack(me = 0): Promise<void> {
		const command = new Commands.FadeToBlackAutoCommand(me)
		return this.sendCommand(command)
	}

	public async setFadeToBlackRate(rate: number, me = 0): Promise<void> {
		const command = new Commands.FadeToBlackRateCommand(me, rate)
		return this.sendCommand(command)
	}

	public async autoDownstreamKey(key = 0, isTowardsOnAir?: boolean): Promise<void> {
		const command = new Commands.DownstreamKeyAutoCommand(key)
		command.updateProps({ isTowardsOnAir })
		return this.sendCommand(command)
	}

	public async setDipTransitionSettings(newProps: Partial<DipTransitionSettings>, me = 0): Promise<void> {
		const command = new Commands.TransitionDipCommand(me)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setDVETransitionSettings(newProps: Partial<DVETransitionSettings>, me = 0): Promise<void> {
		const command = new Commands.TransitionDVECommand(me)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setMixTransitionSettings(newProps: Pick<MixTransitionSettings, 'rate'>, me = 0): Promise<void> {
		const command = new Commands.TransitionMixCommand(me, newProps.rate)
		return this.sendCommand(command)
	}

	public async setTransitionPosition(position: number, me = 0): Promise<void> {
		const command = new Commands.TransitionPositionCommand(me, position)
		return this.sendCommand(command)
	}

	public async previewTransition(on: boolean, me = 0): Promise<void> {
		const command = new Commands.PreviewTransitionCommand(me, on)
		return this.sendCommand(command)
	}

	public async setTransitionStyle(newProps: Partial<OmitReadonly<TransitionProperties>>, me = 0): Promise<void> {
		const command = new Commands.TransitionPropertiesCommand(me)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setStingerTransitionSettings(newProps: Partial<StingerTransitionSettings>, me = 0): Promise<void> {
		const command = new Commands.TransitionStingerCommand(me)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setWipeTransitionSettings(newProps: Partial<WipeTransitionSettings>, me = 0): Promise<void> {
		const command = new Commands.TransitionWipeCommand(me)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setAuxSource(source: number, bus = 0): Promise<void> {
		const command = new Commands.AuxSourceCommand(bus, source)
		return this.sendCommand(command)
	}

	public async setDownstreamKeyTie(tie: boolean, key = 0): Promise<void> {
		const command = new Commands.DownstreamKeyTieCommand(key, tie)
		return this.sendCommand(command)
	}

	public async setDownstreamKeyOnAir(onAir: boolean, key = 0): Promise<void> {
		const command = new Commands.DownstreamKeyOnAirCommand(key, onAir)
		return this.sendCommand(command)
	}

	public async setDownstreamKeyCutSource(input: number, key = 0): Promise<void> {
		const command = new Commands.DownstreamKeyCutSourceCommand(key, input)
		return this.sendCommand(command)
	}

	public async setDownstreamKeyFillSource(input: number, key = 0): Promise<void> {
		const command = new Commands.DownstreamKeyFillSourceCommand(key, input)
		return this.sendCommand(command)
	}

	public async setDownstreamKeyGeneralProperties(props: Partial<DownstreamKeyerGeneral>, key = 0): Promise<void> {
		const command = new Commands.DownstreamKeyGeneralCommand(key)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setDownstreamKeyMaskSettings(props: Partial<DownstreamKeyerMask>, key = 0): Promise<void> {
		const command = new Commands.DownstreamKeyMaskCommand(key)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setDownstreamKeyRate(rate: number, key = 0): Promise<void> {
		const command = new Commands.DownstreamKeyRateCommand(key, rate)
		return this.sendCommand(command)
	}

	public async setTime(hour: number, minute: number, second: number, frame: number): Promise<void> {
		const command = new Commands.TimeCommand({ hour, minute, second, frame })
		return this.sendCommand(command)
	}

	public async setTimeMode(mode: Enums.TimeMode): Promise<void> {
		const command = new Commands.TimeConfigCommand(mode)
		return this.sendCommand(command)
	}

	public async requestTime(): Promise<void> {
		const command = new Commands.TimeRequestCommand()
		return this.sendCommand(command)
	}

	public async macroContinue(): Promise<void> {
		const command = new Commands.MacroActionCommand(0, Enums.MacroAction.Continue)
		return this.sendCommand(command)
	}

	public async macroDelete(index = 0): Promise<void> {
		const command = new Commands.MacroActionCommand(index, Enums.MacroAction.Delete)
		return this.sendCommand(command)
	}

	public async macroInsertUserWait(): Promise<void> {
		const command = new Commands.MacroActionCommand(0, Enums.MacroAction.InsertUserWait)
		return this.sendCommand(command)
	}

	public async macroInsertTimedWait(frames: number): Promise<void> {
		const command = new Commands.MacroAddTimedPauseCommand(frames)
		return this.sendCommand(command)
	}

	public async macroRun(index = 0): Promise<void> {
		const command = new Commands.MacroActionCommand(index, Enums.MacroAction.Run)
		return this.sendCommand(command)
	}

	public async macroStop(): Promise<void> {
		const command = new Commands.MacroActionCommand(0, Enums.MacroAction.Stop)
		return this.sendCommand(command)
	}

	public async macroStartRecord(index: number, name: string, description: string): Promise<void> {
		const command = new Commands.MacroRecordCommand(index, name, description)
		return this.sendCommand(command)
	}

	public async macroStopRecord(): Promise<void> {
		const command = new Commands.MacroActionCommand(0, Enums.MacroAction.StopRecord)
		return this.sendCommand(command)
	}

	public async macroUpdateProperties(props: Commands.MacroPropertiesCommand['properties'], index = 0): Promise<void> {
		const command = new Commands.MacroPropertiesCommand(index)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async macroSetLoop(loop: boolean): Promise<void> {
		const command = new Commands.MacroRunStatusCommand()
		command.updateProps({ loop })
		return this.sendCommand(command)
	}

	public async downloadMacro(index: number): Promise<Buffer> {
		return this.dataTransferManager.downloadMacro(index)
	}
	public async uploadMacro(index: number, name: string, data: Buffer): Promise<void> {
		return this.dataTransferManager.uploadMacro(index, data, name)
	}

	public async setMultiViewerWindowSource(source: number, mv = 0, window = 0): Promise<void> {
		const command = new Commands.MultiViewerSourceCommand(mv, window, source)
		return this.sendCommand(command)
	}
	public async setMultiViewerWindowSafeAreaEnabled(safeAreaEnabled: boolean, mv = 0, window = 0): Promise<void> {
		const command = new Commands.MultiViewerWindowSafeAreaCommand(mv, window, safeAreaEnabled)
		return this.sendCommand(command)
	}
	public async setMultiViewerWindowVuEnabled(vuEnabled: boolean, mv = 0, window = 0): Promise<void> {
		const command = new Commands.MultiViewerWindowVuMeterCommand(mv, window, vuEnabled)
		return this.sendCommand(command)
	}

	public async setMultiViewerVuOpacity(opacity: number, mv = 0): Promise<void> {
		const command = new Commands.MultiViewerVuOpacityCommand(mv, opacity)
		return this.sendCommand(command)
	}
	public async setMultiViewerProperties(props: Partial<MultiViewerPropertiesState>, mv = 0): Promise<void> {
		const command = new Commands.MultiViewerPropertiesCommand(mv)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setColorGeneratorColour(newProps: Partial<ColorGeneratorState>, index = 0): Promise<void> {
		const command = new Commands.ColorGeneratorCommand(index)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setMediaPlayerSettings(newProps: Partial<MediaPlayer>, player = 0): Promise<void> {
		const command = new Commands.MediaPlayerStatusCommand(player)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setMediaPlayerSource(newProps: Partial<MediaPlayerSource>, player = 0): Promise<void> {
		const command = new Commands.MediaPlayerSourceCommand(player)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setMediaClip(index: number, name: string, frames = 1): Promise<void> {
		const command = new Commands.MediaPoolSetClipCommand({ index, name, frames })
		return this.sendCommand(command)
	}

	public async clearMediaPoolClip(clipId: number): Promise<void> {
		const command = new Commands.MediaPoolClearClipCommand(clipId)
		return this.sendCommand(command)
	}

	public async clearMediaPoolStill(stillId: number): Promise<void> {
		const command = new Commands.MediaPoolClearStillCommand(stillId)
		return this.sendCommand(command)
	}

	public async captureMediaPoolStill(): Promise<void> {
		const command = new Commands.MediaPoolCaptureStillCommand()
		return this.sendCommand(command)
	}

	public async setSuperSourceBoxSettings(
		newProps: Partial<SuperSource.SuperSourceBox>,
		box = 0,
		ssrcId = 0
	): Promise<void> {
		const command = new Commands.SuperSourceBoxParametersCommand(ssrcId, box)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setSuperSourceProperties(
		newProps: Partial<SuperSource.SuperSourceProperties>,
		ssrcId = 0
	): Promise<void> {
		if (this.state && this.state.info.apiVersion >= Enums.ProtocolVersion.V8_0) {
			const command = new Commands.SuperSourcePropertiesV8Command(ssrcId)
			command.updateProps(newProps)
			return this.sendCommand(command)
		} else {
			const command = new Commands.SuperSourcePropertiesCommand()
			command.updateProps(newProps)
			return this.sendCommand(command)
		}
	}

	public async setSuperSourceBorder(newProps: Partial<SuperSource.SuperSourceBorder>, ssrcId = 0): Promise<void> {
		if (this.state && this.state.info.apiVersion >= Enums.ProtocolVersion.V8_0) {
			const command = new Commands.SuperSourceBorderCommand(ssrcId)
			command.updateProps(newProps)
			return this.sendCommand(command)
		} else {
			const command = new Commands.SuperSourcePropertiesCommand()
			command.updateProps(newProps)
			return this.sendCommand(command)
		}
	}

	public async setInputSettings(newProps: Partial<OmitReadonly<InputChannel>>, input = 0): Promise<void> {
		const command = new Commands.InputPropertiesCommand(input)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setUpstreamKeyerChromaSettings(
		newProps: Partial<USK.UpstreamKeyerChromaSettings>,
		me = 0,
		keyer = 0
	): Promise<void> {
		const command = new Commands.MixEffectKeyChromaCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setUpstreamKeyerAdvancedChromaProperties(
		newProps: Partial<USK.UpstreamKeyerAdvancedChromaProperties>,
		me = 0,
		keyer = 0
	): Promise<void> {
		const command = new Commands.MixEffectKeyAdvancedChromaPropertiesCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}
	public async setUpstreamKeyerAdvancedChromaSample(
		newProps: Partial<USK.UpstreamKeyerAdvancedChromaSample>,
		me = 0,
		keyer = 0
	): Promise<void> {
		const command = new Commands.MixEffectKeyAdvancedChromaSampleCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}
	public async setUpstreamKeyerAdvancedChromaSampleReset(
		flags: Commands.AdvancedChromaSampleResetProps,
		me = 0,
		keyer = 0
	): Promise<void> {
		const command = new Commands.MixEffectKeyAdvancedChromaSampleResetCommand(me, keyer, flags)
		return this.sendCommand(command)
	}

	public async setUpstreamKeyerCutSource(cutSource: number, me = 0, keyer = 0): Promise<void> {
		const command = new Commands.MixEffectKeyCutSourceSetCommand(me, keyer, cutSource)
		return this.sendCommand(command)
	}

	public async setUpstreamKeyerFillSource(fillSource: number, me = 0, keyer = 0): Promise<void> {
		const command = new Commands.MixEffectKeyFillSourceSetCommand(me, keyer, fillSource)
		return this.sendCommand(command)
	}

	public async setUpstreamKeyerDVESettings(
		newProps: Partial<USK.UpstreamKeyerDVESettings>,
		me = 0,
		keyer = 0
	): Promise<void> {
		const command = new Commands.MixEffectKeyDVECommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setUpstreamKeyerLumaSettings(
		newProps: Partial<USK.UpstreamKeyerLumaSettings>,
		me = 0,
		keyer = 0
	): Promise<void> {
		const command = new Commands.MixEffectKeyLumaCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setUpstreamKeyerMaskSettings(
		newProps: Partial<USK.UpstreamKeyerMaskSettings>,
		me = 0,
		keyer = 0
	): Promise<void> {
		const command = new Commands.MixEffectKeyMaskSetCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setUpstreamKeyerPatternSettings(
		newProps: Partial<USK.UpstreamKeyerPatternSettings>,
		me = 0,
		keyer = 0
	): Promise<void> {
		const command = new Commands.MixEffectKeyPatternCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public async setUpstreamKeyerOnAir(onAir: boolean, me = 0, keyer = 0): Promise<void> {
		const command = new Commands.MixEffectKeyOnAirCommand(me, keyer, onAir)
		return this.sendCommand(command)
	}

	public async runUpstreamKeyerFlyKeyTo(
		mixEffect: number,
		upstreamKeyerId: number,
		keyFrameId: Enums.FlyKeyKeyFrame.A | Enums.FlyKeyKeyFrame.B | Enums.FlyKeyKeyFrame.Full
	): Promise<void> {
		const command = new Commands.MixEffectKeyRunToCommand(mixEffect, upstreamKeyerId, keyFrameId, 0)
		return this.sendCommand(command)
	}
	public async runUpstreamKeyerFlyKeyToInfinite(
		mixEffect: number,
		upstreamKeyerId: number,
		direction: Enums.FlyKeyDirection
	): Promise<void> {
		const command = new Commands.MixEffectKeyRunToCommand(
			mixEffect,
			upstreamKeyerId,
			Enums.FlyKeyKeyFrame.RunToInfinite,
			direction
		)
		return this.sendCommand(command)
	}
	public async storeUpstreamKeyerFlyKeyKeyframe(
		mixEffect: number,
		upstreamKeyerId: number,
		keyframe: number
	): Promise<void> {
		const command = new Commands.MixEffectKeyFlyKeyframeStoreCommand(mixEffect, upstreamKeyerId, keyframe)
		return this.sendCommand(command)
	}
	public async setUpstreamKeyerFlyKeyKeyframe(
		mixEffect: number,
		upstreamKeyerId: number,
		keyframe: number,
		properties: Partial<Omit<USK.UpstreamKeyerFlyKeyframe, 'keyFrameId'>>
	): Promise<void> {
		const command = new Commands.MixEffectKeyFlyKeyframeCommand(mixEffect, upstreamKeyerId, keyframe)
		command.updateProps(properties)
		return this.sendCommand(command)
	}

	public async setUpstreamKeyerType(
		newProps: Partial<USK.UpstreamKeyerTypeSettings>,
		me = 0,
		keyer = 0
	): Promise<void> {
		const command = new Commands.MixEffectKeyTypeSetCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	/**
	 * Download a still image from the ATEM media pool
	 *
	 * Note: This performs colour conversions in JS, which is not very CPU efficient. If performance is important,
	 * consider using [@atem-connection/image-tools](https://www.npmjs.com/package/@atem-connection/image-tools) to
	 * pre-convert the images with more optimal algorithms
	 * @param index Still index to download
	 * @param format The pixel format to return for the downloaded image. 'raw' passes through unchanged, and will be RLE encoded.
	 * @returns Promise which returns the image once downloaded. If the still slot is not in use, this will throw
	 */
	public async downloadStill(index: number, format: 'raw' | 'rgba' | 'yuv' = 'rgba'): Promise<Buffer> {
		let rawBuffer = await this.dataTransferManager.downloadStill(index)

		if (format === 'raw') {
			return rawBuffer
		}

		if (!this.state) throw new Error('Unable to check current resolution')
		const resolution = getVideoModeInfo(this.state.settings.videoMode)
		if (!resolution) throw new Error('Failed to determine required resolution')

		rawBuffer = decodeRLE(rawBuffer, resolution.width * resolution.height * 4)

		switch (format) {
			case 'yuv':
				return rawBuffer
			case 'rgba':
			default:
				return convertYUV422ToRGBA(resolution.width, resolution.height, rawBuffer)
		}
	}

	/**
	 * Upload a still image to the ATEM media pool
	 *
	 * Note: This performs colour conversions in JS, which is not very CPU efficient. If performance is important,
	 * consider using [@atem-connection/image-tools](https://www.npmjs.com/package/@atem-connection/image-tools) to
	 * pre-convert the images with more optimal algorithms
	 * @param index Still index to upload to
	 * @param data a RGBA pixel buffer, or an already YUVA encoded image
	 * @param name Name to give the uploaded image
	 * @param description Description for the uploaded image
	 * @param options Upload options
	 * @returns Promise which resolves once the image is uploaded
	 */
	public async uploadStill(
		index: number,
		data: Buffer | UploadBufferInfo,
		name: string,
		description: string,
		options?: DT.UploadStillEncodingOptions
	): Promise<void> {
		if (!this.state) throw new Error('Unable to check current resolution')
		const resolution = getVideoModeInfo(this.state.settings.videoMode)
		if (!resolution) throw new Error('Failed to determine required resolution')

		const encodedData = generateUploadBufferInfo(data, resolution, !options?.disableRLE)

		return this.dataTransferManager.uploadStill(index, encodedData, name, description)
	}

	/**
	 * Upload a clip to the ATEM media pool
	 *
	 * Note: This performs colour conversions in JS, which is not very CPU efficient. If performance is important,
	 * consider using [@atem-connection/image-tools](https://www.npmjs.com/package/@atem-connection/image-tools) to
	 * pre-convert the images with more optimal algorithms
	 * @param index Clip index to upload to
	 * @param frames Array or generator of frames. Each frame can be a RGBA pixel buffer, or an already YUVA encoded image
	 * @param name Name to give the uploaded clip
	 * @param options Upload options
	 * @returns Promise which resolves once the clip is uploaded
	 */
	public async uploadClip(
		index: number,
		frames: Iterable<Buffer> | AsyncIterable<Buffer> | Iterable<UploadBufferInfo> | AsyncIterable<UploadBufferInfo>,
		name: string,
		options?: DT.UploadStillEncodingOptions
	): Promise<void> {
		if (!this.state) throw new Error('Unable to check current resolution')
		const resolution = getVideoModeInfo(this.state.settings.videoMode)
		if (!resolution) throw new Error('Failed to determine required resolution')

		const provideFrame = async function* (): AsyncGenerator<UploadBufferInfo> {
			for await (const frame of frames) {
				yield generateUploadBufferInfo(frame, resolution, !options?.disableRLE)
			}
		}
		return this.dataTransferManager.uploadClip(index, provideFrame(), name)
	}

	/**
	 * Upload clip audio to the ATEM media pool
	 * @param index Clip index to upload to
	 * @param data stereo 48khz 24bit WAV audio data
	 * @param name Name to give the uploaded audio
	 * @returns Promise which resolves once the clip audio is uploaded
	 */
	public async uploadAudio(index: number, data: Buffer, name: string): Promise<void> {
		return this.dataTransferManager.uploadAudio(index, convertWAVToRaw(data, this.state?.info?.model), name)
	}

	public async setClassicAudioMixerInputProps(
		index: number,
		props: Partial<OmitReadonly<ClassicAudioChannel>>
	): Promise<void> {
		const command = new Commands.AudioMixerInputCommand(index)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setClassicAudioMixerMasterProps(props: Partial<ClassicAudioMasterChannel>): Promise<void> {
		const command = new Commands.AudioMixerMasterCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setClassicAudioMixerMonitorProps(props: Partial<ClassicAudioMonitorChannel>): Promise<void> {
		const command = new Commands.AudioMixerMonitorCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setClassicAudioMixerHeadphonesProps(
		props: Partial<ClassicAudioHeadphoneOutputChannel>
	): Promise<void> {
		const command = new Commands.AudioMixerHeadphonesCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setClassicAudioResetPeaks(props: Partial<Commands.ClassicAudioResetPeaks>): Promise<void> {
		const command = new Commands.AudioMixerResetPeaksCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setClassicAudioMixerProps(props: Commands.AudioMixerPropertiesCommand['properties']): Promise<void> {
		const command = new Commands.AudioMixerPropertiesCommand(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerMasterProps(
		props: Partial<Commands.FairlightMixerMasterCommandProperties>
	): Promise<void> {
		const command = new Commands.FairlightMixerMasterCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerMasterCompressorProps(
		props: Partial<OmitReadonly<FairlightAudioCompressorState>>
	): Promise<void> {
		const command = new Commands.FairlightMixerMasterCompressorCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerMasterLimiterProps(
		props: Partial<OmitReadonly<FairlightAudioLimiterState>>
	): Promise<void> {
		const command = new Commands.FairlightMixerMasterLimiterCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerMasterEqualizerBandProps(
		band: number,
		props: Partial<OmitReadonly<FairlightAudioEqualizerBandState>>
	): Promise<void> {
		const command = new Commands.FairlightMixerMasterEqualizerBandCommand(band)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerMasterEqualizerReset(
		props: Partial<Commands.FairlightMixerMasterEqualizerResetCommand['properties']>
	): Promise<void> {
		const command = new Commands.FairlightMixerMasterEqualizerResetCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerMasterDynamicsReset(props: Partial<FairlightDynamicsResetProps>): Promise<void> {
		const command = new Commands.FairlightMixerMasterDynamicsResetCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerResetPeaks(
		props: Commands.FairlightMixerResetPeakLevelsCommand['properties']
	): Promise<void> {
		const command = new Commands.FairlightMixerResetPeakLevelsCommand(props)
		return this.sendCommand(command)
	}

	public async startFairlightMixerSendLevels(): Promise<void> {
		const command = new Commands.FairlightMixerSendLevelsCommand(true)
		return this.sendCommand(command)
	}

	public async stopFairlightMixerSendLevels(): Promise<void> {
		const command = new Commands.FairlightMixerSendLevelsCommand(false)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerMonitorProps(
		props: Partial<OmitReadonly<FairlightAudioMonitorChannel>>
	): Promise<void> {
		const command = new Commands.FairlightMixerMonitorCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerMonitorSolo(
		props: Partial<OmitReadonly<FairlightAudioMonitorSolo>>
	): Promise<void> {
		const command = new Commands.FairlightMixerMonitorSoloCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerInputProps(
		index: number,
		props: Commands.FairlightMixerInputCommand['properties']
	): Promise<void> {
		if (this.state && this.state.info.apiVersion >= Enums.ProtocolVersion.V8_0) {
			const command = new Commands.FairlightMixerInputV8Command(index)
			command.updateProps(props)
			return this.sendCommand(command)
		} else {
			const command = new Commands.FairlightMixerInputCommand(index)
			command.updateProps(props)
			return this.sendCommand(command)
		}
	}

	public async setFairlightAudioMixerSourceProps(
		index: number,
		source: string,
		props: Commands.FairlightMixerSourceCommand['properties']
	): Promise<void> {
		const command = new Commands.FairlightMixerSourceCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerSourceCompressorProps(
		index: number,
		source: string,
		props: Partial<OmitReadonly<FairlightAudioCompressorState>>
	): Promise<void> {
		const command = new Commands.FairlightMixerSourceCompressorCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerSourceLimiterProps(
		index: number,
		source: string,
		props: Partial<OmitReadonly<FairlightAudioLimiterState>>
	): Promise<void> {
		const command = new Commands.FairlightMixerSourceLimiterCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerSourceExpanderProps(
		index: number,
		source: string,
		props: Partial<OmitReadonly<FairlightAudioExpanderState>>
	): Promise<void> {
		const command = new Commands.FairlightMixerSourceExpanderCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerSourceEqualizerBandProps(
		index: number,
		source: string,
		band: number,
		props: Partial<OmitReadonly<FairlightAudioEqualizerBandState>>
	): Promise<void> {
		const command = new Commands.FairlightMixerSourceEqualizerBandCommand(index, BigInt(source), band)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerSourceDynamicsReset(
		index: number,
		source: string,
		props: Partial<FairlightDynamicsResetProps>
	): Promise<void> {
		const command = new Commands.FairlightMixerSourceDynamicsResetCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerSourceEqualizerReset(
		index: number,
		source: string,
		props: Partial<Commands.FairlightMixerSourceEqualizerResetCommand['properties']>
	): Promise<void> {
		const command = new Commands.FairlightMixerSourceEqualizerResetCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioMixerSourceResetPeaks(
		index: number,
		source: string,
		props: Commands.FairlightMixerSourceResetPeakLevelsCommand['properties']
	): Promise<void> {
		const command = new Commands.FairlightMixerSourceResetPeakLevelsCommand(index, BigInt(source), props)
		return this.sendCommand(command)
	}

	public async startStreaming(): Promise<void> {
		const command = new Commands.StreamingStatusCommand(true)
		return this.sendCommand(command)
	}

	public async stopStreaming(): Promise<void> {
		const command = new Commands.StreamingStatusCommand(false)
		return this.sendCommand(command)
	}

	public async requestStreamingDuration(): Promise<void> {
		const command = new Commands.StreamingRequestDurationCommand()
		return this.sendCommand(command)
	}

	public async setStreamingService(props: Partial<StreamingServiceProperties>): Promise<void> {
		const command = new Commands.StreamingServiceCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setStreamingAudioBitrates(lowBitrate: number, highBitrate: number): Promise<void> {
		const command = new Commands.StreamingAudioBitratesCommand(lowBitrate, highBitrate)
		return this.sendCommand(command)
	}

	public async startRecording(): Promise<void> {
		const command = new Commands.RecordingStatusCommand(true)
		return this.sendCommand(command)
	}

	public async stopRecording(): Promise<void> {
		const command = new Commands.RecordingStatusCommand(false)
		return this.sendCommand(command)
	}

	public async requestRecordingDuration(): Promise<void> {
		const command = new Commands.RecordingRequestDurationCommand()
		return this.sendCommand(command)
	}

	public async switchRecordingDisk(): Promise<void> {
		const command = new Commands.RecordingRequestSwitchDiskCommand()
		return this.sendCommand(command)
	}

	public async setRecordingSettings(props: Partial<RecordingStateProperties>): Promise<void> {
		const command = new Commands.RecordingSettingsCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setEnableISORecording(enabled: boolean): Promise<void> {
		const command = new Commands.RecordingISOCommand(enabled)
		return this.sendCommand(command)
	}

	public async saveStartupState(): Promise<void> {
		const command = new Commands.StartupStateSaveCommand()
		return this.sendCommand(command)
	}
	public async clearStartupState(): Promise<void> {
		const command = new Commands.StartupStateClearCommand()
		return this.sendCommand(command)
	}

	public listVisibleInputs(mode: 'program' | 'preview', me = 0): number[] {
		if (this.state) {
			return listVisibleInputs(mode, this.state, me)
		} else {
			return []
		}
	}

	public async setMediaPoolSettings(props: Commands.MediaPoolProps): Promise<void> {
		const command = new Commands.MediaPoolSettingsSetCommand(props.maxFrames)
		return this.sendCommand(command)
	}

	public async requestDisplayClockTime(): Promise<void> {
		const command = new Commands.DisplayClockRequestTimeCommand()
		return this.sendCommand(command)
	}

	public async setDisplayClockState(state: Enums.DisplayClockClockState): Promise<void> {
		const command = new Commands.DisplayClockStateSetCommand(state)
		return this.sendCommand(command)
	}

	public async setDisplayClockProperties(props: Partial<Commands.DisplayClockPropertiesExt>): Promise<void> {
		const command = new Commands.DisplayClockPropertiesSetCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioRoutingSourceProperties(
		sourceId: number,
		props: Partial<OmitReadonly<FairlightAudioRoutingSource>>
	): Promise<void> {
		const command = new Commands.AudioRoutingSourceCommand(sourceId)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public async setFairlightAudioRoutingOutputProperties(
		sourceId: number,
		props: Partial<OmitReadonly<FairlightAudioRoutingOutput>>
	): Promise<void> {
		const command = new Commands.AudioRoutingOutputCommand(sourceId)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public hasInternalMultiviewerLabelGeneration(): boolean {
		return !!this.state && hasInternalMultiviewerLabelGeneration(this.state?.info.model)
	}

	/**
	 * Write a custom multiviewer label buffer
	 * @param inputId The input id
	 * @param buffer Label buffer
	 * @returns Promise that resolves once upload is complete
	 */
	public async writeMultiviewerLabel(inputId: number, buffer: Buffer): Promise<void> {
		if (this.hasInternalMultiviewerLabelGeneration()) throw new Error(`ATEM doesn't support custom labels`)

		// Verify the buffer doesnt contain data that is 'out of bounds' and will crash the atem
		const badValues = new Set([255, 254])
		for (const val of buffer) {
			if (badValues.has(val)) {
				throw new Error(`Buffer contains invalid value ${val}`)
			}
		}

		return this.dataTransferManager.uploadMultiViewerLabel(inputId, buffer)
	}

	/**
	 * Generate and upload a multiviewer label
	 * @param inputId The input id
	 * @param text Label text
	 * @returns Promise that resolves once upload is complete
	 */
	public async drawMultiviewerLabel(inputId: number, text: string): Promise<void> {
		if (this.hasInternalMultiviewerLabelGeneration()) throw new Error(`ATEM doesn't support custom labels`)

		const props = calculateGenerateMultiviewerLabelProps(this.state ?? null)
		if (!props) throw new Error(`Failed to determine render properties`)

		const fontFace = await this.#multiviewerFontFace

		const buffer = generateMultiviewerLabel(fontFace, this.#multiviewerFontScale, text, props)
		// Note: we should probably validate the buffer looks like it doesn't contain crashy data, but as we generate we can trust it
		return this.dataTransferManager.uploadMultiViewerLabel(inputId, buffer)
	}
}
