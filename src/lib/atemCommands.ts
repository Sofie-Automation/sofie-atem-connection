import type {
	ClassicAudioChannel,
	ClassicAudioMasterChannel,
	ClassicAudioMonitorChannel,
	ClassicAudioHeadphoneOutputChannel,
} from '../state/audio'
import type {
	FairlightAudioCompressorState,
	FairlightAudioLimiterState,
	FairlightAudioEqualizerBandState,
	FairlightAudioMonitorChannel,
	FairlightAudioMonitorSolo,
	FairlightAudioExpanderState,
	FairlightAudioRoutingSource,
	FairlightAudioRoutingOutput,
} from '../state/fairlight'
import type { InputChannel } from '../state/input'
import type { MediaPlayer, MediaPlayerSource } from '../state/media'
import type { RecordingStateProperties } from '../state/recording'
import type { MultiViewerPropertiesState } from '../state/settings'
import type { StreamingServiceProperties } from '../state/streaming'
import type { ColorGeneratorState } from '../state/color'
import type {
	DipTransitionSettings,
	DVETransitionSettings,
	MixTransitionSettings,
	TransitionProperties,
	StingerTransitionSettings,
	WipeTransitionSettings,
	SuperSource,
	USK,
} from '../state/video'
import type { DownstreamKeyerGeneral, DownstreamKeyerMask } from '../state/video/downstreamKeyers'
import type { ISerializableCommand } from '../commands'
import * as Enums from '../enums'
import * as Commands from '../commands'
import type { OmitReadonly } from './types'
import type { FairlightDynamicsResetProps } from '../commands/Fairlight/common'

/**
 * Base class for sending commands to the ATEM switcher.
 * Any sending of comamnds should be done through this class, allowing it to be used in both a direct or batched manner.
 */
export abstract class AtemCommandSender<T> {
	protected abstract sendCommand(command: ISerializableCommand): T

	protected abstract readonly apiVersion: Enums.ProtocolVersion | undefined

	public changeProgramInput(input: number, me = 0): T {
		const command = new Commands.ProgramInputCommand(me, input)
		return this.sendCommand(command)
	}

	public changePreviewInput(input: number, me = 0): T {
		const command = new Commands.PreviewInputCommand(me, input)
		return this.sendCommand(command)
	}

	public cut(me = 0): T {
		const command = new Commands.CutCommand(me)
		return this.sendCommand(command)
	}

	public autoTransition(me = 0): T {
		const command = new Commands.AutoTransitionCommand(me)
		return this.sendCommand(command)
	}

	public fadeToBlack(me = 0): T {
		const command = new Commands.FadeToBlackAutoCommand(me)
		return this.sendCommand(command)
	}

	public setFadeToBlackRate(rate: number, me = 0): T {
		const command = new Commands.FadeToBlackRateCommand(me, rate)
		return this.sendCommand(command)
	}

	public autoDownstreamKey(key = 0, isTowardsOnAir?: boolean): T {
		const command = new Commands.DownstreamKeyAutoCommand(key)
		command.updateProps({ isTowardsOnAir })
		return this.sendCommand(command)
	}

	public setDipTransitionSettings(newProps: Partial<DipTransitionSettings>, me = 0): T {
		const command = new Commands.TransitionDipCommand(me)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setDVETransitionSettings(newProps: Partial<DVETransitionSettings>, me = 0): T {
		const command = new Commands.TransitionDVECommand(me)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setMixTransitionSettings(newProps: Pick<MixTransitionSettings, 'rate'>, me = 0): T {
		const command = new Commands.TransitionMixCommand(me, newProps.rate)
		return this.sendCommand(command)
	}

	public setTransitionPosition(position: number, me = 0): T {
		const command = new Commands.TransitionPositionCommand(me, position)
		return this.sendCommand(command)
	}

	public previewTransition(on: boolean, me = 0): T {
		const command = new Commands.PreviewTransitionCommand(me, on)
		return this.sendCommand(command)
	}

	public setTransitionStyle(newProps: Partial<OmitReadonly<TransitionProperties>>, me = 0): T {
		const command = new Commands.TransitionPropertiesCommand(me)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setStingerTransitionSettings(newProps: Partial<StingerTransitionSettings>, me = 0): T {
		const command = new Commands.TransitionStingerCommand(me)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setWipeTransitionSettings(newProps: Partial<WipeTransitionSettings>, me = 0): T {
		const command = new Commands.TransitionWipeCommand(me)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setAuxSource(source: number, bus = 0): T {
		const command = new Commands.AuxSourceCommand(bus, source)
		return this.sendCommand(command)
	}

	public setDownstreamKeyTie(tie: boolean, key = 0): T {
		const command = new Commands.DownstreamKeyTieCommand(key, tie)
		return this.sendCommand(command)
	}

	public setDownstreamKeyOnAir(onAir: boolean, key = 0): T {
		const command = new Commands.DownstreamKeyOnAirCommand(key, onAir)
		return this.sendCommand(command)
	}

	public setDownstreamKeyCutSource(input: number, key = 0): T {
		const command = new Commands.DownstreamKeyCutSourceCommand(key, input)
		return this.sendCommand(command)
	}

	public setDownstreamKeyFillSource(input: number, key = 0): T {
		const command = new Commands.DownstreamKeyFillSourceCommand(key, input)
		return this.sendCommand(command)
	}

	public setDownstreamKeyGeneralProperties(props: Partial<DownstreamKeyerGeneral>, key = 0): T {
		const command = new Commands.DownstreamKeyGeneralCommand(key)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setDownstreamKeyMaskSettings(props: Partial<DownstreamKeyerMask>, key = 0): T {
		const command = new Commands.DownstreamKeyMaskCommand(key)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setDownstreamKeyRate(rate: number, key = 0): T {
		const command = new Commands.DownstreamKeyRateCommand(key, rate)
		return this.sendCommand(command)
	}

	public setTime(hour: number, minute: number, second: number, frame: number): T {
		const command = new Commands.TimeCommand({ hour, minute, second, frame })
		return this.sendCommand(command)
	}

	public setTimeMode(mode: Enums.TimeMode): T {
		const command = new Commands.TimeConfigCommand(mode)
		return this.sendCommand(command)
	}

	public requestTime(): T {
		const command = new Commands.TimeRequestCommand()
		return this.sendCommand(command)
	}

	public macroContinue(): T {
		const command = new Commands.MacroActionCommand(0, Enums.MacroAction.Continue)
		return this.sendCommand(command)
	}

	public macroDelete(index = 0): T {
		const command = new Commands.MacroActionCommand(index, Enums.MacroAction.Delete)
		return this.sendCommand(command)
	}

	public macroInsertUserWait(): T {
		const command = new Commands.MacroActionCommand(0, Enums.MacroAction.InsertUserWait)
		return this.sendCommand(command)
	}

	public macroInsertTimedWait(frames: number): T {
		const command = new Commands.MacroAddTimedPauseCommand(frames)
		return this.sendCommand(command)
	}

	public macroRun(index = 0): T {
		const command = new Commands.MacroActionCommand(index, Enums.MacroAction.Run)
		return this.sendCommand(command)
	}

	public macroStop(): T {
		const command = new Commands.MacroActionCommand(0, Enums.MacroAction.Stop)
		return this.sendCommand(command)
	}

	public macroStartRecord(index: number, name: string, description: string): T {
		const command = new Commands.MacroRecordCommand(index, name, description)
		return this.sendCommand(command)
	}

	public macroStopRecord(): T {
		const command = new Commands.MacroActionCommand(0, Enums.MacroAction.StopRecord)
		return this.sendCommand(command)
	}

	public macroUpdateProperties(props: Commands.MacroPropertiesCommand['properties'], index = 0): T {
		const command = new Commands.MacroPropertiesCommand(index)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public macroSetLoop(loop: boolean): T {
		const command = new Commands.MacroRunStatusCommand()
		command.updateProps({ loop })
		return this.sendCommand(command)
	}

	public setMultiViewerWindowSource(source: number, mv = 0, window = 0): T {
		const command = new Commands.MultiViewerSourceCommand(mv, window, source)
		return this.sendCommand(command)
	}
	public setMultiViewerWindowSafeAreaEnabled(safeAreaEnabled: boolean, mv = 0, window = 0): T {
		const command = new Commands.MultiViewerWindowSafeAreaCommand(mv, window, safeAreaEnabled)
		return this.sendCommand(command)
	}
	public setMultiViewerWindowVuEnabled(vuEnabled: boolean, mv = 0, window = 0): T {
		const command = new Commands.MultiViewerWindowVuMeterCommand(mv, window, vuEnabled)
		return this.sendCommand(command)
	}

	public setMultiViewerVuOpacity(opacity: number, mv = 0): T {
		const command = new Commands.MultiViewerVuOpacityCommand(mv, opacity)
		return this.sendCommand(command)
	}
	public setMultiViewerProperties(props: Partial<MultiViewerPropertiesState>, mv = 0): T {
		const command = new Commands.MultiViewerPropertiesCommand(mv)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setColorGeneratorColour(newProps: Partial<ColorGeneratorState>, index = 0): T {
		const command = new Commands.ColorGeneratorCommand(index)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setMediaPlayerSettings(newProps: Partial<MediaPlayer>, player = 0): T {
		const command = new Commands.MediaPlayerStatusCommand(player)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setMediaPlayerSource(newProps: Partial<MediaPlayerSource>, player = 0): T {
		const command = new Commands.MediaPlayerSourceCommand(player)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setMediaClip(index: number, name: string, frames = 1): T {
		const command = new Commands.MediaPoolSetClipCommand({ index, name, frames })
		return this.sendCommand(command)
	}

	public clearMediaPoolClip(clipId: number): T {
		const command = new Commands.MediaPoolClearClipCommand(clipId)
		return this.sendCommand(command)
	}

	public clearMediaPoolStill(stillId: number): T {
		const command = new Commands.MediaPoolClearStillCommand(stillId)
		return this.sendCommand(command)
	}

	public captureMediaPoolStill(): T {
		const command = new Commands.MediaPoolCaptureStillCommand()
		return this.sendCommand(command)
	}

	public setSuperSourceBoxSettings(newProps: Partial<SuperSource.SuperSourceBox>, box = 0, ssrcId = 0): T {
		const command = new Commands.SuperSourceBoxParametersCommand(ssrcId, box)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setSuperSourceProperties(newProps: Partial<SuperSource.SuperSourceProperties>, ssrcId = 0): T {
		if (this.apiVersion && this.apiVersion >= Enums.ProtocolVersion.V8_0) {
			const command = new Commands.SuperSourcePropertiesV8Command(ssrcId)
			command.updateProps(newProps)
			return this.sendCommand(command)
		} else {
			const command = new Commands.SuperSourcePropertiesCommand()
			command.updateProps(newProps)
			return this.sendCommand(command)
		}
	}

	public setSuperSourceBorder(newProps: Partial<SuperSource.SuperSourceBorder>, ssrcId = 0): T {
		if (this.apiVersion && this.apiVersion >= Enums.ProtocolVersion.V8_0) {
			const command = new Commands.SuperSourceBorderCommand(ssrcId)
			command.updateProps(newProps)
			return this.sendCommand(command)
		} else {
			const command = new Commands.SuperSourcePropertiesCommand()
			command.updateProps(newProps)
			return this.sendCommand(command)
		}
	}

	public setInputSettings(newProps: Partial<OmitReadonly<InputChannel>>, input = 0): T {
		const command = new Commands.InputPropertiesCommand(input)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setUpstreamKeyerChromaSettings(newProps: Partial<USK.UpstreamKeyerChromaSettings>, me = 0, keyer = 0): T {
		const command = new Commands.MixEffectKeyChromaCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setUpstreamKeyerAdvancedChromaProperties(
		newProps: Partial<USK.UpstreamKeyerAdvancedChromaProperties>,
		me = 0,
		keyer = 0
	): T {
		const command = new Commands.MixEffectKeyAdvancedChromaPropertiesCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}
	public setUpstreamKeyerAdvancedChromaSample(
		newProps: Partial<USK.UpstreamKeyerAdvancedChromaSample>,
		me = 0,
		keyer = 0
	): T {
		const command = new Commands.MixEffectKeyAdvancedChromaSampleCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}
	public setUpstreamKeyerAdvancedChromaSampleReset(
		flags: Commands.AdvancedChromaSampleResetProps,
		me = 0,
		keyer = 0
	): T {
		const command = new Commands.MixEffectKeyAdvancedChromaSampleResetCommand(me, keyer, flags)
		return this.sendCommand(command)
	}

	public setUpstreamKeyerCutSource(cutSource: number, me = 0, keyer = 0): T {
		const command = new Commands.MixEffectKeyCutSourceSetCommand(me, keyer, cutSource)
		return this.sendCommand(command)
	}

	public setUpstreamKeyerFillSource(fillSource: number, me = 0, keyer = 0): T {
		const command = new Commands.MixEffectKeyFillSourceSetCommand(me, keyer, fillSource)
		return this.sendCommand(command)
	}

	public setUpstreamKeyerDVESettings(newProps: Partial<USK.UpstreamKeyerDVESettings>, me = 0, keyer = 0): T {
		const command = new Commands.MixEffectKeyDVECommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setUpstreamKeyerLumaSettings(newProps: Partial<USK.UpstreamKeyerLumaSettings>, me = 0, keyer = 0): T {
		const command = new Commands.MixEffectKeyLumaCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setUpstreamKeyerMaskSettings(newProps: Partial<USK.UpstreamKeyerMaskSettings>, me = 0, keyer = 0): T {
		const command = new Commands.MixEffectKeyMaskSetCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setUpstreamKeyerPatternSettings(newProps: Partial<USK.UpstreamKeyerPatternSettings>, me = 0, keyer = 0): T {
		const command = new Commands.MixEffectKeyPatternCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setUpstreamKeyerOnAir(onAir: boolean, me = 0, keyer = 0): T {
		const command = new Commands.MixEffectKeyOnAirCommand(me, keyer, onAir)
		return this.sendCommand(command)
	}

	public runUpstreamKeyerFlyKeyTo(
		mixEffect: number,
		upstreamKeyerId: number,
		keyFrameId: Enums.FlyKeyKeyFrame.A | Enums.FlyKeyKeyFrame.B | Enums.FlyKeyKeyFrame.Full
	): T {
		const command = new Commands.MixEffectKeyRunToCommand(mixEffect, upstreamKeyerId, keyFrameId, 0)
		return this.sendCommand(command)
	}
	public runUpstreamKeyerFlyKeyToInfinite(
		mixEffect: number,
		upstreamKeyerId: number,
		direction: Enums.FlyKeyDirection
	): T {
		const command = new Commands.MixEffectKeyRunToCommand(
			mixEffect,
			upstreamKeyerId,
			Enums.FlyKeyKeyFrame.RunToInfinite,
			direction
		)
		return this.sendCommand(command)
	}
	public storeUpstreamKeyerFlyKeyKeyframe(mixEffect: number, upstreamKeyerId: number, keyframe: number): T {
		const command = new Commands.MixEffectKeyFlyKeyframeStoreCommand(mixEffect, upstreamKeyerId, keyframe)
		return this.sendCommand(command)
	}
	public setUpstreamKeyerFlyKeyKeyframe(
		mixEffect: number,
		upstreamKeyerId: number,
		keyframe: number,
		properties: Partial<Omit<USK.UpstreamKeyerFlyKeyframe, 'keyFrameId'>>
	): T {
		const command = new Commands.MixEffectKeyFlyKeyframeCommand(mixEffect, upstreamKeyerId, keyframe)
		command.updateProps(properties)
		return this.sendCommand(command)
	}

	public setUpstreamKeyerType(newProps: Partial<USK.UpstreamKeyerTypeSettings>, me = 0, keyer = 0): T {
		const command = new Commands.MixEffectKeyTypeSetCommand(me, keyer)
		command.updateProps(newProps)
		return this.sendCommand(command)
	}

	public setClassicAudioMixerInputProps(index: number, props: Partial<OmitReadonly<ClassicAudioChannel>>): T {
		const command = new Commands.AudioMixerInputCommand(index)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setClassicAudioMixerMasterProps(props: Partial<ClassicAudioMasterChannel>): T {
		const command = new Commands.AudioMixerMasterCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setClassicAudioMixerMonitorProps(props: Partial<ClassicAudioMonitorChannel>): T {
		const command = new Commands.AudioMixerMonitorCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setClassicAudioMixerHeadphonesProps(props: Partial<ClassicAudioHeadphoneOutputChannel>): T {
		const command = new Commands.AudioMixerHeadphonesCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setClassicAudioResetPeaks(props: Partial<Commands.ClassicAudioResetPeaks>): T {
		const command = new Commands.AudioMixerResetPeaksCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setClassicAudioMixerProps(props: Commands.AudioMixerPropertiesCommand['properties']): T {
		const command = new Commands.AudioMixerPropertiesCommand(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerMasterProps(props: Partial<Commands.FairlightMixerMasterCommandProperties>): T {
		const command = new Commands.FairlightMixerMasterCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerMasterCompressorProps(props: Partial<OmitReadonly<FairlightAudioCompressorState>>): T {
		const command = new Commands.FairlightMixerMasterCompressorCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerMasterLimiterProps(props: Partial<OmitReadonly<FairlightAudioLimiterState>>): T {
		const command = new Commands.FairlightMixerMasterLimiterCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerMasterEqualizerBandProps(
		band: number,
		props: Partial<OmitReadonly<FairlightAudioEqualizerBandState>>
	): T {
		const command = new Commands.FairlightMixerMasterEqualizerBandCommand(band)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerMasterEqualizerReset(
		props: Partial<Commands.FairlightMixerMasterEqualizerResetCommand['properties']>
	): T {
		const command = new Commands.FairlightMixerMasterEqualizerResetCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerMasterDynamicsReset(props: Partial<FairlightDynamicsResetProps>): T {
		const command = new Commands.FairlightMixerMasterDynamicsResetCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerResetPeaks(props: Commands.FairlightMixerResetPeakLevelsCommand['properties']): T {
		const command = new Commands.FairlightMixerResetPeakLevelsCommand(props)
		return this.sendCommand(command)
	}

	public startFairlightMixerSendLevels(): T {
		const command = new Commands.FairlightMixerSendLevelsCommand(true)
		return this.sendCommand(command)
	}

	public stopFairlightMixerSendLevels(): T {
		const command = new Commands.FairlightMixerSendLevelsCommand(false)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerMonitorProps(props: Partial<OmitReadonly<FairlightAudioMonitorChannel>>): T {
		const command = new Commands.FairlightMixerMonitorCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerMonitorSolo(props: Partial<OmitReadonly<FairlightAudioMonitorSolo>>): T {
		const command = new Commands.FairlightMixerMonitorSoloCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerInputProps(
		index: number,
		props: Commands.FairlightMixerInputCommand['properties']
	): T {
		if (this.apiVersion && this.apiVersion >= Enums.ProtocolVersion.V8_0) {
			const command = new Commands.FairlightMixerInputV8Command(index)
			command.updateProps(props)
			return this.sendCommand(command)
		} else {
			const command = new Commands.FairlightMixerInputCommand(index)
			command.updateProps(props)
			return this.sendCommand(command)
		}
	}

	public setFairlightAudioMixerSourceProps(
		index: number,
		source: string,
		props: Commands.FairlightMixerSourceCommand['properties']
	): T {
		const command = new Commands.FairlightMixerSourceCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerSourceCompressorProps(
		index: number,
		source: string,
		props: Partial<OmitReadonly<FairlightAudioCompressorState>>
	): T {
		const command = new Commands.FairlightMixerSourceCompressorCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerSourceLimiterProps(
		index: number,
		source: string,
		props: Partial<OmitReadonly<FairlightAudioLimiterState>>
	): T {
		const command = new Commands.FairlightMixerSourceLimiterCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerSourceExpanderProps(
		index: number,
		source: string,
		props: Partial<OmitReadonly<FairlightAudioExpanderState>>
	): T {
		const command = new Commands.FairlightMixerSourceExpanderCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerSourceEqualizerBandProps(
		index: number,
		source: string,
		band: number,
		props: Partial<OmitReadonly<FairlightAudioEqualizerBandState>>
	): T {
		const command = new Commands.FairlightMixerSourceEqualizerBandCommand(index, BigInt(source), band)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerSourceDynamicsReset(
		index: number,
		source: string,
		props: Partial<FairlightDynamicsResetProps>
	): T {
		const command = new Commands.FairlightMixerSourceDynamicsResetCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerSourceEqualizerReset(
		index: number,
		source: string,
		props: Partial<Commands.FairlightMixerSourceEqualizerResetCommand['properties']>
	): T {
		const command = new Commands.FairlightMixerSourceEqualizerResetCommand(index, BigInt(source))
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioMixerSourceResetPeaks(
		index: number,
		source: string,
		props: Commands.FairlightMixerSourceResetPeakLevelsCommand['properties']
	): T {
		const command = new Commands.FairlightMixerSourceResetPeakLevelsCommand(index, BigInt(source), props)
		return this.sendCommand(command)
	}

	public startStreaming(): T {
		const command = new Commands.StreamingStatusCommand(true)
		return this.sendCommand(command)
	}

	public stopStreaming(): T {
		const command = new Commands.StreamingStatusCommand(false)
		return this.sendCommand(command)
	}

	public requestStreamingDuration(): T {
		const command = new Commands.StreamingRequestDurationCommand()
		return this.sendCommand(command)
	}

	public setStreamingService(props: Partial<StreamingServiceProperties>): T {
		const command = new Commands.StreamingServiceCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setStreamingAudioBitrates(lowBitrate: number, highBitrate: number): T {
		const command = new Commands.StreamingAudioBitratesCommand(lowBitrate, highBitrate)
		return this.sendCommand(command)
	}

	public startRecording(): T {
		const command = new Commands.RecordingStatusCommand(true)
		return this.sendCommand(command)
	}

	public stopRecording(): T {
		const command = new Commands.RecordingStatusCommand(false)
		return this.sendCommand(command)
	}

	public requestRecordingDuration(): T {
		const command = new Commands.RecordingRequestDurationCommand()
		return this.sendCommand(command)
	}

	public switchRecordingDisk(): T {
		const command = new Commands.RecordingRequestSwitchDiskCommand()
		return this.sendCommand(command)
	}

	public setRecordingSettings(props: Partial<RecordingStateProperties>): T {
		const command = new Commands.RecordingSettingsCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setEnableISORecording(enabled: boolean): T {
		const command = new Commands.RecordingISOCommand(enabled)
		return this.sendCommand(command)
	}

	public saveStartupState(): T {
		const command = new Commands.StartupStateSaveCommand()
		return this.sendCommand(command)
	}
	public clearStartupState(): T {
		const command = new Commands.StartupStateClearCommand()
		return this.sendCommand(command)
	}

	public setMediaPoolSettings(props: Commands.MediaPoolProps): T {
		const command = new Commands.MediaPoolSettingsSetCommand(props.maxFrames)
		return this.sendCommand(command)
	}

	public requestDisplayClockTime(): T {
		const command = new Commands.DisplayClockRequestTimeCommand()
		return this.sendCommand(command)
	}

	public setDisplayClockState(state: Enums.DisplayClockClockState): T {
		const command = new Commands.DisplayClockStateSetCommand(state)
		return this.sendCommand(command)
	}

	public setDisplayClockProperties(props: Partial<Commands.DisplayClockPropertiesExt>): T {
		const command = new Commands.DisplayClockPropertiesSetCommand()
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioRoutingSourceProperties(
		sourceId: number,
		props: Partial<OmitReadonly<FairlightAudioRoutingSource>>
	): T {
		const command = new Commands.AudioRoutingSourceCommand(sourceId)
		command.updateProps(props)
		return this.sendCommand(command)
	}

	public setFairlightAudioRoutingOutputProperties(
		sourceId: number,
		props: Partial<OmitReadonly<FairlightAudioRoutingOutput>>
	): T {
		const command = new Commands.AudioRoutingOutputCommand(sourceId)
		command.updateProps(props)
		return this.sendCommand(command)
	}
}
