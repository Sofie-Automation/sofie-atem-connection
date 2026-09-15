import { PropertyAliasResult, CommandTestConverterSet } from './index.spec'
import { Util } from '../..'

export const V8_0CommandConverters: CommandTestConverterSet = {
	SSrc: {
		idAliases: {
			ssrcId: 'sSrcId',
		},
		propertyAliases: {
			artClip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			artGain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			artFillInput: (v: number): PropertyAliasResult => ({ val: v, name: 'artFillSource' }),
			artKeyInput: (v: number): PropertyAliasResult => ({ val: v, name: 'artCutSource' }),
		},
	},
	SSBd: {
		idAliases: {
			ssrcId: 'sSrcId',
		},
		propertyAliases: {
			lightSourceAltitude: (v: number): PropertyAliasResult => ({
				val: Math.round(v),
				name: 'borderLightSourceAltitude',
			}),
			lightSourceDirection: (v: number): PropertyAliasResult => ({
				val: Math.round(v * 10),
				name: 'borderLightSourceDirection',
			}),
			hue: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10), name: 'borderHue' }),
			innerWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100), name: 'borderInnerWidth' }),
			luma: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10), name: 'borderLuma' }),
			outerWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100), name: 'borderOuterWidth' }),
			saturation: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10), name: 'borderSaturation' }),
			enabled: (val): PropertyAliasResult => ({ val, name: 'borderEnabled' }),
			bevel: (val): PropertyAliasResult => ({ val, name: 'borderBevel' }),
			outerSoftness: (val): PropertyAliasResult => ({ val, name: 'borderOuterSoftness' }),
			innerSoftness: (val): PropertyAliasResult => ({ val, name: 'borderInnerSoftness' }),
			bevelPosition: (val): PropertyAliasResult => ({ val, name: 'borderBevelPosition' }),
			bevelSoftness: (val): PropertyAliasResult => ({ val, name: 'borderBevelSoftness' }),
		},
	},
	CSBd: {
		idAliases: {
			ssrcId: 'sSrcId',
		},
		propertyAliases: {
			lightSourceAltitude: (v: number): PropertyAliasResult => ({
				val: Math.round(v),
				name: 'borderLightSourceAltitude',
			}),
			lightSourceDirection: (v: number): PropertyAliasResult => ({
				val: Math.round(v * 10),
				name: 'borderLightSourceDirection',
			}),
			hue: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10), name: 'borderHue' }),
			innerWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100), name: 'borderInnerWidth' }),
			luma: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10), name: 'borderLuma' }),
			outerWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100), name: 'borderOuterWidth' }),
			saturation: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10), name: 'borderSaturation' }),
			enabled: (val): PropertyAliasResult => ({ val, name: 'borderEnabled' }),
			bevel: (val): PropertyAliasResult => ({ val, name: 'borderBevel' }),
			outerSoftness: (val): PropertyAliasResult => ({ val, name: 'borderOuterSoftness' }),
			innerSoftness: (val): PropertyAliasResult => ({ val, name: 'borderInnerSoftness' }),
			bevelPosition: (val): PropertyAliasResult => ({ val, name: 'borderBevelPosition' }),
			bevelSoftness: (val): PropertyAliasResult => ({ val, name: 'borderBevelSoftness' }),
		},
	},
	StRS: {
		idAliases: {},
		propertyAliases: {
			status: (val): PropertyAliasResult => ({ val, name: 'state' }),
		},
	},
	StrR: {
		idAliases: {},
		propertyAliases: {
			isStreaming: (val): PropertyAliasResult => ({ val, name: 'streaming' }),
		},
	},
	SRST: {
		idAliases: {},
		propertyAliases: {
			hour: (val): PropertyAliasResult => ({ val, name: 'hours' }),
			minute: (val): PropertyAliasResult => ({ val, name: 'minutes' }),
			second: (val): PropertyAliasResult => ({ val, name: 'seconds' }),
			frame: (val): PropertyAliasResult => ({ val, name: 'frames' }),
		},
	},
	RTMR: {
		idAliases: {},
		propertyAliases: {
			hour: (val): PropertyAliasResult => ({ val, name: 'hours' }),
			minute: (val): PropertyAliasResult => ({ val, name: 'minutes' }),
			second: (val): PropertyAliasResult => ({ val, name: 'seconds' }),
			frame: (val): PropertyAliasResult => ({ val, name: 'frames' }),
		},
	},
	RcTM: {
		idAliases: {},
		propertyAliases: {
			isRecording: (val): PropertyAliasResult => ({ val, name: 'recording' }),
		},
	},
	RTMS: {
		idAliases: {},
		propertyAliases: {
			status: (val): PropertyAliasResult => ({ val, name: 'state' }),
			totalRecordingTimeAvailable: (val): PropertyAliasResult => ({ val, name: 'recordingTimeAvailable' }),
		},
	},
	FAIP: {
		idAliases: {
			index: 'index',
		},
		propertyAliases: {
			supportedConfigurations: (val: number): PropertyAliasResult => ({ val: Util.getComponents(val) }),
			supportedInputLevels: (val: number): PropertyAliasResult => ({ val: Util.getComponents(val) }),
		},
	},
	CMvP: {
		idAliases: {
			multiViewerId: 'multiviewIndex',
		},
		propertyAliases: {},
	},
	MvPr: {
		idAliases: {
			multiViewerId: 'multiviewIndex',
		},
		propertyAliases: {},
	},
	SaMw: {
		idAliases: {
			multiViewerId: 'multiviewIndex',
			windowIndex: 'windowIndex',
		},
		propertyAliases: {},
	},
	_MvC: {
		idAliases: {},
		propertyAliases: {},
		customMutate: (props: Record<string, unknown>): any => {
			if (props.count === undefined) {
				// From v8.1.1 the count comes from _top instead
				props.count = -1
			}
			if (props.canChangeLayout === undefined) {
				// LibAtem does not parse this for v8.0, but always serializes it as 0
				props.canChangeLayout = false
			}
			return props
		},
	},
}
