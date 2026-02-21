import { PropertyAliasResult, CommandTestConverterSet } from './index.spec.js'
import { UpstreamKeyerMaskSettings } from '../../state/video/upstreamKeyers.js'
import { Enums, Util } from '../../index.js'

export const DefaultCommandConverters: CommandTestConverterSet = {
	_ver: {
		idAliases: {},
		propertyAliases: {
			protocolVersion: (v: number): PropertyAliasResult => ({ val: v, name: 'version' }),
		},
	},
	_pin: {
		idAliases: {},
		propertyAliases: {
			name: (val: any): PropertyAliasResult => ({ val, name: 'productIdentifier' }),
		},
	},
	_SSC: {
		idAliases: {
			ssrcId: 'sSrcId',
		},
		propertyAliases: {
			boxes: (val: any): PropertyAliasResult => ({ val, name: 'boxCount' }),
		},
		customMutate: (val: Record<string, unknown>): any => {
			if (!('sSrcId' in val)) {
				val.sSrcId = 0
			}
			return val
		},
	},
	InPr: {
		idAliases: {},
		propertyAliases: {
			id: (val: any): PropertyAliasResult => ({ val, name: 'inputId' }),
		},
		customMutate: (props: Record<string, unknown>): any => {
			props.externalPorts = Util.getComponents(props.availableExternalPorts as any)
			delete props.availableExternalPorts
			return props
		},
	},
	SSBP: {
		idAliases: {
			boxId: 'boxIndex',
			ssrcId: 'sSrcId',
		},
		propertyAliases: {
			cropBottom: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			cropTop: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			cropLeft: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			cropRight: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			size: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			positionX: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100), name: 'x' }),
			positionY: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100), name: 'y' }),
			inputSource: (v: number): PropertyAliasResult => ({ val: v, name: 'source' }),
		},
		customMutate: (val: Record<string, unknown>): any => {
			if (!('sSrcId' in val)) {
				val.sSrcId = 0
			}
			return val
		},
	},
	CSBP: {
		idAliases: {
			boxId: 'boxIndex',
			ssrcId: 'sSrcId',
		},
		propertyAliases: {
			cropBottom: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			cropTop: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			cropLeft: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			cropRight: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			size: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			positionX: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100), name: 'x' }),
			positionY: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100), name: 'y' }),
			inputSource: (v: number): PropertyAliasResult => ({ val: v, name: 'source' }),
		},
	},
	SSrc: {
		idAliases: {},
		propertyAliases: {
			artClip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			artGain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderLightSourceAltitude: (v: number): PropertyAliasResult => ({ val: Math.round(v) }),
			borderLightSourceDirection: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderHue: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderInnerWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			borderLuma: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderOuterWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			borderSaturation: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderInnerSoftness: (v: number): PropertyAliasResult => ({ val: v }),
			borderOuterSoftness: (v: number): PropertyAliasResult => ({ val: v }),
			artFillInput: (v: number): PropertyAliasResult => ({ val: v, name: 'artFillSource' }),
			artKeyInput: (v: number): PropertyAliasResult => ({ val: v, name: 'artCutSource' }),
		},
		customMutate: (o: Record<string, unknown>): any => {
			return {
				properties: {
					artFillSource: o.artFillSource,
					artCutSource: o.artCutSource,
					artOption: o.artOption,
					artPreMultiplied: o.artPreMultiplied,
					artClip: o.artClip,
					artGain: o.artGain,
					artInvertKey: o.artInvertKey,
				},
				border: {
					borderEnabled: o.borderEnabled,
					borderBevel: o.borderBevel,
					borderOuterWidth: o.borderOuterWidth,
					borderInnerWidth: o.borderInnerWidth,
					borderOuterSoftness: o.borderOuterSoftness,
					borderInnerSoftness: o.borderInnerSoftness,
					borderBevelSoftness: o.borderBevelSoftness,
					borderBevelPosition: o.borderBevelPosition,
					borderHue: o.borderHue,
					borderSaturation: o.borderSaturation,
					borderLuma: o.borderLuma,
					borderLightSourceDirection: o.borderLightSourceDirection,
					borderLightSourceAltitude: o.borderLightSourceAltitude,
				},
			}
		},
	},
	CSSc: {
		idAliases: {
			ssrcId: 'sSrcId',
		},
		propertyAliases: {
			artClip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			artGain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderLightSourceAltitude: (v: number): PropertyAliasResult => ({ val: Math.round(v) }),
			borderLightSourceDirection: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderHue: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderInnerWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			borderLuma: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderOuterWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			borderSaturation: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	DskP: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {
			clip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			preMultipliedKey: (v: number): PropertyAliasResult => ({ val: v, name: 'preMultiply' }),
			maskLeft: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskRight: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskTop: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskBottom: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
		},
		customMutate: (obj: Record<string, unknown>): any => {
			obj['mask'] = {
				enabled: obj['maskEnabled'],
				top: obj['maskTop'],
				bottom: obj['maskBottom'],
				left: obj['maskLeft'],
				right: obj['maskRight'],
			}
			delete obj['maskEnabled']
			delete obj['maskTop']
			delete obj['maskBottom']
			delete obj['maskLeft']
			delete obj['maskRight']
			return obj
		},
	},
	CDsG: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {
			clip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			preMultipliedKey: (v: number): PropertyAliasResult => ({ val: v, name: 'preMultiply' }),
		},
	},
	DskS: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {},
	},
	DskB: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {},
	},
	DDsA: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {},
	},
	CDsT: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {},
	},
	CDsR: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {},
	},
	CDsL: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {},
	},
	CDsC: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {
			cutSource: (v: number): PropertyAliasResult => ({ val: v, name: 'input' }),
		},
	},
	CDsF: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {
			fillSource: (v: number): PropertyAliasResult => ({ val: v, name: 'input' }),
		},
	},
	CDsM: {
		idAliases: {
			downstreamKeyerId: 'index',
		},
		propertyAliases: {
			maskEnabled: (val: any): PropertyAliasResult => ({ val, name: 'enabled' }),
			maskLeft: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000), name: 'left' }),
			maskRight: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000), name: 'right' }),
			maskTop: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000), name: 'top' }),
			maskBottom: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000), name: 'bottom' }),
		},
	},
	AMIP: {
		idAliases: {
			index: 'index',
		},
		propertyAliases: {
			balance: (v: number): PropertyAliasResult => ({ val: Math.round(v) }),
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 }),
		},
		customMutate: (props: Record<string, unknown>): any => {
			delete props.indexOfSourceType
			return props
		},
		processDeserialized: (props: Record<string, unknown>): void => {
			props.gain = Math.round((props.gain as any) * 100) / 100
		},
	},
	CAMI: {
		idAliases: {
			index: 'index',
		},
		propertyAliases: {
			balance: (v: number): PropertyAliasResult => ({ val: Math.round(v * 200) / 200 }),
			// 'gain': (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 })
		},
	},
	AMMO: {
		idAliases: {},
		propertyAliases: {
			programOutFollowFadeToBlack: (val: any): PropertyAliasResult => ({ val, name: 'followFadeToBlack' }),
			balance: (v: number): PropertyAliasResult => ({ val: Math.round(v) }),
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 }),
		},
	},
	CAMm: {
		idAliases: {},
		propertyAliases: {
			dimLevel: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			// gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 })
		},
	},
	AMmO: {
		idAliases: {},
		propertyAliases: {
			dimLevel: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 }),
		},
	},
	CAMH: {
		idAliases: {},
		propertyAliases: {
			// gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 }),
			// programOutGain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 }),
			// talkbackGain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 }),
			// sidetoneGain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 })
		},
	},
	AMHP: {
		idAliases: {},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 }),
			programOutGain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 }),
			talkbackGain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 }),
			sidetoneGain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) / 100 }),
		},
	},
	_top: {
		idAliases: {},
		propertyAliases: {
			auxiliaries: (val: any): PropertyAliasResult => ({ val, name: 'auxilliaries' }),
			dVE: (val: any): PropertyAliasResult => ({ val, name: 'DVEs' }),
			hyperDecks: (val: any): PropertyAliasResult => ({ val, name: 'maxHyperdecks' }),
			mixEffectBlocks: (val: any): PropertyAliasResult => ({ val, name: 'mixEffects' }),
			serialPort: (val: any): PropertyAliasResult => ({ val, name: 'serialPorts' }),
			videoSources: (val: any): PropertyAliasResult => ({ val, name: 'sources' }),
			superSource: (val: any): PropertyAliasResult => ({ val, name: 'superSources' }),
		},
		customMutate: (props: Record<string, unknown>): any => {
			if (props.multiviewers === undefined) {
				props.multiviewers = -1
			}
			if (props.talkbackChannels === undefined) {
				props.talkbackChannels = 0
			}

			props.onlyConfigurableOutputs = props.onlyConfigurableOutputs || false
			props.advancedChromaKeyers = props.advancedChromaKeyers || false
			props.cameraControl = props.cameraControl || false
			return props
		},
	},
	_MeC: {
		idAliases: {
			index: 'index',
		},
		propertyAliases: {
			balance: (v: number): PropertyAliasResult => ({ val: Math.round(v * 200) / 200 }),
		},
	},
	FTCD: {
		idAliases: {},
		propertyAliases: {},
		customMutate: (obj: Record<string, unknown>): any => {
			delete obj['unknown']
			delete obj['test3']
			return obj
		},
	},
	FTFD: {
		idAliases: {},
		propertyAliases: {
			filename: (val: any): PropertyAliasResult => ({ val, name: 'fileName' }),
		},
	},
	Powr: {
		idAliases: {},
		propertyAliases: {},
		customMutate: (obj: Record<string, unknown>): any => {
			return [obj.pin1, obj.pin2]
		},
	},
	KePt: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			pattern: (val: any): PropertyAliasResult => ({ val, name: 'style' }),
			inverse: (val: any): PropertyAliasResult => ({ val, name: 'invert' }),
			size: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			softness: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			symmetry: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			xPosition: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000), name: 'positionX' }),
			yPosition: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000), name: 'positionY' }),
		},
	},
	CKPt: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			pattern: (val: any): PropertyAliasResult => ({ val, name: 'style' }),
			inverse: (val: any): PropertyAliasResult => ({ val, name: 'invert' }),
			size: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			softness: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			symmetry: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			xPosition: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000), name: 'positionX' }),
			yPosition: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000), name: 'positionY' }),
		},
	},
	KeCk: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			hue: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			lift: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			ySuppress: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	CKCk: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			hue: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			lift: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			ySuppress: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	CKTp: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			keyType: (v: number): PropertyAliasResult => ({ val: v, name: 'mixEffectKeyType' }),
		},
	},
	KeOn: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {},
	},
	CKOn: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {},
	},
	CKeF: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {},
	},
	KeLm: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			clip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	CKLm: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			clip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	KeBP: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			// 'upstreamKeyerId': 'keyerIndex'
		},
		propertyAliases: {
			keyerIndex: (val: any): PropertyAliasResult => ({ val, name: 'upstreamKeyerId' }),
			keyType: (val: any): PropertyAliasResult => ({ val, name: 'mixEffectKeyType' }),
			maskSettings: (v: UpstreamKeyerMaskSettings): PropertyAliasResult => ({
				val: {
					maskLeft: Math.round(v.maskLeft * 1000),
					maskRight: Math.round(v.maskRight * 1000),
					maskTop: Math.round(v.maskTop * 1000),
					maskBottom: Math.round(v.maskBottom * 1000),
				},
			}),
			maskEnabled: (v: boolean): PropertyAliasResult => ({ val: v, name: 'maskSettings.maskEnabled' }),
			maskLeft: (v: number): PropertyAliasResult => ({
				val: Math.round(v * 1000),
				name: 'maskSettings.maskLeft',
			}),
			maskRight: (v: number): PropertyAliasResult => ({
				val: Math.round(v * 1000),
				name: 'maskSettings.maskRight',
			}),
			maskTop: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000), name: 'maskSettings.maskTop' }),
			maskBottom: (v: number): PropertyAliasResult => ({
				val: Math.round(v * 1000),
				name: 'maskSettings.maskBottom',
			}),
		},
	},
	KeFS: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {},
	},
	RFlK: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			keyFrame: (v: number): PropertyAliasResult => ({ val: v, name: 'keyFrameId' }),
			runToInfinite: (v: number): PropertyAliasResult => ({ val: v, name: 'direction' }),
		},
	},
	KeDV: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			positionX: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			positionY: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			sizeX: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			sizeY: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			rotation: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderHue: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderInnerWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			borderLuma: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderOuterWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			borderSaturation: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			lightSourceDirection: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderShadowEnabled: (val: any): PropertyAliasResult => ({ val, name: 'shadowEnabled' }),
			maskLeft: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskRight: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskTop: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskBottom: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
		},
	},
	CKDV: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			positionX: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			positionY: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			sizeX: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			sizeY: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			rotation: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderHue: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderInnerWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			borderLuma: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderOuterWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			borderSaturation: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			lightSourceDirection: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			borderShadowEnabled: (val: any): PropertyAliasResult => ({ val, name: 'shadowEnabled' }),
			maskLeft: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskRight: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskTop: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskBottom: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
		},
	},
	CKeC: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {},
	},
	CKMs: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			maskLeft: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskRight: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskTop: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			maskBottom: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
		},
	},
	TDvP: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			clip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	CTDv: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			clip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	TStP: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			clip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	CTSt: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			clip: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	TrPr: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			previewTransition: (val: any): PropertyAliasResult => ({ val, name: 'preview' }),
		},
	},
	CTPr: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			previewTransition: (val: any): PropertyAliasResult => ({ val, name: 'preview' }),
		},
	},
	TrSS: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			selection: (val: any): PropertyAliasResult => ({ val: Util.getComponents(val) }),
			nextSelection: (val: any): PropertyAliasResult => ({ val: Util.getComponents(val) }),
		},
	},
	CTTp: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			nextSelection: (val: any): PropertyAliasResult => ({ val: Util.getComponents(val) }),
		},
	},
	TMxP: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	CTMx: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	TDpP: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	CTDp: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	TWpP: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			symmetry: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			xPosition: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
			yPosition: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
			borderSoftness: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			borderWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
		},
	},
	CTWp: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			symmetry: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			xPosition: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
			yPosition: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
			borderSoftness: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			borderWidth: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
		},
	},
	TrPs: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			handlePosition: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
		},
	},
	CTPs: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {
			handlePosition: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
		},
	},
	MRPr: {
		idAliases: {},
		propertyAliases: {
			index: (val: any): PropertyAliasResult => ({ val, name: 'macroIndex' }),
		},
	},
	MRcS: {
		idAliases: {},
		propertyAliases: {
			index: (val: any): PropertyAliasResult => ({ val, name: 'macroIndex' }),
		},
	},
	MSRc: {
		idAliases: {
			index: 'index',
		},
		propertyAliases: {},
	},
	CMPr: {
		idAliases: {
			macroIndex: 'index',
		},
		propertyAliases: {},
	},
	MvIn: {
		idAliases: {
			multiViewerId: 'multiviewIndex',
		},
		propertyAliases: {
			supportVuMeter: (val: any): PropertyAliasResult => ({ val, name: 'supportsVuMeter' }),
		},
	},
	CMvI: {
		idAliases: {
			multiViewerId: 'multiviewIndex',
		},
		propertyAliases: {},
	},
	VidM: {
		idAliases: {},
		propertyAliases: {
			videoMode: (val: any): PropertyAliasResult => ({ val, name: 'mode' }),
		},
	},
	CVdM: {
		idAliases: {},
		propertyAliases: {
			videoMode: (val: any): PropertyAliasResult => ({ val, name: 'mode' }),
		},
	},
	RCPS: {
		idAliases: {
			mediaPlayerId: 'index',
		},
		propertyAliases: {},
	},
	SCPS: {
		idAliases: {
			mediaPlayerId: 'index',
		},
		propertyAliases: {},
	},
	MPCS: {
		idAliases: {
			clipId: 'index',
		},
		propertyAliases: {},
	},
	SMPC: {
		idAliases: {
			// 'mediaPool': 'index'
		},
		propertyAliases: {},
	},
	MPfe: {
		idAliases: {
			mediaPool: 'bank',
			frameIndex: 'index',
		},
		propertyAliases: {
			filename: (val: any): PropertyAliasResult => ({ val, name: 'fileName' }),
		},
	},
	MPrp: {
		idAliases: {
			macroIndex: 'index',
		},
		propertyAliases: {
			// index: (val: any): PropertyAliasResult => ({ val, name: 'macroIndex' })
		},
	},
	PrgI: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	CPgI: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	PrvI: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	CPvI: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	DCut: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	DAut: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	FtbS: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	FtbC: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	FtbA: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	FtbP: {
		idAliases: {
			mixEffect: 'index',
		},
		propertyAliases: {},
	},
	AuxS: {
		idAliases: {
			auxBus: 'id',
		},
		propertyAliases: {},
	},
	CAuS: {
		idAliases: {
			auxBus: 'id',
		},
		propertyAliases: {},
	},
	CInL: {
		idAliases: {
			inputId: 'id',
		},
		propertyAliases: {},
	},
	MAct: {
		idAliases: {
			index: 'index',
		},
		propertyAliases: {},
	},
	FTDa: {
		idAliases: {},
		propertyAliases: {
			body: (v: string): PropertyAliasResult => ({ val: Buffer.from(v, 'base64') }),
		},
		customMutate: (obj: Record<string, unknown>): any => {
			obj.size = (obj.body as any).length
			return obj
		},
	},
	KKFP: {
		idAliases: {
			upstreamKeyerId: 'keyerIndex',
			mixEffect: 'mixEffectIndex',
			keyFrameId: 'keyFrame',
		},
		propertyAliases: {
			bevelPosition: (val: any): PropertyAliasResult => ({ val, name: 'borderBevelPosition' }),
			bevelSoftness: (val: any): PropertyAliasResult => ({ val, name: 'borderBevelSoftness' }),
			innerSoftness: (val: any): PropertyAliasResult => ({ val, name: 'borderInnerSoftness' }),
			innerWidth: (val: any): PropertyAliasResult => ({ val: Math.round(val * 100), name: 'borderInnerWidth' }),
			outerSoftness: (val: any): PropertyAliasResult => ({ val, name: 'borderOuterSoftness' }),
			outerWidth: (val: any): PropertyAliasResult => ({ val: Math.round(val * 100), name: 'borderOuterWidth' }),
			positionX: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			sizeX: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			positionY: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			sizeY: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			rotation: (val: any): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			borderHue: (val: any): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			borderLuma: (val: any): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			borderSaturation: (val: any): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			lightSourceDirection: (val: any): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			maskBottom: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			maskTop: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			maskLeft: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			maskRight: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
		},
		customMutate: (obj: Record<string, unknown>): any => {
			delete obj.maskEnabled
			return obj
		},
	},
	CKFP: {
		idAliases: {
			upstreamKeyerId: 'keyerIndex',
			mixEffect: 'mixEffectIndex',
			keyFrameId: 'keyFrame',
		},
		propertyAliases: {
			bevelPosition: (val: any): PropertyAliasResult => ({ val, name: 'borderBevelPosition' }),
			bevelSoftness: (val: any): PropertyAliasResult => ({ val, name: 'borderBevelSoftness' }),
			innerSoftness: (val: any): PropertyAliasResult => ({ val, name: 'borderInnerSoftness' }),
			innerWidth: (val: any): PropertyAliasResult => ({ val: Math.round(val * 100), name: 'borderInnerWidth' }),
			outerSoftness: (val: any): PropertyAliasResult => ({ val, name: 'borderOuterSoftness' }),
			outerWidth: (val: any): PropertyAliasResult => ({ val: Math.round(val * 100), name: 'borderOuterWidth' }),
			positionX: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			sizeX: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			positionY: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			sizeY: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			rotation: (val: any): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			borderHue: (val: any): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			borderLuma: (val: any): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			borderSaturation: (val: any): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			lightSourceDirection: (val: any): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			maskBottom: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			maskTop: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			maskLeft: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			maskRight: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
		},
	},
	SFKF: {
		idAliases: {
			upstreamKeyerId: 'keyerIndex',
			mixEffect: 'mixEffectIndex',
			keyFrameId: 'keyFrame',
		},
		propertyAliases: {},
	},
	MPCE: {
		idAliases: {
			mediaPlayerId: 'index',
		},
		propertyAliases: {},
		customMutate: (obj: Record<string, unknown>): any => {
			obj.clipIndex = 0
			obj.stillIndex = 0
			if (obj.sourceType === 1) {
				obj.stillIndex = obj.sourceIndex
			} else {
				obj.clipIndex = obj.sourceIndex
			}
			delete obj.sourceIndex
			return obj
		},
	},
	MPSS: {
		idAliases: {
			mediaPlayerId: 'index',
		},
		propertyAliases: {},
	},
	Time: {
		idAliases: {},
		propertyAliases: {
			isDropFrame: (val): PropertyAliasResult => ({ val, name: 'dropFrame' }),
		},
	},
	FAIP: {
		idAliases: {
			index: 'index',
		},
		propertyAliases: {
			supportedConfigurations: (val: number): PropertyAliasResult => ({ val: Util.getComponents(val) }),
		},
		customMutate: (props: Record<string, unknown>): any => {
			props.activeInputLevel = props.rcaToXlrEnabled
				? Enums.FairlightAnalogInputLevel.ProLine
				: Enums.FairlightAnalogInputLevel.Microphone
			delete props.rcaToXlrEnabled

			props.supportedInputLevels = props.supportsRcaToXlr
				? [Enums.FairlightAnalogInputLevel.ProLine, Enums.FairlightAnalogInputLevel.Microphone]
				: []
			delete props.supportsRcaToXlr

			return props
		},
	},
	CFIP: {
		idAliases: {
			index: 'index',
		},
		propertyAliases: {},
	},
	FASD: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
		},
	},
	FASP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
			balance: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			gain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			equalizerGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			faderGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			makeUpGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			stereoSimulation: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			supportedMixOptions: (val: number): PropertyAliasResult => ({ val: Util.getComponents(val) }),
			equalizerBands: (val: number): PropertyAliasResult => ({ val, name: 'bandCount' }),
		},
	},
	CFSP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
			balance: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			gain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			equalizerGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			faderGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			makeUpGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			stereoSimulation: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			supportedMixOptions: (val: number): PropertyAliasResult => ({ val: Util.getComponents(val) }),
		},
	},
	FAMP: {
		idAliases: {},
		propertyAliases: {
			equalizerGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			gain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100), name: 'faderGain' }),
			makeUpGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			equalizerBands: (val: number): PropertyAliasResult => ({ val, name: 'bandCount' }),
		},
	},
	CFMP: {
		idAliases: {},
		propertyAliases: {
			equalizerGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			gain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100), name: 'faderGain' }),
			makeUpGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	FMPP: {
		idAliases: {},
		propertyAliases: {
			audioFollowVideoCrossfadeTransitionEnabled: (val: number): PropertyAliasResult => ({
				val,
				name: 'audioFollowVideo',
			}),
		},
	},
	CMPP: {
		idAliases: {},
		propertyAliases: {
			audioFollowVideoCrossfadeTransitionEnabled: (val: number): PropertyAliasResult => ({
				val,
				name: 'audioFollowVideo',
			}),
		},
	},
	FMHP: {
		idAliases: {},
		propertyAliases: {
			gain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputMasterGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputSidetoneGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputTalkbackGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputMasterEnabled: (val: boolean): PropertyAliasResult => ({ val: !val, name: 'inputMasterMuted' }),
		},
		processDeserialized: (v) => {
			delete v.inputTalkbackMuted
			return v
		},
	},
	CFMH: {
		idAliases: {},
		propertyAliases: {
			gain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputMasterGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputSidetoneGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputTalkbackGain: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputMasterEnabled: (val: boolean): PropertyAliasResult => ({ val: !val, name: 'inputMasterMuted' }),
			inputTalkbackEnabled: (val: boolean): PropertyAliasResult => ({ val: !val, name: 'inputTalkbackMuted' }),
		},
	},
	MOCP: {
		idAliases: {},
		propertyAliases: {
			threshold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			ratio: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			attack: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			hold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			release: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	CMCP: {
		idAliases: {},
		propertyAliases: {
			threshold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			ratio: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			attack: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			hold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			release: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	AICP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
			threshold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			ratio: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			attack: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			hold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			release: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	CICP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
			threshold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			ratio: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			attack: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			hold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			release: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	AMLP: {
		idAliases: {},
		propertyAliases: {
			threshold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			attack: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			hold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			release: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	CMLP: {
		idAliases: {},
		propertyAliases: {
			threshold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			attack: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			hold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			release: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	AILP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
			threshold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			attack: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			hold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			release: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	CILP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
			threshold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			attack: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			hold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			release: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	AIXP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
			threshold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			attack: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			hold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			release: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			ratio: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			range: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	CIXP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
			threshold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			attack: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			hold: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			release: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			ratio: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			range: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	RICD: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
		},
	},
	RICE: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
		},
	},
	RFIP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
		},
	},
	AEBP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
			band: 'band',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			qFactor: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			supportedFrequencyRanges: (v: number): PropertyAliasResult => ({ val: Util.getComponents(v) }),
			supportedShapes: (v: number): PropertyAliasResult => ({ val: Util.getComponents(v) }),
		},
	},
	CEBP: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
			band: 'band',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			qFactor: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
		},
	},
	ColV: {
		idAliases: {
			index: 'index',
		},
		propertyAliases: {
			hue: (val: number): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			saturation: (val: number): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			luma: (val: number): PropertyAliasResult => ({ val: Math.round(val * 10) }),
		},
	},
	CClV: {
		idAliases: {
			index: 'index',
		},
		propertyAliases: {
			hue: (val: number): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			saturation: (val: number): PropertyAliasResult => ({ val: Math.round(val * 10) }),
			luma: (val: number): PropertyAliasResult => ({ val: Math.round(val * 10) }),
		},
	},
	VuMo: {
		idAliases: {
			multiViewerId: 'multiviewIndex',
		},
		propertyAliases: {
			opacity: (val: number): PropertyAliasResult => ({ val: Math.round(val) }),
		},
	},
	VuMS: {
		idAliases: {
			multiViewerId: 'multiviewIndex',
			windowIndex: 'windowIndex',
		},
		propertyAliases: {},
	},
	VuMC: {
		idAliases: {
			multiViewerId: 'multiviewIndex',
			windowIndex: 'windowIndex',
		},
		propertyAliases: {},
	},
	RACK: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {},
	},
	CACK: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			backgroundLevel: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			foregroundLevel: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			keyEdge: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			spillSuppression: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			flareSuppression: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			brightness: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			contrast: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			saturation: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			red: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			green: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			blue: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	KACk: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			backgroundLevel: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			foregroundLevel: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			keyEdge: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			spillSuppression: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			flareSuppression: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			brightness: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			contrast: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			saturation: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			red: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			green: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
			blue: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10) }),
		},
	},
	KACC: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			sampledY: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
			sampledCb: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
			sampledCr: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
			cursorSize: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			cursorX: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			cursorY: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
		},
	},
	CACC: {
		idAliases: {
			mixEffect: 'mixEffectIndex',
			upstreamKeyerId: 'keyerIndex',
		},
		propertyAliases: {
			sampledY: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
			sampledCb: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
			sampledCr: (v: number): PropertyAliasResult => ({ val: Math.round(v * 10000) }),
			cursorSize: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			cursorX: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
			cursorY: (v: number): PropertyAliasResult => ({ val: Math.round(v * 1000) }),
		},
	},
	AMBP: {
		idAliases: {
			band: 'band',
		},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			qFactor: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			supportedFrequencyRanges: (v: number): PropertyAliasResult => ({ val: Util.getComponents(v) }),
			supportedShapes: (v: number): PropertyAliasResult => ({ val: Util.getComponents(v) }),
		},
	},
	CMBP: {
		idAliases: {
			band: 'band',
		},
		propertyAliases: {
			gain: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
			qFactor: (v: number): PropertyAliasResult => ({ val: Math.round(v * 100) }),
		},
	},
	DCPC: {
		idAliases: {},
		propertyAliases: {
			positionX: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			positionY: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			startFrom: (val: any): PropertyAliasResult => ({
				val: { hours: val.Hour, minutes: val.Minute, seconds: val.Second, frames: val.Frame },
			}),
		},
	},
	DCPV: {
		idAliases: {},
		propertyAliases: {
			positionX: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			positionY: (val: any): PropertyAliasResult => ({ val: Math.round(val * 1000) }),
			startFrom: (val: any): PropertyAliasResult => ({
				val: { hours: val.Hour, minutes: val.Minute, seconds: val.Second, frames: val.Frame },
			}),
		},
	},
	DSTV: {
		idAliases: {},
		propertyAliases: {
			time: (val: any): PropertyAliasResult => ({
				val: { hours: val.Hour, minutes: val.Minute, seconds: val.Second, frames: val.Frame },
			}),
		},
	},
	FDLv: {
		idAliases: {},
		propertyAliases: {
			inputLeftLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputRightLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputLeftPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputRightPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),

			compressorGainReduction: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			limiterGainReduction: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),

			outputLeftLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			outputRightLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			outputLeftPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			outputRightPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),

			leftLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			rightLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			leftPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			rightPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	FMLv: {
		idAliases: {
			index: 'index',
			source: 'sourceId',
		},
		propertyAliases: {
			sourceId: (val): PropertyAliasResult => ({ val: BigInt(val), name: 'sourceId' }),

			inputLeftLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputRightLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputLeftPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			inputRightPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),

			expanderGainReduction: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			compressorGainReduction: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			limiterGainReduction: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),

			outputLeftLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			outputRightLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			outputLeftPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			outputRightPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),

			leftLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			rightLevel: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			leftPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
			rightPeak: (val: number): PropertyAliasResult => ({ val: Math.round(val * 100) }),
		},
	},
	CCmd: {
		idAliases: {
			source: 'input',
			category: 'category',
			parameter: 'parameter',
		},
		propertyAliases: {},
		customMutate: (cmd) => {
			return {
				input: cmd.input,
				category: cmd.category,
				parameter: cmd.parameter,
				relative: cmd.relative,

				type: cmd.type,
				stringData: cmd.stringData,
				boolData: cmd.boolData,
				numberData: cmd.intData || cmd.floatData,
				bigintData: cmd.longData?.map((v: string) => BigInt(v)),
			}
		},
	},
	CCdP: {
		idAliases: {
			source: 'input',
			category: 'category',
			parameter: 'parameter',
		},
		propertyAliases: {},
		customMutate: (cmd) => {
			return {
				input: cmd.input,
				category: cmd.category,
				parameter: cmd.parameter,
				periodicFlushEnabled: cmd.periodicFlushEnabled,

				type: cmd.type,
				stringData: cmd.stringData || '',
				boolData: cmd.boolData || [],
				numberData: (cmd.intData || cmd.floatData || []).map((v: number) => Number(v) + 0),
				bigintData: (cmd.longData || []).map((v: string) => BigInt(v)),
			}
		},
	},
	ARSC: {
		idAliases: {
			id: 'id',
		},
		propertyAliases: {},
	},
	ARSP: {
		idAliases: {
			id: 'id',
		},
		propertyAliases: {
			audioInputId: (v: number): PropertyAliasResult => ({ val: v, name: 'audioSourceId' }),
		},
	},
	AROC: {
		idAliases: {
			id: 'id',
		},
		propertyAliases: {},
	},
	AROP: {
		idAliases: {
			id: 'id',
		},
		propertyAliases: {},
	},
	ISOi: {
		idAliases: {},
		propertyAliases: {
			iSORecordAllInputs: (val) => ({ val, name: 'recordAllInputs' }),
		},
	},
}
