import { Commands } from '../index.js'
import { listVisibleInputs } from '../lib/tally.js'

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { AtemStateUtil, AtemState } from '../state/index.js'
import { createEmptyState } from './util.js'
import { getComponents } from '../lib/atemUtil.js'

function readJson(fileName: string): any {
	const filePath = resolve(__dirname, fileName)
	const fileData = readFileSync(filePath)
	return JSON.parse(fileData as any)
}

function loadRawState(file: string): AtemState {
	const loadedState: AtemState = {
		...AtemStateUtil.Create(),
		...readJson(`./tally/${file}-state.json`),
	}

	if (!loadedState.info.capabilities) {
		const emptyState = createEmptyState()
		loadedState.info.capabilities = emptyState.info.capabilities
	}

	// Fix up older video states
	if (!loadedState.video.mixEffects) {
		const videoState = loadedState.video as any
		videoState.mixEffects = videoState.ME
	}

	loadedState.video.mixEffects.forEach((me) => {
		// Lazy fix up moving some state properties
		if (me) {
			const me1 = me as any
			if (typeof me.transitionPosition === 'number') {
				me.transitionPosition = {
					inTransition: me1.inTransition,
					handlePosition: me1.transitionPosition,
					remainingFrames: me1.transitionFramesLeft,
				}
				delete me1.transitionFramesLeft
				delete me1.inTransition
			}
			if (typeof me.transitionProperties.selection === 'number') {
				;(me.transitionProperties as any).selection = getComponents(me.transitionProperties.selection)
			}
			if (typeof me.transitionProperties.nextSelection === 'number') {
				;(me.transitionProperties as any).nextSelection = getComponents(me.transitionProperties.nextSelection)
			}
		}
	})

	return loadedState
}
function loadTally(file: string): { program: number[]; preview: number[] } {
	const rawTally = readJson(`./tally/${file}-tally.json`) as Commands.TallyBySourceCommand['properties']

	const program: number[] = []
	const preview: number[] = []
	for (const id in rawTally) {
		const elm = rawTally[id]
		if (elm && elm.program) {
			program.push(Number(id))
		}
		if (elm && elm.preview) {
			preview.push(Number(id))
		}
	}

	return {
		program: program.sort(),
		preview: preview.sort(),
	}
}

function runTestMe1(name: string, filename: string): void {
	const rawTally = loadTally(filename)
	const rawState = loadRawState(filename)

	test(`${name} - program`, () => {
		const res = listVisibleInputs('program', rawState, 0).sort()
		expect(res).toEqual(rawTally.program)
	})
	test(`${name} - preview`, () => {
		const res = listVisibleInputs('preview', rawState, 0).sort()
		expect(res).toEqual(rawTally.preview)
	})
}

describe('tally', () => {
	/**
	 * Test cases can be generated with the dump.js script.
	 * These tests compare listVisibleInputs against the atem TlSr command
	 */
	runTestMe1('dsk active', 'dsk-active')
	runTestMe1('dsk in auto', 'dsk-in-auto')
	runTestMe1('ssrc', 'ssrc')
	runTestMe1('ssrc2', 'ssrc2')
	runTestMe1('upstream keyers', 'upstream-keyers')
	runTestMe1('mid wipe - no border', 'mid-wipe-no-border')
	runTestMe1('mid wipe - with border', 'mid-wipe-with-border')
	runTestMe1('mid dip', 'mid-dip')
	runTestMe1('mid sting', 'mid-trans-sting')
	runTestMe1('mid dve - no inputs', 'mid-trans-dve')
	runTestMe1('mid dve - with fill', 'mid-trans-dve-with-fill')
	runTestMe1('mid dve - with fill and key', 'mid-trans-dve-with-fill-and-key')
	runTestMe1('preview transition', 'preview-trans')
	runTestMe1('mid preview transition', 'mid-preview-trans')
	runTestMe1('chain me2 pgm', 'chain-me2-pgm')
	runTestMe1('chain me2 pvw', 'chain-me2-pvw')
	runTestMe1('me2 in ssrc', 'me2-in-ssrc')
})
