/* eslint-disable n/no-process-exit */
import { Atem } from '../dist/index.js'
import * as fs from 'fs'

const file = fs.readFileSync('./testframe.rgba')

if (process.argv.length < 3) {
	console.error('Expected ip address as parameter')
	process.exit(1)
}
const IP = process.argv[2]

let uploadNumber = 0
let uploadStarted = Date.now()

const conn = new Atem({})

let stuckTimeout: any = null

function uploadNext(): void {
	uploadStarted = Date.now()
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	conn.uploadStill(uploadNumber % conn.state!.media.stillPool.length, file, 'contemplation..', '').then(
		async (_res) => {
			console.log(`Uploaded still #${uploadNumber} in ${Date.now() - uploadStarted}ms at 1080p`)
			uploadNumber++

			if (stuckTimeout) {
				clearTimeout(stuckTimeout)
			}
			stuckTimeout = setTimeout(() => {
				console.log('')
				console.log('UPLOAD GOT STUCK')
				console.log('')
			}, 20000)

			setTimeout(() => uploadNext(), 0)
		},
		(e) => {
			console.log('e', e)
			setTimeout(() => uploadNext(), 500)
		}
	)
}

conn.on('error', console.log)
conn.on('disconnected', () => {
	console.log('Connection lost')
	process.exit(0)
})
conn.connect(IP).catch((e) => {
	console.error(e)
	process.exit(0)
})
conn.once('connected', () => {
	console.log(`connected in ${Date.now() - uploadStarted}ms`)
	uploadNext()
})
