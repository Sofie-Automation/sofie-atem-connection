import * as Commands from '../commands/index.js'
import * as Enums from '../enums/index.js'
import type { FairlightDynamicsResetProps } from '../commands/Fairlight/common.js'
import type { ISerializableCommand } from '../commands/index.js'
import type {
	ClassicAudioHeadphoneOutputChannel,
	ClassicAudioMasterChannel,
	ClassicAudioMonitorChannel,
} from '../state/audio.js'
import type { ColorGeneratorState } from '../state/color.js'
import type {
	FairlightAudioCompressorState,
	FairlightAudioEqualizerBandState,
	FairlightAudioExpanderState,
	FairlightAudioInputProperties,
	FairlightAudioLimiterState,
	FairlightAudioMonitorChannel,
	FairlightAudioMonitorSolo,
	FairlightAudioRoutingOutput,
	FairlightAudioRoutingSource,
} from '../state/fairlight.js'
import type { InputChannel } from '../state/input.js'
import type { MediaPlayer, MediaPlayerSource } from '../state/media.js'
import type { RecordingStateProperties } from '../state/recording.js'
import type {
	MultiViewerBorderColorState,
	MultiViewerPropertiesState,
	MultiViewerWindowOverlayPropertiesState,
} from '../state/settings.js'
import type { StreamingServiceProperties } from '../state/streaming.js'
import type { DownstreamKeyerGeneral, DownstreamKeyerMask } from '../state/video/downstreamKeyers.js'
import type {
	DipTransitionSettings,
	DVETransitionSettings,
	MixTransitionSettings,
	StingerTransitionSettings,
	SuperSource,
	TransitionProperties,
	USK,
	WipeTransitionSettings,
} from '../state/video/index.js'
import type { OmitReadonly } from './types.js'

/**
 * The control surface that the command sender methods need from their host class.
 * A host provides a way to dispatch a command (returning `T`) and knowledge of the connected apiVersion.
 */
export interface AtemCommandSenderControl<T> {
	sendCommand(command: ISerializableCommand): T
	sendCommands(commands: ISerializableCommand[]): T
	readonly apiVersion: Enums.ProtocolVersion | undefined
}

/** Convert the pre 8.1.1 RCA to XLR flag to an input level, matching how FairlightMixerInputUpdateCommand reads it */
function rcaToXlrToInputLevel(rcaToXlrEnabled: boolean | undefined): Enums.FairlightAnalogInputLevel | undefined {
	if (rcaToXlrEnabled === undefined) return undefined
	return rcaToXlrEnabled ? Enums.FairlightAnalogInputLevel.ProLine : Enums.FairlightAnalogInputLevel.Microphone
}

/**
 * Mixin which adds all of the command-sending helper methods to a base class.
 * Any sending of commands should be done through these methods, allowing them to be used in both a direct or batched manner.
 *
 * The return type of each method matches the base class's `sendCommand`, so a direct client returns `T`
 * while a batching client returns `void`.
 *
 * Methods which take a set of properties to change send nothing when none of them are set, returning `noopResult()`.
 *
 * @param Base The class providing the ways to send commands
 * @param noopResult Produces the result to return when there is nothing to send
 */
// The return type is an anonymous mixin class which cannot be practically named, so let it be inferred.
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function AtemCommandSenderMixin<T, TBase extends new (...args: any[]) => AtemCommandSenderControl<T>>(
	Base: TBase,
	noopResult: () => T
) {
	/**
	 * Apply the properties to the command, and send it. If none of the properties are set, nothing is sent.
	 * This is a function rather than a method of the class, as a private member can't be part of the inferred type.
	 */
	function updateAndSend<P>(
		host: AtemCommandSenderControl<T>,
		command: ISerializableCommand & { updateProps(props: P): boolean },
		props: P
	): T {
		return command.updateProps(props) ? host.sendCommand(command) : noopResult()
	}

	return class AtemCommandSender extends Base {
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
			// Always sent, as no direction is a valid command
			command.updateProps({ isTowardsOnAir })
			return this.sendCommand(command)
		}

		public setDipTransitionSettings(newProps: Partial<DipTransitionSettings>, me = 0): T {
			const command = new Commands.TransitionDipCommand(me)
			return updateAndSend(this, command, newProps)
		}

		public setDVETransitionSettings(newProps: Partial<DVETransitionSettings>, me = 0): T {
			const command = new Commands.TransitionDVECommand(me)
			return updateAndSend(this, command, newProps)
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
			return updateAndSend(this, command, newProps)
		}

		public setStingerTransitionSettings(newProps: Partial<StingerTransitionSettings>, me = 0): T {
			const command = new Commands.TransitionStingerCommand(me)
			return updateAndSend(this, command, newProps)
		}

		public setWipeTransitionSettings(newProps: Partial<WipeTransitionSettings>, me = 0): T {
			const command = new Commands.TransitionWipeCommand(me)
			return updateAndSend(this, command, newProps)
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
			return updateAndSend(this, command, props)
		}

		public setDownstreamKeyMaskSettings(props: Partial<DownstreamKeyerMask>, key = 0): T {
			const command = new Commands.DownstreamKeyMaskCommand(key)
			return updateAndSend(this, command, props)
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
			return updateAndSend(this, command, props)
		}

		public macroSetLoop(loop: boolean): T {
			const command = new Commands.MacroRunStatusCommand()
			return updateAndSend(this, command, { loop })
		}

		public setMultiViewerWindowSource(source: number, mv = 0, window = 0): T {
			const command = new Commands.MultiViewerSourceCommand(mv, window, source)
			return this.sendCommand(command)
		}
		public setMultiViewerWindowSafeAreaEnabled(safeAreaEnabled: boolean, mv = 0, window = 0): T {
			if (this.apiVersion && this.apiVersion < Commands.MultiViewerWindowSafeAreaCommand.minimumVersion) {
				throw new Error(
					'Per window safe area is not supported before 8.0, use setMultiViewerProperties({ safeAreaEnabled }) instead'
				)
			}

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
			if (this.apiVersion && this.apiVersion >= Commands.MultiViewerPropertiesCommand.minimumVersion) {
				if (props.safeAreaEnabled !== undefined) {
					throw new Error(
						'safeAreaEnabled is only supported before 8.0, use setMultiViewerWindowSafeAreaEnabled instead'
					)
				}

				const command = new Commands.MultiViewerPropertiesCommand(mv)
				return updateAndSend(this, command, props)
			} else {
				const command = new Commands.MultiViewerPropertiesV7Command(mv)
				return updateAndSend(this, command, props)
			}
		}
		public setMultiViewerBorderColor(color: MultiViewerBorderColorState, mv = 0): T {
			const command = new Commands.MultiViewerBorderColorCommand(mv, color)
			return this.sendCommand(command)
		}
		public setMultiViewerWindowOverlayProperties(
			props: Partial<MultiViewerWindowOverlayPropertiesState>,
			mv = 0,
			window = 0
		): T {
			const command = new Commands.MultiViewerWindowOverlayPropertiesCommand(mv, window)
			return updateAndSend(this, command, props)
		}
		public setMultiViewerWindowSafeAreaPattern(safeTitlePattern: Enums.SafeTitlePattern[], mv = 0, window = 0): T {
			const command = new Commands.MultiViewerWindowOverlaySafeAreaPatternCommand(mv, window, safeTitlePattern)
			return this.sendCommand(command)
		}

		public setColorGeneratorColour(newProps: Partial<ColorGeneratorState>, index = 0): T {
			const command = new Commands.ColorGeneratorCommand(index)
			return updateAndSend(this, command, newProps)
		}

		public setMediaPlayerSettings(newProps: Partial<MediaPlayer>, player = 0): T {
			const command = new Commands.MediaPlayerStatusCommand(player)
			return updateAndSend(this, command, newProps)
		}

		public setMediaPlayerSource(newProps: Partial<MediaPlayerSource>, player = 0): T {
			const command = new Commands.MediaPlayerSourceCommand(player)
			return updateAndSend(this, command, newProps)
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

		public setSuperSourceBoxSettings(
			newProps: Partial<Commands.SuperSourceBoxParametersCommandProps>,
			box = 0,
			ssrcId = 0
		): T {
			const command = new Commands.SuperSourceBoxParametersCommand(ssrcId, box)
			return updateAndSend(this, command, newProps)
		}

		public setSuperSourceProperties(newProps: Partial<SuperSource.SuperSourceProperties>, ssrcId = 0): T {
			if (this.apiVersion && this.apiVersion >= Commands.SuperSourcePropertiesV8Command.minimumVersion) {
				const command = new Commands.SuperSourcePropertiesV8Command(ssrcId)
				return updateAndSend(this, command, newProps)
			} else {
				const command = new Commands.SuperSourcePropertiesCommand()
				return updateAndSend(this, command, newProps)
			}
		}

		public setSuperSourceBorder(newProps: Partial<SuperSource.SuperSourceBorder>, ssrcId = 0): T {
			if (this.apiVersion && this.apiVersion >= Commands.SuperSourceBorderCommand.minimumVersion) {
				const command = new Commands.SuperSourceBorderCommand(ssrcId)
				return updateAndSend(this, command, newProps)
			} else {
				const command = new Commands.SuperSourcePropertiesCommand()
				return updateAndSend(this, command, newProps)
			}
		}

		/**
		 * Set the per-box SuperSource border (Constellation HD range and newer,
		 * firmware 9.6.0+). When `box` is omitted the same values are applied to all
		 * four boxes.
		 */
		public setSuperSourceBoxBorder(
			newProps: Partial<SuperSource.SuperSourceBoxBorder>,
			box?: number | null,
			ssrcId = 0
		): T {
			const boxIds = box === undefined || box === null ? [0, 1, 2, 3] : [box]
			const commands: Commands.SuperSourceBoxBorderCommand[] = []
			for (const boxId of boxIds) {
				const command = new Commands.SuperSourceBoxBorderCommand(ssrcId, boxId)
				// Skip the command if it changes nothing
				if (command.updateProps(newProps)) commands.push(command)
			}
			return this.sendCommands(commands)
		}

		public setInputSettings(newProps: Partial<OmitReadonly<InputChannel>>, input = 0): T {
			const command = new Commands.InputPropertiesCommand(input)
			return updateAndSend(this, command, newProps)
		}

		public setUpstreamKeyerChromaSettings(
			newProps: Partial<USK.UpstreamKeyerChromaSettings>,
			me = 0,
			keyer = 0
		): T {
			const command = new Commands.MixEffectKeyChromaCommand(me, keyer)
			return updateAndSend(this, command, newProps)
		}

		public setUpstreamKeyerAdvancedChromaProperties(
			newProps: Partial<USK.UpstreamKeyerAdvancedChromaProperties>,
			me = 0,
			keyer = 0
		): T {
			const command = new Commands.MixEffectKeyAdvancedChromaPropertiesCommand(me, keyer)
			return updateAndSend(this, command, newProps)
		}
		public setUpstreamKeyerAdvancedChromaSample(
			newProps: Partial<USK.UpstreamKeyerAdvancedChromaSample>,
			me = 0,
			keyer = 0
		): T {
			const command = new Commands.MixEffectKeyAdvancedChromaSampleCommand(me, keyer)
			return updateAndSend(this, command, newProps)
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
			return updateAndSend(this, command, newProps)
		}

		public setUpstreamKeyerLumaSettings(newProps: Partial<USK.UpstreamKeyerLumaSettings>, me = 0, keyer = 0): T {
			const command = new Commands.MixEffectKeyLumaCommand(me, keyer)
			return updateAndSend(this, command, newProps)
		}

		public setUpstreamKeyerMaskSettings(newProps: Partial<USK.UpstreamKeyerMaskSettings>, me = 0, keyer = 0): T {
			const command = new Commands.MixEffectKeyMaskSetCommand(me, keyer)
			return updateAndSend(this, command, newProps)
		}

		public setUpstreamKeyerPatternSettings(
			newProps: Partial<USK.UpstreamKeyerPatternSettings>,
			me = 0,
			keyer = 0
		): T {
			const command = new Commands.MixEffectKeyPatternCommand(me, keyer)
			return updateAndSend(this, command, newProps)
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
			return updateAndSend(this, command, properties)
		}

		public setUpstreamKeyerType(newProps: Partial<USK.UpstreamKeyerTypeSettings>, me = 0, keyer = 0): T {
			const command = new Commands.MixEffectKeyTypeSetCommand(me, keyer)
			return updateAndSend(this, command, newProps)
		}

		public setClassicAudioMixerInputProps(index: number, props: Partial<Commands.AudioMixerInputCommandProps>): T {
			const command = new Commands.AudioMixerInputCommand(index)
			return updateAndSend(this, command, props)
		}

		public setClassicAudioMixerMasterProps(props: Partial<ClassicAudioMasterChannel>): T {
			const command = new Commands.AudioMixerMasterCommand()
			return updateAndSend(this, command, props)
		}

		public setClassicAudioMixerMonitorProps(props: Partial<ClassicAudioMonitorChannel>): T {
			const command = new Commands.AudioMixerMonitorCommand()
			return updateAndSend(this, command, props)
		}

		public setClassicAudioMixerHeadphonesProps(props: Partial<ClassicAudioHeadphoneOutputChannel>): T {
			const command = new Commands.AudioMixerHeadphonesCommand()
			return updateAndSend(this, command, props)
		}

		public setClassicAudioResetPeaks(props: Partial<Commands.ClassicAudioResetPeaks>): T {
			const command = new Commands.AudioMixerResetPeaksCommand()
			return updateAndSend(this, command, props)
		}

		public setClassicAudioMixerProps(props: Commands.AudioMixerPropertiesCommand['properties']): T {
			const command = new Commands.AudioMixerPropertiesCommand(props)
			return this.sendCommand(command)
		}

		public setFairlightAudioMixerProps(props: { audioFollowVideo: boolean }): T {
			const command = new Commands.FairlightMixerMasterPropertiesCommand()
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerMasterProps(props: Partial<Commands.FairlightMixerMasterCommandProperties>): T {
			const command = new Commands.FairlightMixerMasterCommand()
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerMasterCompressorProps(
			props: Partial<OmitReadonly<FairlightAudioCompressorState>>
		): T {
			const command = new Commands.FairlightMixerMasterCompressorCommand()
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerMasterLimiterProps(props: Partial<OmitReadonly<FairlightAudioLimiterState>>): T {
			const command = new Commands.FairlightMixerMasterLimiterCommand()
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerMasterEqualizerBandProps(
			band: number,
			props: Partial<OmitReadonly<FairlightAudioEqualizerBandState>>
		): T {
			const command = new Commands.FairlightMixerMasterEqualizerBandCommand(band)
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerMasterEqualizerReset(
			props: Partial<Commands.FairlightMixerMasterEqualizerResetCommand['properties']>
		): T {
			const command = new Commands.FairlightMixerMasterEqualizerResetCommand()
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerMasterDynamicsReset(props: Partial<FairlightDynamicsResetProps>): T {
			const command = new Commands.FairlightMixerMasterDynamicsResetCommand()
			return updateAndSend(this, command, props)
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
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerMonitorSolo(props: Partial<OmitReadonly<FairlightAudioMonitorSolo>>): T {
			const command = new Commands.FairlightMixerMonitorSoloCommand()
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerInputProps(
			index: number,
			props: Partial<OmitReadonly<FairlightAudioInputProperties>> & {
				/**
				 * Whether the RCA input is used instead of XLR, which is how the input level was set before 8.1.1
				 * @deprecated Use `activeInputLevel`. `true` is `ProLine`, and `false` is `Microphone`
				 */
				rcaToXlrEnabled?: boolean
			}
		): T {
			const { rcaToXlrEnabled, activeInputLevel, ...otherProps } = props

			if (this.apiVersion && this.apiVersion >= Commands.FairlightMixerInputV8Command.minimumVersion) {
				const command = new Commands.FairlightMixerInputV8Command(index)
				return updateAndSend(this, command, {
					...otherProps,
					activeInputLevel: activeInputLevel ?? rcaToXlrToInputLevel(rcaToXlrEnabled),
				})
			} else {
				const command = new Commands.FairlightMixerInputCommand(index)
				return updateAndSend(this, command, {
					...otherProps,
					// The reverse of how FairlightMixerInputUpdateCommand reads it
					rcaToXlrEnabled:
						activeInputLevel !== undefined
							? activeInputLevel === Enums.FairlightAnalogInputLevel.ProLine
							: rcaToXlrEnabled,
				})
			}
		}

		public setFairlightAudioMixerSourceProps(
			index: number,
			source: string,
			props: Commands.FairlightMixerSourceCommand['properties']
		): T {
			const command = new Commands.FairlightMixerSourceCommand(index, BigInt(source))
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerSourceCompressorProps(
			index: number,
			source: string,
			props: Partial<OmitReadonly<FairlightAudioCompressorState>>
		): T {
			const command = new Commands.FairlightMixerSourceCompressorCommand(index, BigInt(source))
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerSourceLimiterProps(
			index: number,
			source: string,
			props: Partial<OmitReadonly<FairlightAudioLimiterState>>
		): T {
			const command = new Commands.FairlightMixerSourceLimiterCommand(index, BigInt(source))
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerSourceExpanderProps(
			index: number,
			source: string,
			props: Partial<OmitReadonly<FairlightAudioExpanderState>>
		): T {
			const command = new Commands.FairlightMixerSourceExpanderCommand(index, BigInt(source))
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerSourceEqualizerBandProps(
			index: number,
			source: string,
			band: number,
			props: Partial<OmitReadonly<FairlightAudioEqualizerBandState>>
		): T {
			const command = new Commands.FairlightMixerSourceEqualizerBandCommand(index, BigInt(source), band)
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerSourceDynamicsReset(
			index: number,
			source: string,
			props: Partial<FairlightDynamicsResetProps>
		): T {
			const command = new Commands.FairlightMixerSourceDynamicsResetCommand(index, BigInt(source))
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioMixerSourceEqualizerReset(
			index: number,
			source: string,
			props: Partial<Commands.FairlightMixerSourceEqualizerResetCommand['properties']>
		): T {
			const command = new Commands.FairlightMixerSourceEqualizerResetCommand(index, BigInt(source))
			return updateAndSend(this, command, props)
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
			return updateAndSend(this, command, props)
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
			return updateAndSend(this, command, props)
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
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioRoutingSourceProperties(
			sourceId: number,
			props: Partial<OmitReadonly<FairlightAudioRoutingSource>>
		): T {
			const command = new Commands.AudioRoutingSourceCommand(sourceId)
			return updateAndSend(this, command, props)
		}

		public setFairlightAudioRoutingOutputProperties(
			sourceId: number,
			props: Partial<OmitReadonly<FairlightAudioRoutingOutput>>
		): T {
			const command = new Commands.AudioRoutingOutputCommand(sourceId)
			return updateAndSend(this, command, props)
		}
	}
}
