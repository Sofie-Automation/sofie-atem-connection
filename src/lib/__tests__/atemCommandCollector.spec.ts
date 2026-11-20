import { AtemCommandCollector } from '../batchCommands'
import * as Commands from '../../commands'
import { FairlightAnalogInputLevel, ProtocolVersion } from '../../enums'

describe('AtemCommandCollector', () => {
	test('takeCommands returns the collected commands, and empties the list', () => {
		const collector = new AtemCommandCollector(ProtocolVersion.V8_0)
		collector.cut(0)
		collector.autoTransition(1)

		const commands = collector.takeCommands()
		expect(commands).toEqual([new Commands.CutCommand(0), new Commands.AutoTransitionCommand(1)])
		expect(collector.takeCommands()).toEqual([])
	})

	function collect(version: ProtocolVersion, fn: (collector: AtemCommandCollector) => void) {
		const collector = new AtemCommandCollector(version)
		fn(collector)
		return collector.takeCommands()
	}

	test('methods given no properties to change add no commands', () => {
		const commands = collect(ProtocolVersion.V8_1_1, (c) => {
			c.setInputSettings({})
			c.setTransitionStyle({})
			c.setUpstreamKeyerChromaSettings({})
			c.setSuperSourceProperties({})
			c.setFairlightAudioMixerInputProps(1, {})
			c.setMultiViewerProperties({})
			c.setSuperSourceBoxBorder({})
			// Undefined values don't count as changes either
			c.setDownstreamKeyGeneralProperties({ preMultiply: undefined })
		})
		expect(commands).toEqual([])
	})

	test('autoDownstreamKey is sent without a direction', () => {
		const commands = collect(ProtocolVersion.V8_0, (c) => c.autoDownstreamKey(1))
		expect(commands).toEqual([new Commands.DownstreamKeyAutoCommand(1)])
	})

	test('only boxes with changes get a command', () => {
		const commands = collect(ProtocolVersion.V8_1_1, (c) => c.setSuperSourceBoxBorder({ borderEnabled: true }))
		expect(commands).toHaveLength(4)
	})

	test('setFairlightAudioMixerProps sets audio follow video', () => {
		const commands = collect(ProtocolVersion.V8_1_1, (c) =>
			c.setFairlightAudioMixerProps({ audioFollowVideo: true })
		)
		expect(commands).toHaveLength(1)
		expect(commands[0]).toBeInstanceOf(Commands.FairlightMixerMasterPropertiesCommand)
		expect((commands[0] as Commands.FairlightMixerMasterPropertiesCommand).properties).toEqual({
			audioFollowVideo: true,
		})
	})

	describe('version specific commands', () => {
		test.each([
			[ProtocolVersion.V7_5_2, Commands.SuperSourcePropertiesCommand],
			[ProtocolVersion.V8_0, Commands.SuperSourcePropertiesV8Command],
		])('setSuperSourceProperties at %s', (version, expected) => {
			const commands = collect(version, (c) => c.setSuperSourceProperties({ artFillSource: 1 }))
			expect(commands).toHaveLength(1)
			expect(commands[0]).toBeInstanceOf(expected)
		})

		test.each([
			[ProtocolVersion.V7_5_2, Commands.SuperSourcePropertiesCommand],
			[ProtocolVersion.V8_0, Commands.SuperSourceBorderCommand],
		])('setSuperSourceBorder at %s', (version, expected) => {
			const commands = collect(version, (c) => c.setSuperSourceBorder({ borderEnabled: true }))
			expect(commands).toHaveLength(1)
			expect(commands[0]).toBeInstanceOf(expected)
		})

		test.each([
			[ProtocolVersion.V8_0_1, Commands.FairlightMixerInputCommand],
			[ProtocolVersion.V8_1_1, Commands.FairlightMixerInputV8Command],
		])('setFairlightAudioMixerInputProps at %s', (version, expected) => {
			const commands = collect(version, (c) => c.setFairlightAudioMixerInputProps(1, { activeConfiguration: 1 }))
			expect(commands).toHaveLength(1)
			expect(commands[0]).toBeInstanceOf(expected)
		})

		test.each([
			[ProtocolVersion.V7_5_2, Commands.MultiViewerPropertiesV7Command],
			[ProtocolVersion.V8_0, Commands.MultiViewerPropertiesCommand],
		])('setMultiViewerProperties at %s', (version, expected) => {
			const commands = collect(version, (c) => c.setMultiViewerProperties({ programPreviewSwapped: true }))
			expect(commands).toHaveLength(1)
			expect(commands[0]).toBeInstanceOf(expected)
		})

		test('setMultiViewerWindowSafeAreaEnabled is only supported from 8.0', () => {
			expect(() => collect(ProtocolVersion.V7_5_2, (c) => c.setMultiViewerWindowSafeAreaEnabled(true))).toThrow(
				/not supported before 8.0/
			)
			const commands = collect(ProtocolVersion.V8_0, (c) => c.setMultiViewerWindowSafeAreaEnabled(true))
			expect(commands).toHaveLength(1)
			expect(commands[0]).toBeInstanceOf(Commands.MultiViewerWindowSafeAreaCommand)
		})
	})

	describe('setFairlightAudioMixerInputProps input level', () => {
		function inputCommand(
			version: ProtocolVersion,
			props: Parameters<AtemCommandCollector['setFairlightAudioMixerInputProps']>[1]
		) {
			const commands = collect(version, (c) => c.setFairlightAudioMixerInputProps(2, props))
			expect(commands).toHaveLength(1)
			return commands[0] as Commands.FairlightMixerInputCommand | Commands.FairlightMixerInputV8Command
		}

		test('before 8.1.1, activeInputLevel is converted to rcaToXlrEnabled', () => {
			const proLine = inputCommand(ProtocolVersion.V8_0_1, {
				activeInputLevel: FairlightAnalogInputLevel.ProLine,
			})
			expect(proLine).toBeInstanceOf(Commands.FairlightMixerInputCommand)
			expect(proLine.properties).toEqual({ rcaToXlrEnabled: true })
			expect(proLine.flag).toEqual(Commands.FairlightMixerInputCommand.MaskFlags.rcaToXlrEnabled)

			const mic = inputCommand(ProtocolVersion.V8_0_1, { activeInputLevel: FairlightAnalogInputLevel.Microphone })
			expect(mic.properties).toEqual({ rcaToXlrEnabled: false })
		})

		test('before 8.1.1, the deprecated rcaToXlrEnabled is passed through', () => {
			const command = inputCommand(ProtocolVersion.V8_0_1, { rcaToXlrEnabled: true, activeConfiguration: 1 })
			expect(command.properties).toEqual({ rcaToXlrEnabled: true, activeConfiguration: 1 })
		})

		test('from 8.1.1, activeInputLevel is set directly', () => {
			const command = inputCommand(ProtocolVersion.V8_1_1, {
				activeInputLevel: FairlightAnalogInputLevel.ConsumerLine,
			})
			expect(command).toBeInstanceOf(Commands.FairlightMixerInputV8Command)
			expect(command.properties).toEqual({ activeInputLevel: FairlightAnalogInputLevel.ConsumerLine })
			expect(command.flag).toEqual(Commands.FairlightMixerInputV8Command.MaskFlags.activeInputLevel)
		})

		test('from 8.1.1, the deprecated rcaToXlrEnabled is converted to activeInputLevel', () => {
			expect(inputCommand(ProtocolVersion.V8_1_1, { rcaToXlrEnabled: true }).properties).toEqual({
				activeInputLevel: FairlightAnalogInputLevel.ProLine,
			})
			expect(inputCommand(ProtocolVersion.V8_1_1, { rcaToXlrEnabled: false }).properties).toEqual({
				activeInputLevel: FairlightAnalogInputLevel.Microphone,
			})
		})

		test('activeInputLevel takes priority over the deprecated rcaToXlrEnabled', () => {
			const command = inputCommand(ProtocolVersion.V8_1_1, {
				activeInputLevel: FairlightAnalogInputLevel.ConsumerLine,
				rcaToXlrEnabled: true,
			})
			expect(command.properties).toEqual({ activeInputLevel: FairlightAnalogInputLevel.ConsumerLine })
		})
	})
})
