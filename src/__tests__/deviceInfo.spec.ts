/* eslint-disable jest/expect-expect */ // Some assertions live in the helpers above
import { AtemCapabilites } from '../state/info'
import { listFixtures, parseFixtureState } from './fixtureUtil'

function getCapabilities(fixture: string): AtemCapabilites {
	const capabilities = parseFixtureState(fixture).info.capabilities
	if (!capabilities) throw new Error(`Fixture "${fixture}" has no capabilities`)
	return capabilities
}

/**
 * The multiviewer count only exists in _top from v8.1.1, so it is expected to differ
 * between captures of the same device on either side of that change
 */
function expectSameCapabilities(fixtureA: string, fixtureB: string): void {
	const trim = (fixture: string): Record<string, unknown> => {
		const capabilities: Record<string, unknown> = { ...getCapabilities(fixture) }
		delete capabilities.multiviewers
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
			expectSameCapabilities('4me4k-v7.5.2', '4me4k-v8.2')
		})
		test('Constellation 8K - v8.0 vs v8.1.1 layout', () => {
			expectSameCapabilities('constellation-v8.0.2', 'constellation-v8.2.3')
		})
		test('Television Studio HD - v8.0 vs v8.0.1 layout', () => {
			expectSameCapabilities('tvshd-v8.0.0', 'tvshd-v8.1.0')
		})
		test('Television Studio HD - v8.0.1 vs v8.1.1 layout', () => {
			expectSameCapabilities('tvshd-v8.1.0', 'tvshd-v8.2.0')
		})

		test('v7.5.2 values', () => {
			const capabilities = getCapabilities('4me4k-v7.5.2')

			expect(capabilities.talkbackChannels).toBe(1)
			expect(capabilities.cameraControl).toBe(true)
			expect(capabilities.advancedChromaKeyers).toBe(true)
			expect(capabilities.onlyConfigurableOutputs).toBe(false)
		})

		test('v7.2 leaves the fields it does not describe at their defaults', () => {
			// The v7.2 layout is shorter again, and no reading of the one capture of it is
			// self consistent past superSources, so nothing beyond that is claimed for it
			const capabilities = getCapabilities('ps4k-v7.2')

			expect(capabilities.superSources).toBe(0)
			expect(capabilities.talkbackChannels).toBe(0)
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
	})
})
