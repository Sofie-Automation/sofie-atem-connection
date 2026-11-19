/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AtemState } from '../../state/index.js'
import { calculateGenerateMultiviewerLabelProps, generateMultiviewerLabel } from '../multiviewLabel.js'
import { NewMemoryFace } from '@julusian/freetype2'
import * as fs from 'fs'

describe('Multiview Label', () => {
	const font = NewMemoryFace(fs.readFileSync(__dirname + '/../../../assets/roboto/Roboto-Regular.ttf'))
	test('null', () => {
		const result = calculateGenerateMultiviewerLabelProps(null)
		expect(result).toBeNull()
	})

	test('1ME', () => {
		const info: AtemState['info'] = {
			apiVersion: 131101,
			model: 2,
			superSources: [],
			mixEffects: [
				{
					keyCount: 4,
				},
			],
			power: [true],
			productIdentifier: 'ATEM 1 M/E Production Switcher',
			capabilities: {
				mixEffects: 1,
				sources: 23,
				downstreamKeyers: 2,
				auxilliaries: 3,
				mixMinusOutputs: 0,
				mediaPlayers: 2,
				serialPorts: 1,
				maxHyperdecks: 4,
				DVEs: 1,
				stingers: 1,
				superSources: 0,
				talkbackChannels: 0,
				cameraControl: true,
				advancedChromaKeyers: false,
				onlyConfigurableOutputs: false,
			},
			mediaPool: {
				stillCount: 32,
				clipCount: 2,
			},
			multiviewer: {
				count: 1,
				windowCount: 10,
			},
			audioMixer: {
				inputs: 11,
				monitors: 1,
				headphones: 0,
			},
			supportedVideoModes: [
				{
					mode: 0,
					multiviewerModes: [7],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 1,
					multiviewerModes: [6],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 2,
					multiviewerModes: [7],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 3,
					multiviewerModes: [6],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 4,
					multiviewerModes: [4],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 5,
					multiviewerModes: [5],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 6,
					multiviewerModes: [6],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 7,
					multiviewerModes: [7],
					downConvertModes: [],
					requiresReconfig: false,
				},
			],
			macroPool: {
				macroCount: 100,
			},
		}

		const result = calculateGenerateMultiviewerLabelProps({ info })
		expect(result).toEqual({
			HD1080: true,
			HD720: true,
			UHD4K: false,
			UHD8K: false,
		})

		const buffer = generateMultiviewerLabel(font, 1, '', result!)
		expect(buffer.length).toBe(320 * 90)
	})

	test('2ME4K', () => {
		const info: AtemState['info'] = {
			apiVersion: 131102,
			model: 6,
			superSources: [
				{
					boxCount: 4,
				},
			],
			mixEffects: [
				{
					keyCount: 2,
				},
				{
					keyCount: 2,
				},
			],
			power: [false, true],
			productIdentifier: 'ATEM 2 M/E Production Studio 4K',
			capabilities: {
				mixEffects: 2,
				sources: 47,
				downstreamKeyers: 2,
				auxilliaries: 6,
				mixMinusOutputs: 0,
				mediaPlayers: 2,
				serialPorts: 1,
				maxHyperdecks: 4,
				DVEs: 1,
				stingers: 1,
				superSources: 1,
				talkbackChannels: 1,
				cameraControl: true,
				advancedChromaKeyers: false,
				onlyConfigurableOutputs: false,
			},
			multiviewer: {
				count: 2,
				windowCount: 1,
			},
			mediaPool: {
				stillCount: 32,
				clipCount: 2,
			},
			audioMixer: {
				inputs: 24,
				monitors: 1,
				headphones: 0,
			},
			supportedVideoModes: [
				{
					mode: 0,
					multiviewerModes: [7],
					downConvertModes: [0],
					requiresReconfig: false,
				},
				{
					mode: 1,
					multiviewerModes: [6],
					downConvertModes: [1],
					requiresReconfig: false,
				},
				{
					mode: 2,
					multiviewerModes: [7],
					downConvertModes: [2],
					requiresReconfig: false,
				},
				{
					mode: 3,
					multiviewerModes: [6],
					downConvertModes: [3],
					requiresReconfig: false,
				},
				{
					mode: 4,
					multiviewerModes: [4],
					downConvertModes: [4],
					requiresReconfig: false,
				},
				{
					mode: 5,
					multiviewerModes: [5],
					downConvertModes: [5],
					requiresReconfig: false,
				},
				{
					mode: 6,
					multiviewerModes: [6],
					downConvertModes: [6],
					requiresReconfig: false,
				},
				{
					mode: 7,
					multiviewerModes: [7],
					downConvertModes: [7],
					requiresReconfig: false,
				},
				{
					mode: 8,
					multiviewerModes: [8],
					downConvertModes: [8],
					requiresReconfig: false,
				},
				{
					mode: 9,
					multiviewerModes: [9],
					downConvertModes: [9],
					requiresReconfig: false,
				},
				{
					mode: 10,
					multiviewerModes: [6],
					downConvertModes: [10],
					requiresReconfig: false,
				},
				{
					mode: 11,
					multiviewerModes: [7],
					downConvertModes: [11],
					requiresReconfig: false,
				},
				{
					mode: 12,
					multiviewerModes: [6],
					downConvertModes: [12],
					requiresReconfig: false,
				},
				{
					mode: 13,
					multiviewerModes: [7],
					downConvertModes: [13],
					requiresReconfig: false,
				},
				{
					mode: 14,
					multiviewerModes: [8],
					downConvertModes: [8],
					requiresReconfig: false,
				},
				{
					mode: 15,
					multiviewerModes: [9],
					downConvertModes: [9],
					requiresReconfig: false,
				},
				{
					mode: 16,
					multiviewerModes: [6],
					downConvertModes: [6],
					requiresReconfig: false,
				},
				{
					mode: 17,
					multiviewerModes: [7],
					downConvertModes: [7],
					requiresReconfig: false,
				},
			],
			macroPool: {
				macroCount: 100,
			},
		}

		const result = calculateGenerateMultiviewerLabelProps({ info })
		expect(result).toEqual({
			HD1080: true,
			HD720: true,
			UHD4K: false,
			UHD8K: false,
		})

		const buffer = generateMultiviewerLabel(font, 1, '', result!)
		expect(buffer.length).toBe(320 * 90)
	})

	test('4ME4K', () => {
		const info: AtemState['info'] = {
			apiVersion: 131102,
			model: 7,
			superSources: [
				{
					boxCount: 4,
				},
			],
			mixEffects: [
				{
					keyCount: 4,
				},
				{
					keyCount: 4,
				},
				{
					keyCount: 4,
				},
				{
					keyCount: 4,
				},
			],
			power: [true, true],
			productIdentifier: 'ATEM 4 M/E Broadcast Studio 4K',
			capabilities: {
				mixEffects: 4,
				sources: 67,
				downstreamKeyers: 2,
				auxilliaries: 6,
				mixMinusOutputs: 0,
				mediaPlayers: 4,
				serialPorts: 1,
				maxHyperdecks: 4,
				DVEs: 1,
				stingers: 1,
				superSources: 1,
				talkbackChannels: 1,
				cameraControl: true,
				advancedChromaKeyers: true,
				onlyConfigurableOutputs: false,
			},
			multiviewer: {
				count: 2,
				windowCount: 1,
			},
			mediaPool: {
				stillCount: 64,
				clipCount: 2,
			},
			audioMixer: {
				inputs: 26,
				monitors: 1,
				headphones: 0,
			},
			supportedVideoModes: [
				{
					mode: 4,
					multiviewerModes: [4],
					downConvertModes: [4],
					requiresReconfig: false,
				},
				{
					mode: 5,
					multiviewerModes: [5],
					downConvertModes: [5],
					requiresReconfig: false,
				},
				{
					mode: 6,
					multiviewerModes: [6, 16],
					downConvertModes: [6],
					requiresReconfig: false,
				},
				{
					mode: 7,
					multiviewerModes: [7, 17],
					downConvertModes: [7],
					requiresReconfig: false,
				},
				{
					mode: 8,
					multiviewerModes: [8, 14],
					downConvertModes: [8],
					requiresReconfig: false,
				},
				{
					mode: 9,
					multiviewerModes: [9, 15],
					downConvertModes: [9],
					requiresReconfig: false,
				},
				{
					mode: 10,
					multiviewerModes: [6, 10, 16],
					downConvertModes: [10],
					requiresReconfig: false,
				},
				{
					mode: 11,
					multiviewerModes: [7, 11, 17],
					downConvertModes: [11],
					requiresReconfig: false,
				},
				{
					mode: 12,
					multiviewerModes: [6, 10, 12, 16],
					downConvertModes: [12],
					requiresReconfig: false,
				},
				{
					mode: 13,
					multiviewerModes: [7, 11, 13, 17],
					downConvertModes: [13],
					requiresReconfig: false,
				},
				{
					mode: 14,
					multiviewerModes: [8, 14],
					downConvertModes: [8],
					requiresReconfig: false,
				},
				{
					mode: 15,
					multiviewerModes: [9, 15],
					downConvertModes: [9],
					requiresReconfig: false,
				},
				{
					mode: 16,
					multiviewerModes: [6, 10, 16],
					downConvertModes: [6, 10],
					requiresReconfig: false,
				},
				{
					mode: 17,
					multiviewerModes: [7, 11, 17],
					downConvertModes: [7, 11],
					requiresReconfig: false,
				},
				{
					mode: 18,
					multiviewerModes: [6, 10, 12, 16],
					downConvertModes: [6, 10, 12],
					requiresReconfig: false,
				},
				{
					mode: 19,
					multiviewerModes: [7, 11, 13, 17],
					downConvertModes: [7, 11, 13],
					requiresReconfig: false,
				},
			],
			macroPool: {
				macroCount: 100,
			},
		}

		const result = calculateGenerateMultiviewerLabelProps({ info })
		expect(result).toEqual({
			HD1080: true,
			HD720: true,
			UHD4K: true,
			UHD8K: false,
		})

		const buffer = generateMultiviewerLabel(font, 1, '', result!)
		expect(buffer.length).toBe(640 * 190)
	})

	test('Constellation', () => {
		const info: AtemState['info'] = {
			apiVersion: 131102,
			model: 11,
			superSources: [
				{
					boxCount: 4,
				},
				{
					boxCount: 4,
				},
			],
			mixEffects: [
				{
					keyCount: 4,
				},
				{
					keyCount: 4,
				},
				{
					keyCount: 4,
				},
				{
					keyCount: 4,
				},
			],
			power: [false, true],
			productIdentifier: 'ATEM Constellation 8K',
			capabilities: {
				mixEffects: 4,
				sources: 110,
				downstreamKeyers: 4,
				auxilliaries: 24,
				mixMinusOutputs: 24,
				mediaPlayers: 4,
				serialPorts: 1,
				maxHyperdecks: 4,
				DVEs: 1,
				stingers: 1,
				superSources: 2,
				talkbackChannels: 2,
				cameraControl: true,
				advancedChromaKeyers: true,
				onlyConfigurableOutputs: true,
			},
			multiviewer: {
				count: 4,
				windowCount: 1,
			},
			mediaPool: {
				stillCount: 64,
				clipCount: 4,
			},
			fairlightMixer: {
				inputs: 78,
				monitors: 1,
			},
			supportedVideoModes: [
				{
					mode: 4,
					multiviewerModes: [4],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 5,
					multiviewerModes: [5],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 6,
					multiviewerModes: [6, 16],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 7,
					multiviewerModes: [7, 17],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 8,
					multiviewerModes: [8, 14],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 9,
					multiviewerModes: [9, 15],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 10,
					multiviewerModes: [10, 16],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 11,
					multiviewerModes: [11, 17],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 12,
					multiviewerModes: [6, 10, 12, 16, 18],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 13,
					multiviewerModes: [7, 11, 13, 17, 19],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 14,
					multiviewerModes: [8, 14],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 15,
					multiviewerModes: [9, 15],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 16,
					multiviewerModes: [10, 16],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 17,
					multiviewerModes: [11, 17],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 18,
					multiviewerModes: [6, 10, 12, 16, 18],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 19,
					multiviewerModes: [7, 11, 13, 17, 19],
					downConvertModes: [],
					requiresReconfig: false,
				},
				{
					mode: 20,
					multiviewerModes: [8, 14, 20],
					downConvertModes: [],
					requiresReconfig: true,
				},
				{
					mode: 21,
					multiviewerModes: [9, 15, 21],
					downConvertModes: [],
					requiresReconfig: true,
				},
				{
					mode: 22,
					multiviewerModes: [10, 16, 22],
					downConvertModes: [],
					requiresReconfig: true,
				},
				{
					mode: 23,
					multiviewerModes: [11, 17, 23],
					downConvertModes: [],
					requiresReconfig: true,
				},
				{
					mode: 24,
					multiviewerModes: [10, 12, 16, 18, 22, 24],
					downConvertModes: [],
					requiresReconfig: true,
				},
				{
					mode: 25,
					multiviewerModes: [11, 13, 17, 19, 23, 25],
					downConvertModes: [],
					requiresReconfig: true,
				},
			],
			macroPool: {
				macroCount: 100,
			},
		}

		const result = calculateGenerateMultiviewerLabelProps({ info })
		expect(result).toEqual({
			HD1080: true,
			HD720: true,
			UHD4K: true,
			UHD8K: false,
		})

		const buffer = generateMultiviewerLabel(font, 1, '', result!)
		expect(buffer.length).toBe(640 * 190)
	})

	// eslint-disable-next-line jest/no-commented-out-tests
	// test('Constellation 8K', () => {
	// 	const info: AtemState['info'] = {

	// 	}

	// 	const result = calculateGenerateMultiviewerLabelProps({ info })
	// 	expect(result).toEqual({
	// 		HD1080: true,
	// 		HD720: false,
	// 		UHD4K: true,
	// 		UHD8K: true,
	// 	})

	// 	const buffer = generateMultiviewerLabel(font, '', result!)
	// 	expect(buffer.length).toBe(640 * 190) // TODO - this is wrong
	// })
})
