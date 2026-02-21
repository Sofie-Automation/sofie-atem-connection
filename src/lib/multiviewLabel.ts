import { FontFace, NewMemoryFace } from '@julusian/freetype2'
import { Model, VideoFormat, VideoMode } from '../enums/index.js'
import { AtemState } from '../state/index.js'
import { getVideoModeInfo } from './videoMode.js'
import { readFile } from 'fs/promises'
import path = require('path')

/**
 * Colour lookup table for converting 8bit grey to the atem encoding
 * Note: not every colour is available, so values have been extrapolated to fill in the gaps.
 * Also the background colour has been filled in for lower values, to ensure that the text doesnt accidentally remove the background
 */
const colourLookupTable = [
	14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14,
	14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 29, 85, 132, 17, 30, 30, 96, 136, 136, 186, 101, 101, 13, 19, 19, 72,
	217, 217, 124, 130, 123, 47, 28, 51, 32, 192, 166, 56, 167, 193, 189, 172, 198, 198, 41, 41, 154, 81, 109, 109, 199,
	60, 108, 37, 12, 12, 15, 153, 142, 142, 68, 35, 35, 173, 141, 197, 197, 144, 94, 94, 116, 42, 214, 214, 40, 46, 46,
	184, 181, 127, 127, 175, 31, 31, 150, 213, 73, 95, 86, 191, 191, 117, 135, 135, 208, 22, 78, 78, 107, 179, 179, 210,
	119, 58, 58, 67, 209, 209, 171, 110, 89, 89, 103, 133, 43, 202, 137, 66, 66, 39, 151, 129, 71, 200, 200, 26, 111,
	128, 16, 16, 23, 23, 196, 201, 36, 106, 207, 205, 205, 69, 139, 62, 105, 90, 203, 203, 216, 54, 99, 99, 100, 88, 88,
	146, 145, 74, 74, 80, 204, 204, 180, 84, 138, 212, 215, 24, 24, 63, 187, 187, 118, 148, 183, 183, 57, 102, 102, 206,
	44, 152, 152, 190, 134, 134, 59, 182, 87, 87, 48, 174, 125, 104, 140, 140, 188, 92, 131, 178, 64, 70, 70, 76, 65,
	79, 121, 113, 176, 176, 177, 211, 75, 75, 120, 82, 82, 93, 98, 122, 122, 53, 115, 115, 45, 55, 34, 34,
]

function fillResolutionSpec(spec: Omit<ResolutionSpec, 'cornerRight'>): ResolutionSpec {
	return {
		...spec,
		cornerRight: spec.corner.map((buf) => {
			return Buffer.from(buf).reverse()
		}),
	}
}
/**
 * Properties about how to generate the label for each resolution
 */
interface ResolutionSpec {
	/** Max width of the generated image */
	width: number
	/** Max height of the generated image */
	height: number
	/** Horizontal padding inside the border */
	xPad: number
	/** Bottom padding inside the border */
	yPadBottom: number
	/** Top padding inside the border */
	yPadTop: number
	/** Base font height to use */
	fontHeight: number

	/** Color to draw the straight border edges in */
	borderColour: number
	/** Array of buffer fragments for the top left corner */
	corner: Buffer[]
	/** Array of buffer fragments for the top right corner */
	cornerRight: Buffer[]
}
const Res4K = fillResolutionSpec({
	width: 640,
	height: 100,
	xPad: 16,
	yPadBottom: 16,
	yPadTop: 4,
	fontHeight: 46,

	borderColour: 0x05,
	corner: [
		Buffer.from([0, 0, 0, 0, 0, 0, 223, 2, 162, 220, 20]),
		Buffer.from([0, 0, 0, 0, 223, 195, 20, 5, 5, 5, 5]),
		Buffer.from([0, 0, 0, 7, 3, 5, 5, 110, 141, 124, 29]),
		Buffer.from([0, 0, 7, 220, 5, 200, 97, 14, 14, 14, 14]),
		Buffer.from([0, 223, 3, 5, 209, 29, 14, 14, 14, 14, 14]),
		Buffer.from([0, 219, 5, 200, 29, 14, 14, 14, 14, 14, 14]),
		Buffer.from([223, 20, 5, 97, 14, 14, 14, 14, 14, 14, 14]),
		Buffer.from([2, 5, 110, 14, 14, 14, 14, 14, 14, 14, 14]),
		Buffer.from([162, 5, 141, 14, 14, 14, 14, 14, 14, 14, 14]),
		Buffer.from([220, 5, 124, 14, 14, 14, 14, 14, 14, 14, 14]),
		Buffer.from([20, 5, 29, 14, 14, 14, 14, 14, 14, 14, 14]),
	],
})
const Res1080 = fillResolutionSpec({
	width: 320,
	height: 50,
	xPad: 10,
	yPadBottom: 10,
	yPadTop: 4,
	fontHeight: 24,

	borderColour: 0x05,
	corner: [
		Buffer.from([0, 0, 1, 229, 230, 20]),
		Buffer.from([0, 7, 158, 5, 5, 5]),
		Buffer.from([1, 158, 5, 23, 37, 101]),
		Buffer.from([229, 5, 23, 29, 14, 14]),
		Buffer.from([230, 5, 37, 14, 14, 14]),
		Buffer.from([20, 5, 101, 14, 14, 14]),
	],
})
const Res720 = fillResolutionSpec({
	width: 320, // TODO - is this correct for all models?
	height: 40,
	xPad: 6,
	yPadBottom: 6,
	yPadTop: 2,
	fontHeight: 17,

	borderColour: 170,
	corner: [
		Buffer.from([0, 0, 160, 169]),
		Buffer.from([0, 165, 165, 169]),
		Buffer.from([160, 165, 56, 14]),
		Buffer.from([169, 169, 14, 14]),
	],
})

// const transparentColour = 0 // encoded value
const bgColour = colourLookupTable[0] // 'background' value
// const borderColour = 0x05 // encoded value

function calculateWidthAndTrimText(
	face: FontFace,
	str: string,
	maxWidth: number
): {
	width: number
	str: string
} {
	let trimmedStr = '' // currently measured string
	let advanceWidth = 0 // width including advance to next char
	let textWidth = 0 // width assuming it ends after this char

	for (let i = 0; i < str.length; i++) {
		const ch = face.loadChar(str.charCodeAt(i), { render: false })

		if (advanceWidth + ch.metrics.width / 64 > maxWidth) {
			// Char makes the string too wide
			break
		}

		// We can keep this char
		textWidth = advanceWidth + ch.metrics.width / 64
		advanceWidth = advanceWidth + ch.metrics.horiAdvance / 64
		trimmedStr += str[i]
	}

	return { str: trimmedStr, width: textWidth }
}

function drawTextToBuffer(
	face: FontFace,
	fontScale: number,
	buffer: Buffer,
	spec: ResolutionSpec,
	rawText: string,
	bufferYOffset: number,
	bufferWidth: number
): void {
	const fontHeight = spec.fontHeight * fontScale
	face.setPixelSizes(fontHeight, fontHeight)

	const { width: textWidth, str: newStr } = calculateWidthAndTrimText(face, rawText, spec.width - spec.xPad * 2)
	const boundaryWidth = Math.floor(textWidth + spec.xPad * 2)
	const boundaryHeight = Math.floor(fontHeight + spec.yPadTop + spec.yPadBottom)
	const bufferXOffset = Math.floor((bufferWidth - spec.width) / 2)

	// Fill background of boundary, and a 2px border
	const boundaryYOffset = Math.max(Math.floor((spec.height - boundaryHeight) / 2.5), 0) + bufferYOffset
	const boundaryXOffset = Math.max(Math.floor((spec.width - boundaryWidth) / 2), 0) + bufferXOffset
	function drawHorizontalLine(y: number, xOffset: number, length: number, colour: number): void {
		const offset = (boundaryYOffset + y) * bufferWidth + boundaryXOffset + xOffset
		buffer.fill(colour, offset, offset + length)
	}

	for (let y = 0; y < boundaryHeight; y++) {
		const isBorder = y == 0 || y == 1 || y === boundaryHeight - 1 || y === boundaryHeight - 2

		if (isBorder) {
			drawHorizontalLine(y, 0, boundaryWidth, spec.borderColour)
		} else {
			drawHorizontalLine(y, 0, 2, spec.borderColour)
			drawHorizontalLine(y, boundaryWidth - 2, 2, spec.borderColour)

			drawHorizontalLine(y, 2, boundaryWidth - 4, bgColour)
		}
	}

	// Patch on the rounded corners
	for (let i = 0; i < spec.corner.length; i++) {
		const cornerBufferLeft = spec.corner[i]
		const cornerBufferRight = spec.cornerRight[i]

		const offsetTopLeft = (boundaryYOffset + i) * bufferWidth + boundaryXOffset
		cornerBufferLeft.copy(buffer, offsetTopLeft)

		const offsetBottomLeft = (boundaryYOffset + boundaryHeight - i - 1) * bufferWidth + boundaryXOffset
		cornerBufferLeft.copy(buffer, offsetBottomLeft)

		const offsetTopRight = offsetTopLeft + boundaryWidth - cornerBufferRight.length
		cornerBufferRight.copy(buffer, offsetTopRight)

		const offsetBottomRight = offsetBottomLeft + boundaryWidth - cornerBufferRight.length
		cornerBufferRight.copy(buffer, offsetBottomRight)
	}

	const maxLeft = boundaryXOffset + spec.width + spec.xPad
	let charLeft = boundaryXOffset + spec.xPad
	const textTop = boundaryYOffset + fontHeight + spec.yPadTop

	// Draw text characters
	for (let i = 0; i < newStr.length; i++) {
		face.setTransform(undefined, [charLeft * 64, 0])

		const ch = face.loadChar(newStr.charCodeAt(i), { render: true })

		const endCharLeft = charLeft + ch.metrics.horiAdvance / 64
		if (endCharLeft >= maxLeft) {
			// guard to avoid buffer index overflow
			break
		}

		const charTop = Math.floor(textTop - ch.metrics.horiBearingY / 64)

		if (ch.bitmap && typeof ch.bitmapLeft === 'number') {
			const bitmapLeft = Math.floor(ch.bitmapLeft)

			for (let y = 0; y < ch.bitmap.height; y++) {
				for (let x = 0; x < ch.bitmap.width; x++) {
					const rawCol = ch.bitmap.buffer[x + y * ch.bitmap.width]
					const myCol = colourLookupTable[rawCol]
					if (myCol !== undefined) {
						// If we have a colour, update the image
						buffer[x + bitmapLeft + (y + charTop) * bufferWidth] = myCol
					}
				}
			}
		}

		charLeft = endCharLeft
	}
}

export interface GenerateMultiviewerLabelProps {
	HD1080: boolean
	HD720: boolean
	UHD4K: boolean
	UHD8K: boolean
}

/**
 * Generate a label for the multiviewer at multiple resolutions
 * @param face freetype2.FontFace to draw with
 * @param str String to write
 * @param props Specify which resolutions to generate for
 * @returns Buffer
 */
export function generateMultiviewerLabel(
	face: FontFace,
	fontScale: number,
	str: string,
	props: GenerateMultiviewerLabelProps
): Buffer {
	// Calculate the sizes
	let width: number | undefined
	let height = 0
	// TODO UDH8K
	if (props.UHD4K) {
		if (!width) width = Res4K.width
		height += Res4K.height
	}
	if (props.HD1080) {
		if (!width) width = Res1080.width
		height += Res1080.height
	}
	if (props.HD720) {
		if (!width) width = Res720.width
		height += Res720.height
	}

	if (!width || !height) throw new Error('At least one resolution must be chosen!')

	const buffer = Buffer.alloc(width * height)
	const width2 = width

	// Don't draw border when name is cleared
	if (!str) return buffer

	let yOffset = 0
	const drawRes = (spec: ResolutionSpec): void => {
		drawTextToBuffer(face, fontScale, buffer, spec, str, yOffset, width2)
		yOffset += spec.height
	}

	// TODO UDH8K
	if (props.UHD4K) drawRes(Res4K)
	if (props.HD1080) drawRes(Res1080)
	if (props.HD720) drawRes(Res720)

	return buffer
}

/**
 * Determine which resolutions should be included in the multiview label drawing
 * @param state Current device state
 * @returns Properties to draw with, or null if they could not be determined
 */
export function calculateGenerateMultiviewerLabelProps(
	state: Readonly<Pick<AtemState, 'info'>> | null
): GenerateMultiviewerLabelProps | null {
	if (state && state.info.supportedVideoModes) {
		const res: GenerateMultiviewerLabelProps = {
			UHD8K: false,
			UHD4K: false,
			HD1080: false,
			HD720: false,
		}

		const multiViewerModes = new Set<VideoMode>()
		for (const info of state.info.supportedVideoModes) {
			if (!info.requiresReconfig) {
				for (const mode of info.multiviewerModes) {
					multiViewerModes.add(mode)
				}
			}
		}

		for (const mode of multiViewerModes.values()) {
			const format = getVideoModeInfo(mode)?.format
			switch (format) {
				case VideoFormat.HD720:
					res.HD720 = true
					break
				case VideoFormat.HD1080:
					res.HD1080 = true
					break
				case VideoFormat.UHD4K:
					res.UHD4K = true
					break
				case VideoFormat.UDH8K:
					res.UHD8K = true
					break
				case undefined:
				case VideoFormat.SD:
					// unsupported
					break
			}
		}

		return res
	}

	return null
}

/**
 * Load a font file to freetype2
 * @param fontPath Path to file
 */
export async function loadFont(fontPath?: string): Promise<FontFace> {
	if (!fontPath) fontPath = path.join(__dirname, '../../assets/roboto/Roboto-Regular.ttf')

	const fontFile = await readFile(fontPath)
	return NewMemoryFace(fontFile)
}

export function hasInternalMultiviewerLabelGeneration(modelId: Model): boolean {
	return modelId >= Model.Mini
}
