import * as Enum from '../../enums'

export interface SuperSourceBox {
	enabled: boolean
	source: number
	x: number
	y: number
	size: number
	cropped: boolean
	cropTop: number
	cropBottom: number
	cropLeft: number
	cropRight: number
}

export interface SuperSourceProperties {
	artFillSource: number
	artCutSource: number
	artOption: Enum.SuperSourceArtOption
	artPreMultiplied: boolean
	artClip: number
	artGain: number
	artInvertKey: boolean
}

/**
 * Per-SuperSource border, used by ATEM models older than the Constellation HD
 * range. Newer units (Constellation HD and up, firmware 9.6.0+) instead use the
 * per-box {@link SuperSourceBoxBorder}.
 */
export interface SuperSourceBorder {
	borderEnabled: boolean
	borderBevel: Enum.BorderBevel
	borderOuterWidth: number
	borderInnerWidth: number
	borderOuterSoftness: number
	borderInnerSoftness: number
	borderBevelSoftness: number
	borderBevelPosition: number
	borderHue: number
	borderSaturation: number
	borderLuma: number
	borderLightSourceDirection: number
	borderLightSourceAltitude: number
}

/**
 * Per-box SuperSource border of the ATEM Constellation HD range and newer
 * (firmware 9.6.0+). Unlike the older-model {@link SuperSourceBorder}, it has
 * six independent width fields and no bevel/softness/light-source controls.
 */
export interface SuperSourceBoxBorder {
	borderEnabled: boolean
	borderWidthOutHorizontal: number
	borderWidthOutVertical: number
	borderWidthInLeft: number
	borderWidthInRight: number
	borderWidthInTop: number
	borderWidthInBottom: number
	borderHue: number
	borderSaturation: number
	borderLuma: number
}

export interface SuperSource {
	readonly index: number
	readonly boxes: [
		SuperSourceBox | undefined,
		SuperSourceBox | undefined,
		SuperSourceBox | undefined,
		SuperSourceBox | undefined
	]
	properties?: SuperSourceProperties
	border?: SuperSourceBorder
}
