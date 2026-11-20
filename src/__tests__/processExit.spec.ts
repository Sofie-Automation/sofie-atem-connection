import { ChildProcess, execFile, spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { promisify } from 'node:util'

import { afterAll, beforeAll, describe, expect, test } from 'vitest'

/**
 * The rest of the tests replace the socket worker thread, so these run the compiled library in a separate process to
 * check that the real worker can be started, and that nothing is left behind keeping the process alive once the
 * connection is no longer wanted
 */

const REPO_ROOT = path.join(import.meta.dirname, '../..')
// Inside node_modules, so that the compiled library can resolve its dependencies
const OUT_DIR = path.join(REPO_ROOT, 'node_modules/.cache/atem-connection-process-exit-test')
const SCRIPT_PATH = path.join(OUT_DIR, 'script.js')

const SCRIPT = `
import { Atem } from './index.js'

const atem = new Atem()
atem.on('error', (e) => {
	console.error('error event:', e)
	process.exitCode = 2
})

try {
	// Nothing is listening, so it will keep trying to connect
	await atem.connect('127.0.0.1')
} catch (e) {
	console.error('connect failed:', e)
	process.exit(1)
}
console.log('connecting')

const mode = process.argv[2]
if (mode === 'disconnect') await atem.disconnect()
if (mode === 'destroy') await atem.destroy()
`

interface RunResult {
	exited: boolean
	code: number | null
	output: string
}

async function runScript(mode: string, aliveFor: number): Promise<RunResult> {
	const child: ChildProcess = spawn(process.execPath, [SCRIPT_PATH, mode], { stdio: ['ignore', 'pipe', 'pipe'] })

	let output = ''
	child.stdout?.on('data', (data) => (output += data))
	child.stderr?.on('data', (data) => (output += data))

	const exit = new Promise<number | null>((resolve) => child.on('exit', (code) => resolve(code)))
	const timeout = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), aliveFor))

	const result = await Promise.race([exit, timeout])
	if (result === 'timeout') {
		child.kill()
		await exit
		return { exited: false, code: null, output }
	}
	return { exited: true, code: result, output }
}

describe('process exit', () => {
	beforeAll(async () => {
		await rm(OUT_DIR, { recursive: true, force: true })
		await mkdir(OUT_DIR, { recursive: true })

		const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc')
		await promisify(execFile)(process.execPath, [
			tsc,
			...['-p', path.join(REPO_ROOT, 'tsconfig.build.json')],
			...['--outDir', OUT_DIR],
			...['--composite', 'false', '--incremental', 'false', '--tsBuildInfoFile', 'null'],
			...['--declaration', 'false', '--declarationMap', 'false', '--sourceMap', 'false'],
		])

		// Inside node_modules the type isn't inherited from the repo's package.json
		await writeFile(path.join(OUT_DIR, 'package.json'), JSON.stringify({ type: 'module' }))
		await writeFile(SCRIPT_PATH, SCRIPT)
	}, 60000)
	afterAll(async () => {
		await rm(OUT_DIR, { recursive: true, force: true })
	})

	test('stays alive while trying to connect', async () => {
		const result = await runScript('stay', 3000)
		expect(result.output).toContain('connecting')
		expect(result.exited).toBe(false)
	})

	test('exits once disconnected', async () => {
		const result = await runScript('disconnect', 5000)
		expect(result).toEqual({ exited: true, code: 0, output: 'connecting\n' })
	})

	test('exits once destroyed', async () => {
		const result = await runScript('destroy', 5000)
		expect(result).toEqual({ exited: true, code: 0, output: 'connecting\n' })
	})
})
