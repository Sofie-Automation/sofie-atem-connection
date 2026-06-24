import { AtemState, AtemStateUtil } from '../state/index.js'
import * as Enums from '../enums/index.js'

/**
 * Helper method used by listVisibleInputs.
 * This got broken out into its own method because
 * it gets called multiple times, and gets called in a loop.
 * Breaking it out made listVisibleInputs much easier to read.
 */
function _calcActiveMeInputs(inputs: Set<number>, mode: 'program' | 'preview', state: AtemState, meId: number): void {
	const meRef = AtemStateUtil.getMixEffect(state, meId)

	if (mode === 'preview') {
		if (meRef.transitionProperties.selection.includes(Enums.TransitionSelection.Background)) {
			inputs.add(meRef.previewInput)
		}
	} else {
		inputs.add(meRef.programInput)
	}

	// Upstream Keyers
	meRef.upstreamKeyers
		.filter((usk) => {
			if (usk) {
				const keyerMask: Enums.TransitionSelection = 1 << (usk.upstreamKeyerId + 1)
				const isPartOfTransition = meRef.transitionProperties.selection.includes(keyerMask)
				if (mode === 'program') {
					if (meRef.transitionPosition.inTransition) {
						return usk.onAir || isPartOfTransition
					}

					return usk.onAir
				}

				return (isPartOfTransition && !usk.onAir) || (usk.onAir && !isPartOfTransition)
			} else {
				return false
			}
		})
		.forEach((usk) => {
			if (usk) {
				inputs.add(usk.fillSource)

				// This is the only USK type that actually uses the cutSource.
				if (usk.mixEffectKeyType === Enums.MixEffectKeyType.Luma) {
					inputs.add(usk.cutSource)
				}
			}
		})

	// DSKs only show up on ME 1,
	// so we only add them if that's the ME we are currently processing.
	if (meId === 0) {
		state.video.downstreamKeyers
			.filter((dsk) => {
				if (dsk) {
					if (mode === 'program') {
						return dsk.onAir || dsk.inTransition
					}

					if (!dsk.properties) {
						// Data isn't hydrated yet, we'll get 'em next time.
						return false
					}

					return dsk.properties.tie && !dsk.onAir
				} else {
					return false
				}
			})
			.forEach((dsk) => {
				if (dsk && dsk.sources) {
					inputs.add(dsk.sources.fillSource)
					inputs.add(dsk.sources.cutSource)
				}
			})
	}

	// Compute what sources are currently participating in a transition.
	const isTransitionInProgram = mode === 'program' && meRef.transitionPosition.inTransition
	const isTransitionInPreview =
		mode === 'preview' && meRef.transitionPreview && meRef.transitionPosition.handlePosition > 0
	if (isTransitionInProgram || isTransitionInPreview) {
		if (meRef.transitionProperties.selection.includes(Enums.TransitionSelection.Background)) {
			// Includes background
			inputs.add(meRef.previewInput)
		}

		// From here, what inputs are participating in the transition depends
		// on the transition style being used, so we handle each separately.
		switch (meRef.transitionProperties.style) {
			case Enums.TransitionStyle.DIP:
				if (meRef.transitionSettings.dip) {
					inputs.add(meRef.transitionSettings.dip.input)
				}
				break
			case Enums.TransitionStyle.DVE:
				if (meRef.transitionSettings.DVE) {
					switch (meRef.transitionSettings.DVE.style) {
						case Enums.DVEEffect.GraphicCCWSpin:
						case Enums.DVEEffect.GraphicCWSpin:
						case Enums.DVEEffect.GraphicLogoWipe: {
							inputs.add(meRef.transitionSettings.DVE.fillSource)
							if (meRef.transitionSettings.DVE.enableKey) {
								inputs.add(meRef.transitionSettings.DVE.keySource)
							}
							break
							// Anything not Graphic* do not use the sources
						}
					}
				}
				break
			case Enums.TransitionStyle.WIPE:
				if (meRef.transitionSettings.wipe && meRef.transitionSettings.wipe.borderWidth > 0) {
					inputs.add(meRef.transitionSettings.wipe.borderInput)
				}
				break
			case Enums.TransitionStyle.STING:
				if (meRef.transitionSettings.stinger) {
					const mediaPlayerIndex = meRef.transitionSettings.stinger.source
					const fillInputId = 3000 + mediaPlayerIndex * 10
					const keyInputId = fillInputId + 1
					inputs.add(fillInputId)
					inputs.add(keyInputId)
				}
				break
			default:
			// Do nothing.
			// This is the code path that MIX will take.
			// It's already handled above when we add the previewInput
			// to the activeInputs array.
		}
	}
}

/**
 * Emulates the ATEM's own tally logic as it appears
 * in the ATEM multiviewer.
 *
 * Useful for any code which needs a full list of all
 * sources present in Preview and/or Program.
 */
export function listVisibleInputs(mode: 'program' | 'preview', state: AtemState, me = 0): number[] {
	const inputs = new Set<number>()

	// Start with the basics: the surface level of what is in the target ME.
	_calcActiveMeInputs(inputs, mode, state, me)

	// Loop over the active input IDs we've found so far,
	// and check if any of them are SuperSources or other nested MEs.
	// If so, iterate through them and find out what they are showing.
	// Keep looping until we stop discovering new things.
	let lastSize: number
	let lastProcessed = 0
	do {
		// Only processes inputs we haven't already processed.
		// This is an important optimization because this function could potentially
		// be in a hot code path and get called many many times a second,
		// every time the ATEM's state updates.
		lastSize = inputs.size
		for (const inputId of Array.from(inputs).slice(lastProcessed)) {
			const input = state.inputs[inputId]
			if (!input) {
				// Data isn't hydrated yet, we'll get 'em next time.
				continue
			}
			const portType = input.internalPortType
			switch (portType) {
				case Enums.InternalPortType.SuperSource: {
					const ssrcId = inputId - 6000
					const ssrc = AtemStateUtil.getSuperSource(state, ssrcId)
					for (const box of ssrc.boxes) {
						if (box && box.enabled) {
							inputs.add(box.source)
						}
					}

					if (ssrc.properties) {
						inputs.add(ssrc.properties.artFillSource)
						if (ssrc.properties.artOption === Enums.SuperSourceArtOption.Foreground) {
							inputs.add(ssrc.properties.artCutSource)
						}
					}
					break
				}
				case Enums.InternalPortType.MEOutput: {
					const nestedMeId = (inputId - (inputId % 10) - 10000) / 10 - 1
					const nestedMeMode = (inputId - 10000) % 10 === 0 ? 'program' : 'preview'
					_calcActiveMeInputs(inputs, nestedMeMode, state, nestedMeId)
					break
				}
				default:
				// Do nothing.
			}
		}
		lastProcessed = lastSize - 1
	} while (inputs.size !== lastSize)

	// undefined sometimes sneaks its way in here.
	// Don't know why.
	return Array.from(inputs)
		.filter((i: unknown) => typeof i === 'number')
		.sort((a, b) => a - b)
}
