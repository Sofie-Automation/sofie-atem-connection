# Sofie ATEM Connection Library

[![Node CI](https://github.com/Sofie-Automation/sofie-atem-connection/actions/workflows/node.yaml/badge.svg)](https://github.com/Sofie-Automation/sofie-atem-connection/actions/workflows/node.yaml)
[![codecov](https://codecov.io/gh/Sofie-Automation/sofie-atem-connection/branch/main/graph/badge.svg)](https://codecov.io/gh/Sofie-Automation/sofie-atem-connection/)
[![npm](https://img.shields.io/npm/v/atem-connection)](https://www.npmjs.com/package/atem-connection)

This is the _ATEM Connection_ library of the [**Sofie** TV Automation System](https://github.com/Sofie-Automation/Sofie-TV-automation/). The library is used for connecting to Blackmagic Design's ATEM devices.

- [_ATEM-Connection_-specific Developer Info](DEVELOPER.md)

## General Sofie System Information

- [_Sofie_ Documentation](https://sofie-automation.github.io/sofie-core//)
- [_Sofie_ Releases](https://sofie-automation.github.io/sofie-core//releases)
- [Contribution Guidelines](CONTRIBUTING.md)
- [License](LICENSE)

---

## Device support

| Version       | Level of Support                                                  |
| ------------- | ----------------------------------------------------------------- |
| v8.0 - Latest | Primary focus. Target for new features                            |
| v7.2          | Previous focus, should still work well                            |
| v7.3 - v7.5.2 | Community tested, we may accept PRs but will not be testing these |

Due to the nature of the ATEM firmware and its tendency to break things, it is likely that new firmwares will require updates to the library to be fully supported.
Additionally any newly unimplemented functionality will generally only be written and tested for the latest firmware, even if it was added in an older firmware.

We have no intention of dropping support for older firmwares, but we may do at some point. If we do this will be done in a major version bump, and will only be for significantly older firmware.

The library is tested on a variety of models spanning every generation, and the aim is to provide support for every model.

Note: USB control of devices is not supported by this library.

## Technology Highlights

- Typescript
- Jest
- standard-version
- codecov

## Installation

For usage by library consumers installation is as easy as:

```sh
yarn add atem-connection
```

For library developers installation steps are as following:

```sh
git clone https://github.com/Sofie-Automation/sofie-atem-connection
yarn
yarn build
```

We welcome any contributions. Please read [our guide](CONTRIBUTING.md) on how to add new commands before raising a PR.

## Usage

```javascript
const { Atem } = require('atem-connection')
const myAtem = new Atem()
myAtem.on('info', console.log)
myAtem.on('error', console.error)

myAtem.connect('192.168.168.240')

myAtem.on('connected', () => {
	myAtem.changeProgramInput(3).then(() => {
		// Fired once the atem has acknowledged the command
		// Note: the state likely hasnt updated yet, but will follow shortly
		console.log('Program input set')
	})
	console.log(myAtem.state)
})

myAtem.on('stateChanged', (state, pathToChange) => {
	console.log(state) // catch the ATEM state.
})
```

### Documentation

You can find the generated type docs [here](https://sofie-automation.github.io/sofie-atem-connection/).

### Events

- `error`
  This event will be fired when an error occurs in the connection. Node requires you to handle these errors, or your application will quit.

- `info`
  This event will be fired when the connection provides some logging information.

- `debug`
  This event is not useful for most users. It will emit some messages useful to figure out why some data useful mostly to library developers.

- `connected`
  This event will be fired once we have connected with the ATEM.

- `disconnected`
  Whenever the connection to the ATEM fails and does not recover within 5 seconds this is called.

- `stateChanged(state, path)`
  Whenever a packet from the ATEM is received that changes the state, this event will be fired.
  The path parameter is a path into the state that represents the change, to allow for filtering of events. eg video.mixEffects.0.programInput

- `receivedCommand(command)`
  Whenever a packet from the ATEM is received that contains a command, this event will be fired.
  This should not be relied on in most usage, as the commands can and will have breaking changes in patch releases. This event is needed for some use cases, so if this is used you should likely pin the version down to a specific patch release to ensure nothing breaks.

## Debug

Set `debugBuffers=true` config option in order to see raw packets. This is especially useful for library developers.

```javascript
const myAtem = new Atem({ debugBuffers: true })
myAtem.on('info', console.log)
myAtem.on('debug', console.log)
myAtem.on('error', console.error)
```

```sh
SEND <Buffer 10 14 53 ab 00 00 00 00 00 3a 00 00 01 00 00 00 00 00 00 00>
SEND <Buffer 80 0c 53 ab 00 00 00 00 00 03 00 00>
SEND <Buffer 80 0c 53 ab 00 00 00 00 00 03 00 00>
SEND <Buffer 80 0c 80 0f 00 01 00 00 00 41 00 00>
RECV <Buffer 00 0c 90 60 5f 76 65 72 00 02 00 10>...
```

## Test

This module run tests with jest.

```sh
$ yarn unit
```

There is a suite of generated serialization tests, using [atem-connection-test-generator](https://github.com/LibAtem/atem-connection-test-generator) as the [LibAtem](https://github.com/LibAtem) project has tests to verify its serialization against the Blackmagic Design's ATEM SDK.

---

_The NRK logo is a registered trademark of Norsk rikskringkasting AS. The license does not grant any right to use, in any way, any trademarks, service marks or logos of Norsk rikskringkasting AS._
