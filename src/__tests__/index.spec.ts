import { expect, test, vi } from 'vitest'

import { Atem, Enums } from '../index.js'
import { createInProcessChild } from '../lib/__tests__/atemSocketChildFake.js'
import { createEmptyState } from './util.js'

test('Simple test', async () => {
	const nb = new Atem({ createChildBridge: createInProcessChild })
	try {
		nb.on('error', () => null)

		expect(nb).toBeTruthy()
	} finally {
		await nb.destroy()
	}
})

function createConnection(apiVersion: Enums.ProtocolVersion): Atem {
	const conn = new Atem({ debugBuffers: true, createChildBridge: createInProcessChild })

	// Create a state object
	const state = createEmptyState()
	state.info.apiVersion = apiVersion

	// conn.on('error', () => null)
	conn.sendCommand = vi.fn()
	;(conn as any).client._state = state

	return conn
}

test('setSuperSourceProperties - 7.2', async () => {
	const conn = createConnection(Enums.ProtocolVersion.V7_2)
	try {
		expect(conn.sendCommand).not.toHaveBeenCalled()

		await conn.setSuperSourceProperties(
			{
				artPreMultiplied: true,
				artOption: Enums.SuperSourceArtOption.Background,
			},
			2
		)
		expect(conn.sendCommand).toHaveBeenCalledTimes(1)
		expect(conn.sendCommand).toHaveBeenNthCalledWith(1, {
			flag: 12,
			runOrderGroup: 0,
			_properties: {
				artOption: 0,
				artPreMultiplied: true,
			},
		})
	} finally {
		await conn.destroy()
	}
})

test('setSuperSourceProperties - 8.0', async () => {
	const conn = createConnection(Enums.ProtocolVersion.V8_0)
	try {
		expect(conn.sendCommand).not.toHaveBeenCalled()

		await conn.setSuperSourceProperties(
			{
				artPreMultiplied: true,
				artOption: Enums.SuperSourceArtOption.Background,
			},
			2
		)
		expect(conn.sendCommand).toHaveBeenCalledTimes(1)
		expect(conn.sendCommand).toHaveBeenNthCalledWith(1, {
			ssrcId: 2,
			flag: 12,
			runOrderGroup: 0,
			_properties: {
				artOption: 0,
				artPreMultiplied: true,
			},
		})
	} finally {
		await conn.destroy()
	}
})

test('setSuperSourceBorder - 7.2', async () => {
	const conn = createConnection(Enums.ProtocolVersion.V7_2)
	try {
		expect(conn.sendCommand).not.toHaveBeenCalled()

		await conn.setSuperSourceBorder(
			{
				borderBevelSoftness: 12,
				borderLuma: 3,
			},
			2
		)
		expect(conn.sendCommand).toHaveBeenCalledTimes(1)
		expect(conn.sendCommand).toHaveBeenNthCalledWith(1, {
			flag: 139264,
			runOrderGroup: 0,
			_properties: {
				borderBevelSoftness: 12,
				borderLuma: 3,
			},
		})
	} finally {
		await conn.destroy()
	}
})

test('setSuperSourceBorder - 8.0', async () => {
	const conn = createConnection(Enums.ProtocolVersion.V8_0)
	try {
		expect(conn.sendCommand).not.toHaveBeenCalled()

		await conn.setSuperSourceBorder(
			{
				borderBevelSoftness: 12,
				borderLuma: 3,
			},
			2
		)
		expect(conn.sendCommand).toHaveBeenCalledTimes(1)
		expect(conn.sendCommand).toHaveBeenNthCalledWith(1, {
			ssrcId: 2,
			flag: 1088,
			runOrderGroup: 0,
			_properties: {
				borderBevelSoftness: 12,
				borderLuma: 3,
			},
		})
	} finally {
		await conn.destroy()
	}
})
