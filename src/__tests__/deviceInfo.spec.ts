/* eslint-disable jest/expect-expect */ // Some assertions live in the helpers above
import { ExternalPortType, ProtocolVersion } from '../enums'
import { InputChannel } from '../state/input'
import { AtemCapabilites } from '../state/info'
import { listFixtures, parseFixtureState } from './fixtureUtil'

/** The last couple of _MvC flags are missing from the shorter body used before v8.0 */
function hasMultiviewerFlags(fixture: string): boolean {
	return (parseFixtureState(fixture).info.apiVersion ?? 0) >= ProtocolVersion.V8_0
}

function getCapabilities(fixture: string): AtemCapabilites {
	const capabilities = parseFixtureState(fixture).info.capabilities
	if (!capabilities) throw new Error(`Fixture "${fixture}" has no capabilities`)
	return capabilities
}

/**
 * The multiviewer count only exists in _top from v8.1.1, so it is expected to differ
 * between captures of the same device on either side of that change
 */
function expectSameCapabilities(fixtureA: string, fixtureB: string, ignoreFields: string[] = []): void {
	const trim = (fixture: string): Record<string, unknown> => {
		const capabilities: Record<string, unknown> = { ...getCapabilities(fixture) }
		for (const field of ['multiviewers', ...ignoreFields]) {
			delete capabilities[field]
		}
		return capabilities
	}

	expect(trim(fixtureA)).toEqual(trim(fixtureB))
}

describe('deviceInfo', () => {
	describe('topology', () => {
		/**
		 * The same device, captured either side of a layout change, must be described identically.
		 * v8.0 inserted a byte after superSources, and v8.1.1 inserted the multiviewer count at [6],
		 * so each of these pairs pins one of those shifts.
		 */
		test('4 M/E Broadcast Studio 4K - v7.5.2 vs v8.1.1 layout', () => {
			// hasSDI and talkbackOverSDIChannels are only claimed from v8.0
			expectSameCapabilities('4me4k-v7.5.2', '4me4k-v8.2', ['hasSDI', 'talkbackOverSDIChannels'])
		})
		test('Constellation 8K - v8.0 vs v8.1.1 layout', () => {
			// hasSDI is only claimed from v8.1.1
			expectSameCapabilities('constellation-v8.0.2', 'constellation-v8.2.3', ['hasSDI'])
		})
		test('Television Studio HD - v8.0 vs v8.0.1 layout', () => {
			expectSameCapabilities('tvshd-v8.0.0', 'tvshd-v8.1.0')
		})
		test('Television Studio HD - v8.0.1 vs v8.1.1 layout', () => {
			// hasSDI is only claimed from v8.1.1
			expectSameCapabilities('tvshd-v8.1.0', 'tvshd-v8.2.0', ['hasSDI'])
		})

		test('v7.5.2 values', () => {
			const capabilities = getCapabilities('4me4k-v7.5.2')

			expect(capabilities.talkbackChannels).toBe(1)
			expect(capabilities.cameraControl).toBe(true)
			expect(capabilities.advancedChromaKeyers).toBe(true)
			expect(capabilities.onlyConfigurableOutputs).toBe(false)
		})

		test('hasSDI matches the inputs the device describes', () => {
			let fixtureCount = 0

			for (const fixture of listFixtures()) {
				const state = parseFixtureState(fixture)
				const capabilities = getCapabilities(fixture)
				if (capabilities.hasSDI === undefined) continue

				const anySdiInput = Object.values<InputChannel | undefined>(state.inputs).some((input) =>
					input?.externalPorts?.includes(ExternalPortType.SDI)
				)

				fixtureCount++
				expect([fixture, capabilities.hasSDI]).toEqual([fixture, anySdiInput])
			}

			expect(fixtureCount).toBe(19)
		})

		test('talkbackOverSDIChannels matches the SDI inputs of devices with talkback', () => {
			let fixtureCount = 0

			for (const fixture of listFixtures()) {
				const state = parseFixtureState(fixture)
				const capabilities = getCapabilities(fixture)
				if (capabilities.talkbackOverSDIChannels === undefined) continue

				const sdiInputCount = Object.values<InputChannel | undefined>(state.inputs).filter(
					(input) => input?.externalPortType === ExternalPortType.SDI
				).length

				// Devices without talkback report no channels, the rest report every SDI input
				const expected = capabilities.talkbackChannels === 0 ? 0 : sdiInputCount

				fixtureCount++
				expect([fixture, capabilities.talkbackOverSDIChannels]).toEqual([fixture, expected])
			}

			expect(fixtureCount).toBe(25)
		})

		test('v7.2 leaves the fields it does not describe at their defaults', () => {
			// The v7.2 layout is shorter again, and no reading of the one capture of it is
			// self consistent past superSources, so nothing beyond that is claimed for it
			const capabilities = getCapabilities('ps4k-v7.2')

			expect(capabilities.superSources).toBe(0)
			expect(capabilities.talkbackChannels).toBe(0)
			expect(capabilities.talkbackOverSDIChannels).toBeUndefined()
			expect(capabilities.hasSDI).toBeUndefined()
			expect(capabilities.cameraControl).toBe(false)
			expect(capabilities.advancedChromaKeyers).toBe(false)
			expect(capabilities.onlyConfigurableOutputs).toBe(false)
		})
	})

	describe('multiviewer', () => {
		/**
		 * The window count reported by _MvC must match the number of windows the device
		 * then describes with MvIn commands.
		 * This catches the v8.1.1 layout change, where the multiviewer count moved into _top
		 * and everything after it shifted down a byte.
		 */
		for (const fixture of listFixtures()) {
			// eslint-disable-next-line jest/valid-title
			test(fixture, () => {
				const state = parseFixtureState(fixture)

				// Not every device has a multiviewer
				const info = state.info.multiviewer ?? { count: 0, windowCount: 0 }

				expect(state.settings.multiViewers).toHaveLength(info.count)

				for (let i = 0; i < info.count; i++) {
					expect(state.settings.multiViewers[i]?.windows).toHaveLength(info.windowCount)
				}
			})
		}

		test('reported window counts', () => {
			// A couple of spot values, to make sure the above is not vacuously true
			expect(parseFixtureState('constellation-2me-hd-v9.6.2').info.multiviewer).toMatchObject({
				count: 2,
				windowCount: 16,
			})
			expect(parseFixtureState('1me4k-v8.2').info.multiviewer).toMatchObject({ count: 1, windowCount: 10 })
			expect(parseFixtureState('mini-pro-v8.2').info.multiviewer).toMatchObject({ count: 1, windowCount: 7 })
			// The pre-v8.1.1 layout
			expect(parseFixtureState('4me4k-v7.5.2').info.multiviewer).toMatchObject({ count: 2, windowCount: 10 })
		})

		test('capability flags', () => {
			expect(parseFixtureState('constellation-2me-hd-v9.6.2').info.multiviewer).toEqual({
				count: 2,
				windowCount: 16,
				canChangeLayout: true,
				canRouteInputs: true,
				supportsVuMeters: true,
				canToggleSafeArea: true,
				canSwapPreviewProgram: false,
				supportsQuadrants: true,
			})
			expect(parseFixtureState('mini-pro-v8.2').info.multiviewer).toEqual({
				count: 1,
				windowCount: 7,
				canChangeLayout: false,
				canRouteInputs: false,
				supportsVuMeters: true,
				canToggleSafeArea: true,
				canSwapPreviewProgram: true,
				supportsQuadrants: false,
			})
			// The last two flags are not present in the shorter pre-v8.0 body
			expect(parseFixtureState('4me4k-v7.5.2').info.multiviewer).toEqual({
				count: 2,
				windowCount: 10,
				canChangeLayout: true,
				canRouteInputs: true,
				supportsVuMeters: true,
				canToggleSafeArea: true,
				canSwapPreviewProgram: false,
				supportsQuadrants: false,
			})
		})

		test('supportsQuadrants matches the 16 window layout', () => {
			// Every device which reports the flag reports it exactly when it has 16 windows
			for (const fixture of listFixtures()) {
				const info = parseFixtureState(fixture).info.multiviewer
				if (!info || !hasMultiviewerFlags(fixture)) continue

				expect([fixture, info.supportsQuadrants]).toEqual([fixture, info.windowCount === 16])
			}
		})
	})

	describe('fairlight equalizer', () => {
		const EXPECTED_RANGES = [
			{ frequencyRange: 1, minFrequency: 30, maxFrequency: 395 },
			{ frequencyRange: 2, minFrequency: 100, maxFrequency: 1480 },
			{ frequencyRange: 4, minFrequency: 450, maxFrequency: 7910 },
			{ frequencyRange: 8, minFrequency: 1400, maxFrequency: 21700 },
		]

		test('every fairlight device reports the same frequency ranges', () => {
			let fixtureCount = 0

			for (const fixture of listFixtures()) {
				const info = parseFixtureState(fixture).info.fairlightMixer
				if (!info) continue

				fixtureCount++
				expect([fixture, info.equalizerFrequencyRanges]).toEqual([fixture, EXPECTED_RANGES])
			}

			expect(fixtureCount).toBe(17)
		})

		test('the master equalizer bands sit within the range they select', () => {
			for (const fixture of listFixtures()) {
				const state = parseFixtureState(fixture)
				const ranges = state.info.fairlightMixer?.equalizerFrequencyRanges
				if (!ranges) continue

				for (const band of state.fairlight?.master?.equalizer?.bands ?? []) {
					if (!band) continue

					const range = ranges.find((r) => r.frequencyRange === band.frequencyRange)
					expect(range).toBeTruthy()
					expect(band.frequency).toBeGreaterThanOrEqual(range?.minFrequency ?? 0)
					expect(band.frequency).toBeLessThanOrEqual(range?.maxFrequency ?? 0)
				}
			}
		})
	})
})
