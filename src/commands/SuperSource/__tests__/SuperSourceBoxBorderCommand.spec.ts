import { SuperSourceBoxBorderCommand } from '../SuperSourceBoxBorderCommand'
import { AtemStateUtil } from '../../../state'
import { BorderBevel } from '../../../enums'

// Modeled on real captures from an ATEM 4 M/E Constellation HD (model 20):
// box 0 of SuperSource 0, border enabled, hue/saturation/luma at their
// observed defaults (0x50/0x1e/1000), outer/inner width both at minimum.
const rawBox0 = Buffer.from('000001010000000000000000000000000050001e03e80000', 'hex')

describe('SuperSourceBoxBorderCommand', () => {
	test('deserializes the known fields', () => {
		const cmd = SuperSourceBoxBorderCommand.deserialize(rawBox0)

		expect(cmd.properties.ssrcId).toEqual(0)
		expect(cmd.properties.boxId).toEqual(0)
		expect(cmd.properties.border.borderEnabled).toEqual(true)
		expect(cmd.properties.border.borderOuterWidth).toEqual(0)
		expect(cmd.properties.border.borderInnerWidth).toEqual(0)
		expect(cmd.properties.border.borderHue).toEqual(0x0050)
		expect(cmd.properties.border.borderSaturation).toEqual(0x001e)
		expect(cmd.properties.border.borderLuma).toEqual(1000)
	})

	test('rescales outer/inner width from the full u16 range to the 0-1600 convention', () => {
		// bytes 4-7 & 8-15 at 0xffff === the observed maximum (16.00)
		const raw = Buffer.from('00000101ffffffffffffffffffffffff0050001e03e80000', 'hex')
		const cmd = SuperSourceBoxBorderCommand.deserialize(raw)

		expect(cmd.properties.border.borderOuterWidth).toEqual(1600)
		expect(cmd.properties.border.borderInnerWidth).toEqual(1600)
	})

	test('applyToState fills in unknown fields with neutral defaults on first update', () => {
		const state = AtemStateUtil.Create()
		state.info.capabilities = {
			mixEffects: 1,
			sources: 1,
			downstreamKeyers: 1,
			auxilliaries: 1,
			mixMinusOutputs: 1,
			mediaPlayers: 1,
			serialPorts: 1,
			maxHyperdecks: 1,
			DVEs: 1,
			stingers: 1,
			superSources: 1,
			talkbackChannels: 1,
			cameraControl: false,
			advancedChromaKeyers: false,
			onlyConfigurableOutputs: false,
		}

		const cmd = SuperSourceBoxBorderCommand.deserialize(rawBox0)
		cmd.applyToState(state)

		const border = AtemStateUtil.getSuperSource(state, 0).border
		expect(border).toBeDefined()
		expect(border?.borderEnabled).toEqual(true)
		expect(border?.borderHue).toEqual(0x0050)
		// fields never carried by this packet fall back to a neutral default
		expect(border?.borderBevel).toEqual(BorderBevel.None)
		expect(border?.borderOuterSoftness).toEqual(0)
		expect(border?.borderLightSourceAltitude).toEqual(0)
	})

	test('applyToState preserves previously known unrelated fields instead of clobbering them', () => {
		const state = AtemStateUtil.Create()
		state.info.capabilities = {
			mixEffects: 1,
			sources: 1,
			downstreamKeyers: 1,
			auxilliaries: 1,
			mixMinusOutputs: 1,
			mediaPlayers: 1,
			serialPorts: 1,
			maxHyperdecks: 1,
			DVEs: 1,
			stingers: 1,
			superSources: 1,
			talkbackChannels: 1,
			cameraControl: false,
			advancedChromaKeyers: false,
			onlyConfigurableOutputs: false,
		}

		const supersource = AtemStateUtil.getSuperSource(state, 0)
		supersource.border = {
			borderEnabled: false,
			borderBevel: BorderBevel.InOut,
			borderOuterWidth: 0,
			borderInnerWidth: 0,
			borderOuterSoftness: 42,
			borderInnerSoftness: 0,
			borderBevelSoftness: 0,
			borderBevelPosition: 0,
			borderHue: 0,
			borderSaturation: 0,
			borderLuma: 0,
			borderLightSourceDirection: 0,
			borderLightSourceAltitude: 0,
		}

		SuperSourceBoxBorderCommand.deserialize(rawBox0).applyToState(state)

		const border = AtemStateUtil.getSuperSource(state, 0).border
		// carried by SSSB: overwritten with the fresh value
		expect(border?.borderEnabled).toEqual(true)
		expect(border?.borderHue).toEqual(0x0050)
		// not carried by SSSB: preserved from before
		expect(border?.borderBevel).toEqual(BorderBevel.InOut)
		expect(border?.borderOuterSoftness).toEqual(42)
	})
})
