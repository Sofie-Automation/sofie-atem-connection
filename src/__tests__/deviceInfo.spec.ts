import { listFixtures, parseFixtureState } from './fixtureUtil'

describe('deviceInfo', () => {
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
