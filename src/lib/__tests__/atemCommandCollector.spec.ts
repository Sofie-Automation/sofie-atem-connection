import { AtemCommandCollector } from '../batchCommands'
import * as Commands from '../../commands'
import { ProtocolVersion } from '../../enums'

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
})
