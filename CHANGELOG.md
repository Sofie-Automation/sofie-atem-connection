# Changelog

All notable changes to this project will be documented in this file. See [Convential Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) for commit guidelines.

## [3.7.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.6.1...v3.7.0) (Wed Nov 12 2025)


### Fixes

* Allow installing direct from git repository (#184) [ebbbcc5d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ebbbcc5d1764544f9a7b0ce1e2e939687166b773)

### Features

* Run order groups for ATEM commands (#178) [f3e5c351](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f3e5c35146893080120d8e41f795915745ece329)

## [3.6.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.6.0...v3.6.1) (Mon Oct 20 2025)


### Fixes

* bring back getVideoModeInfo export [f30b6d78](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f30b6d78e9ce30bf0d265e450e2d7adc452ca38f)

## [3.6.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.5.0...v3.6.0) (Fri May 30 2025)


### Features

* download clip frames [5c879b69](https://github.com/Sofie-Automation/sofie-atem-connection/commit/5c879b6996e2447f702d359240e3a9270a3ca4e2)
* downloadStill from media pool (#167) [9036d5cf](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9036d5cf13e64552e8bbb79647a5619327dce99f)
* fairlight talkback mute and solo [84fbd738](https://github.com/Sofie-Automation/sofie-atem-connection/commit/84fbd7385e04a88358d3ba8b7ffbb09bbb9dee77)
* time mode [9e469df9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9e469df96591fc11c1d9d84e01ebd1321379f626)

### Fixes

* cleanup fragile command check [c89d8677](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c89d8677be8effcec55f9412a3ce94fbf411a883)
* add 9.4 and 9.6 protocol versions [36bf64f8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/36bf64f88a218ad295627a1b2e290c3e125d1b2d)

## [3.5.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.4.0...v3.5.0) (Wed Feb 07 2024)


### Fixes

* camera control float encoding (#161) [37e4fec9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/37e4fec9ac6ad467179b5a311d915c8e04449bfd)

### Features

* support enabling/disabling iso recording [d1fdfdbf](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d1fdfdbfad10e894447af0eccec5aaef8ffaa63c)
* support external colour conversions in uploadStill and uploadClip api (#160) [038a28ca](https://github.com/Sofie-Automation/sofie-atem-connection/commit/038a28cabaaf77aed92c01c247ee31a4961ebf09)

## [3.4.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.3.3...v3.4.0) (Mon Dec 11 2023)


### Features

* command batching SOFIE-2549 (#157) [4986fade](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4986fade17a9824f603fbbc23f631234884381d4)

## [3.3.3](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.3.2...v3.3.3) (Sun Dec 10 2023)


### Fixes

* add tvs-4k8 modelid and testcase [49935e2a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/49935e2aff22219c186870f8f577ab0eb5197707)

## [3.3.2](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.3.1...v3.3.2) (Thu Sep 28 2023)


### Fixes

* allow using with nodejs 20 [ca2e1bd6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ca2e1bd601256c0b8d50dfff4ae116647695380b)

## [3.3.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.3.0...v3.3.1) (Tue Sep 26 2023)


### Fixes

* add ModelId for Constellation4ME4K [496d3e3a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/496d3e3a53a44b457e555d98d876b5e190efb7c4)

## [3.3.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.2.0...v3.3.0) (Sun Aug 27 2023)


### Fixes

* remove some usages of constructor.name #74 [e4004358](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e40043587ba8b5a74233b7dfe55dc7900d5661af)
* prevent 'Lost lock mid-transfer' error with multiple transfers (#147) [3a331ffc](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3a331ffca6c921094d40933640b199e161e23307)
* disconnect called before connection has completed #107 (#150) [005f0d57](https://github.com/Sofie-Automation/sofie-atem-connection/commit/005f0d5723880d5a2a0900e54db220d09fa013ad)
* perform deep diff for `MultiViewerSourceUpdateCommand` before updating state #132 [6350a5b1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6350a5b1754b4deae9122c8498930984c1a6a5ec)

### Features

* fairlight mixer send levels (#148) [56eb26cc](https://github.com/Sofie-Automation/sofie-atem-connection/commit/56eb26cce296ae8e1c6d3eb18d990473f0955552)
* atem tvs hd8 audio routing  SOFIE-2512 (#146) [1caeb348](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1caeb3483db6c3a8e47f52a43520d5ca0cf57c00)
* add CameraControlCommand (#144) [1951a9ce](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1951a9cea9b8fe70cb737aa34a5c689bf99eb16d)

## [3.2.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.1.3...v3.2.0) (Wed Feb 15 2023)


### Features

* add DisplayClock support [15b692c1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/15b692c1c427826c1c83fdf9a0d7fbce37607a51)
* add MediaPoolCaptureStillCommand [cef85b9b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/cef85b9bf6acf21a597b3fe8a816c1bcc5ca4b25)

## [3.1.3](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.1.2...v3.1.3) (Fri Dec 02 2022)


### Fixes

* error logging when closing the socket fails [4f7b6d5f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4f7b6d5fbe66ed96acf6e995722d1730f657da9e)
* leaking sockets on reconnection [5cfcb37d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/5cfcb37d957083e7345395af259d8e3f81e087d0)
* use performance.now instead of Date.now [effad296](https://github.com/Sofie-Automation/sofie-atem-connection/commit/effad296d0459b528cba64a6f73462f7ddd9409a)

## [3.1.2](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.1.1...v3.1.2) (Mon Nov 21 2022)


## [3.1.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/v3.1.0...v3.1.1) (Mon Nov 21 2022)


### Fixes

* FairlightMixerResetPeakLevelsCommand [d670fb5e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d670fb5e1b0b0b7030785c0fa4d78888d09750d5)

## [3.1.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/3.0.1...v3.1.0) (Tue Nov 01 2022)


### Features

* streaming audio bitrates (#130) [f105231](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f105231b8f065d1b0ded4b8dcc6707e3ffbc6286)

### [3.0.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/3.0.0...3.0.1) (2022-09-03)


### Bug Fixes

* draw blank buffer when input has no name ([4f5b50c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4f5b50c1ec199bf5ab440fc136644a82cf9ff0b9))

## [3.0.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/2.4.0...3.0.0) (2022-07-28)


### ⚠ BREAKING CHANGES

* make transition nextSelection and selection be an array of enums, instead of a bitmask
* replace big-integer with native bigint
* drop node 10

### Features

* add constellation hd models ([c9b2971](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c9b2971e737b6f71e39bb0a2fe5b66fb2c763d3c))
* add ids for SDI range ([498e9ef](https://github.com/Sofie-Automation/sofie-atem-connection/commit/498e9efff7b67a10fd2e9e5f31f56d53e02f63f1))
* add new commands to atem class ([c1467d2](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c1467d27ad0f49b32d7d6bc4429828869c8906ac))
* add support for using generators with uploadClip ([#122](https://github.com/Sofie-Automation/sofie-atem-connection/issues/122)) ([97fe5af](https://github.com/Sofie-Automation/sofie-atem-connection/commit/97fe5af938a600297867b9911b5b783e4b49bf15))
* advanced chroma keyer ([e8dcf62](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e8dcf622699a0e7f6faaf5a959912683aa6ac846))
* classic audio ([bf949bd](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bf949bda8da7025adf2471f55dea2a123a4d917b))
* classic audio reset peaks ([3d62c37](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3d62c37b9562072709d2d7e7f32e666a812a7c2e))
* color generators ([c4f5a12](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c4f5a12f32a3cb7f8fd9bac3321524aed530f739))
* customisable font scale ([951d121](https://github.com/Sofie-Automation/sofie-atem-connection/commit/951d1217b1e4acb1ca88a004e92a93c349c8802a))
* data-transfer refactoring ([a597571](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a597571e836b0c7932b79f9b50cf448778f46fee))
* drop node 10 ([1e66bf5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1e66bf521e3d4796d74f1eec80b010bcce17bb90))
* expose new commands on atem class ([efbeb3d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/efbeb3dff40afe91a348bedf2fee5bcb768f96e7))
* fairlight headphone master muted ([8ee2621](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8ee26214add88e165b3af29fa05a29c700ff8822))
* figure out required multiview resolutions from state ([ee66311](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ee66311a380b28ec0a9c81e21abf41bd9958c560))
* macro data transfers ([3aaea78](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3aaea7874ad950fa6eb64dce2dabe194c604bc81))
* make transition nextSelection and selection be an array of enums, instead of a bitmask ([cd19ac1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/cd19ac14b0d7628dc11bb8acb30c343b9bec87d1))
* most of remaining fairlight audio ([6cedb95](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6cedb954877567c80a33bebc57ee075e2fe864cb))
* move lastTime off of the state, into its own event ([2337013](https://github.com/Sofie-Automation/sofie-atem-connection/commit/233701343d44c494018bc6dd4f8a772d90f4ea85))
* multiviewer properties ([50421b6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/50421b6190dab566afd23771efa66e9391679fc5))
* parse supportedVideoModes ([d199934](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d1999348b89cd25f3c785e43921aed10d81943d9))
* remaining multiviewer commands ([f241a0c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f241a0c43d8da41e9f91ef782a9aa2945230d322))
* replace big-integer with native bigint ([3683968](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3683968139e5da62ecebb0505e57f09f9e33a10d))
* rounded corners on multiviewer labels ([f8b44bf](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f8b44bf17c952097f5ef12a1fac081c0372879cb))
* startup state commands ([7d54c00](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7d54c003e1c516ca058b5336958a27868e834e27))
* upstream keyer keyframe commands ([087b918](https://github.com/Sofie-Automation/sofie-atem-connection/commit/087b9187dc854c0d9dd727a9747d188182033742))


### Bug Fixes

* audio encoding on newer atems ([1bcaf83](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1bcaf8330c5e253fb544eed4cf06ea69e34ed08c))
* expose multiviewer properties command ([16c3cdd](https://github.com/Sofie-Automation/sofie-atem-connection/commit/16c3cdd6b7fedb4770a2841ff193b1930de7eeb5))
* expose startup state commands ([1fecaa3](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1fecaa38787ff2251d2e7e371a9d3f55f9ddef61))
* FairlightMixerSourceEqualizerBandCommand incorrect state updating ([be8c961](https://github.com/Sofie-Automation/sofie-atem-connection/commit/be8c96133489cd6b5bb6f9d960b95f2dede4d2ed))
* FTDC signals end of macro download ([a22861f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a22861fca082e1c8f896f729c4bf5218ee3209b0))
* improve multiviewer text rendering ([9c06dd2](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9c06dd22000f1c3145d95d808af88b4881a1ce75))
* lint and updates ([b321988](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b321988cba698dee6443a4986fe48b81279cffd2))
* MixEffectKeyFlyKeyframeGetCommand using wrong state array index ([ffb347e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ffb347e023cdaa54277e9ab6f4e8930661327cf9))
* multiview upload ([9109e33](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9109e33ed7b9b6f4d2d27505f2e55dbfa522df46))
* reduce cross worker-thread boundary code imports ([0de261e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/0de261e03905e6706d0537a48f75189cca616fd0))
* replace freetype2 with @julusian/freetype2 ([ab0e528](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ab0e5283c0af5da5c9679cb92ed0f36c67517521))
* restructure fairlight eq state to be more logical (for users) ([8bd5c28](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8bd5c2858eb76c3aee4737cf9686960615104b91))
* tests ([f8145aa](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f8145aa7ef03cd35e4b7ea0a58de45642ffa631d))
* tweak 4k sizings ([8387b4a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8387b4aedb804566882b6eadaea74cdc8a9f9f35))
* update threadedclass ([50377ec](https://github.com/Sofie-Automation/sofie-atem-connection/commit/50377ecb44912a91a8d17a0e9f63af387eb44848))
* Updated URLs to match the renamed repo ([947b77d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/947b77de684a2958c9dc47abce00189ab40f2b5c))
* Updated URLs to match the renamed repo ([51183bd](https://github.com/Sofie-Automation/sofie-atem-connection/commit/51183bda0ddfd22c2c04cd54d2a7742d8387efb9))
* uploading unit tests ([47fcc05](https://github.com/Sofie-Automation/sofie-atem-connection/commit/47fcc053d092207ea2aeafd218ffc90d14dac79e))
* use custom font. better vertical alignment ([346ecb6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/346ecb6d88e27fc1866f4f60e86dbf37a96d324e))

## [2.4.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/2.3.1...2.4.0) (2021-11-15)


### Features

* add support for Media Pool settings ([#121](https://github.com/Sofie-Automation/sofie-atem-connection/issues/121)) ([b1969c5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b1969c54ef308eadc578d6ed93d95e837c0d6e54))
* add support for Media Pool settings ([#121](https://github.com/Sofie-Automation/sofie-atem-connection/issues/121)) ([b1969c5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b1969c54ef308eadc578d6ed93d95e837c0d6e54))

### [2.3.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/2.3.0...2.3.1) (2021-10-08)


### Bug Fixes

* unable to upload to clip 3 or 4 ([0bd3519](https://github.com/Sofie-Automation/sofie-atem-connection/commit/0bd3519a463650a0960af2ab3e87982c9082e05b))
* unable to upload to clip 3 or 4 ([0bd3519](https://github.com/Sofie-Automation/sofie-atem-connection/commit/0bd3519a463650a0960af2ab3e87982c9082e05b))

## [2.3.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/2.2.2...2.3.0) (2021-07-05)


### Features

* add mini-extreme and mini-extreme-iso ([51762f8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/51762f8a0d5567841ff7e7563462f16e8e1f5efd))
* add mini-extreme and mini-extreme-iso ([51762f8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/51762f8a0d5567841ff7e7563462f16e8e1f5efd))
* add new SourceAvailability enum values ([8963dd5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8963dd5575403e2998316c98125f434381b688c7))
* add new SourceAvailability enum values ([8963dd5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8963dd5575403e2998316c98125f434381b688c7))


### Bug Fixes

* typedoc publishing ([755a331](https://github.com/Sofie-Automation/sofie-atem-connection/commit/755a33129da23e2f6941a46bc3c4146e3f91eee8))
* typedoc publishing ([755a331](https://github.com/Sofie-Automation/sofie-atem-connection/commit/755a33129da23e2f6941a46bc3c4146e3f91eee8))
* utf8 encode strings ([abcff0c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/abcff0c74a51b3ffb4880106b87109a7fc72b9ec))
* utf8 encode strings ([abcff0c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/abcff0c74a51b3ffb4880106b87109a7fc72b9ec))

### [2.2.2](https://github.com/Sofie-Automation/sofie-atem-connection/compare/2.2.1...2.2.2) (2021-03-03)

### [2.2.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/2.2.0...2.2.1) (2021-03-03)

## [2.2.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/2.1.0...2.2.0) (2021-03-03)


### Features

* github actions ([#103](https://github.com/Sofie-Automation/sofie-atem-connection/issues/103)) ([017898a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/017898a62ea94346cf01721167ecaca601b66b3a))
* github actions ([#103](https://github.com/Sofie-Automation/sofie-atem-connection/issues/103)) ([017898a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/017898a62ea94346cf01721167ecaca601b66b3a))
* support for flying key 'Run to' (to keyframe and to infinite) ([#102](https://github.com/Sofie-Automation/sofie-atem-connection/issues/102)) ([7ccc292](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7ccc292d8eda16cb0e5830b0c128f26f0127a684))
* support for flying key 'Run to' (to keyframe and to infinite) ([#102](https://github.com/Sofie-Automation/sofie-atem-connection/issues/102)) ([7ccc292](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7ccc292d8eda16cb0e5830b0c128f26f0127a684))


### Bug Fixes

* Incorrect paths returned from applyToState ([66bb5be](https://github.com/Sofie-Automation/sofie-atem-connection/commit/66bb5be76b9faf5b7ac5e6c903136a726c13cfec))
* Incorrect paths returned from applyToState ([66bb5be](https://github.com/Sofie-Automation/sofie-atem-connection/commit/66bb5be76b9faf5b7ac5e6c903136a726c13cfec))

## [2.1.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/2.0.0...2.1.0) (2020-09-16)


### Features

* atem mini streaming and recording ([7fd86b9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7fd86b9c1b683e2b180f75f04a4dac0b7e7e1814))
* atem mini streaming and recording ([7fd86b9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7fd86b9c1b683e2b180f75f04a4dac0b7e7e1814))
* basic fairlight audio ([13f46a6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/13f46a6c28c4f38d043ae0e721026e273432f0f8))
* basic fairlight audio ([13f46a6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/13f46a6c28c4f38d043ae0e721026e273432f0f8))
* make classic audio optional ([73ee0f6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/73ee0f6f8ea24462983d9dd61f1322be3db717c5))
* make classic audio optional ([73ee0f6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/73ee0f6f8ea24462983d9dd61f1322be3db717c5))


### Bug Fixes

* use big-integer instead of native bigint for node8 support ([a1cc735](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a1cc7353b7e4fc1cff416b978f50b8d7f8d72c97))
* use big-integer instead of native bigint for node8 support ([a1cc735](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a1cc7353b7e4fc1cff416b978f50b8d7f8d72c97))

## [2.0.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/1.3.2...2.0.0) (2020-08-17)


### Features

* add missing videomodes ([543ef69](https://github.com/Sofie-Automation/sofie-atem-connection/commit/543ef69173dae0696f2245a00f23f40d9f40dbdb))
* add missing videomodes ([543ef69](https://github.com/Sofie-Automation/sofie-atem-connection/commit/543ef69173dae0696f2245a00f23f40d9f40dbdb))
* add remaining macro commands ([8af7a0f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8af7a0fb0ddb7b44c8a47f78c22754ceae7491ee))
* add remaining macro commands ([8af7a0f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8af7a0fb0ddb7b44c8a47f78c22754ceae7491ee))
* add test to ensure all serialized properties are covered by MaskFlags (when appropriate) ([bf688ba](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bf688baa8ee5128d9d50f4fe48789053ebfb7c51))
* add test to ensure all serialized properties are covered by MaskFlags (when appropriate) ([bf688ba](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bf688baa8ee5128d9d50f4fe48789053ebfb7c51))
* Add tests to ensure device connection is successful ([1f7ef94](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1f7ef94d393f6f176c3e4159cac5199b05b6314a))
* Add tests to ensure device connection is successful ([1f7ef94](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1f7ef94d393f6f176c3e4159cac5199b05b6314a))
* attempt to handle out of range features safely ([062e977](https://github.com/Sofie-Automation/sofie-atem-connection/commit/062e9775ed67982bbd02b530aea180fe6c20ffd9))
* attempt to handle out of range features safely ([062e977](https://github.com/Sofie-Automation/sofie-atem-connection/commit/062e9775ed67982bbd02b530aea180fe6c20ffd9))
* batch commands ([1ac7da8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1ac7da862c66cc57b82a37c98b51cc5dcfa4e682))
* batch commands ([1ac7da8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1ac7da862c66cc57b82a37c98b51cc5dcfa4e682))
* don't validate deserialized commands values are in range ([29e61bd](https://github.com/Sofie-Automation/sofie-atem-connection/commit/29e61bd7fbeb567ef9861e7585216aa672039ae7))
* don't validate deserialized commands values are in range ([29e61bd](https://github.com/Sofie-Automation/sofie-atem-connection/commit/29e61bd7fbeb567ef9861e7585216aa672039ae7))
* emit more events in batches, rather than for individual commands ([f646e92](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f646e923afd1d18bf186247e065d17b6ec52a1db))
* emit more events in batches, rather than for individual commands ([f646e92](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f646e923afd1d18bf186247e065d17b6ec52a1db))
* ensure state update after deserialize is successful ([24eb1da](https://github.com/Sofie-Automation/sofie-atem-connection/commit/24eb1da8981217b75b65cbcb4145cef850268d64))
* ensure state update after deserialize is successful ([24eb1da](https://github.com/Sofie-Automation/sofie-atem-connection/commit/24eb1da8981217b75b65cbcb4145cef850268d64))
* expose childProcessTimeout to resolve issues if the default timeout is too low ([724d5aa](https://github.com/Sofie-Automation/sofie-atem-connection/commit/724d5aaa142f23afc62f5ee53d572501a541cfa4))
* expose childProcessTimeout to resolve issues if the default timeout is too low ([724d5aa](https://github.com/Sofie-Automation/sofie-atem-connection/commit/724d5aaa142f23afc62f5ee53d572501a541cfa4))
* individual commands cannot be rejected ([35a85a5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/35a85a5c13d84e58e89c2a1aa3e1c253b2968dbe))
* individual commands cannot be rejected ([35a85a5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/35a85a5c13d84e58e89c2a1aa3e1c253b2968dbe))
* macro record ([d9d9a3f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d9d9a3f6a461e3b970332b9265d72fd3da5be467))
* macro record ([d9d9a3f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d9d9a3f6a461e3b970332b9265d72fd3da5be467))
* parse multiviewerConfigCommand ([06ec5a5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/06ec5a5357fe10f5893d9ee057a7145b93b2ce88))
* parse multiviewerConfigCommand ([06ec5a5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/06ec5a5357fe10f5893d9ee057a7145b93b2ce88))
* parse some more deviceprofile commands ([137d135](https://github.com/Sofie-Automation/sofie-atem-connection/commit/137d135bc73b5bf68ef6907ba55f0cb4465eb620))
* parse some more deviceprofile commands ([137d135](https://github.com/Sofie-Automation/sofie-atem-connection/commit/137d135bc73b5bf68ef6907ba55f0cb4465eb620))
* refactor state to be purely interfaces, to allow for better cloning ([2f1dd1a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/2f1dd1adf05489ed45cfca748e8e60c70577bac2))
* refactor state to be purely interfaces, to allow for better cloning ([2f1dd1a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/2f1dd1adf05489ed45cfca748e8e60c70577bac2))
* Replace usage of fork with threadedClass ([d20b185](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d20b1852041e81dde5a25d3ddd52ac8e30697dad))
* Replace usage of fork with threadedClass ([d20b185](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d20b1852041e81dde5a25d3ddd52ac8e30697dad))
* retransmit on demand and handle impossible retransmits by resetting the connection ([537d907](https://github.com/Sofie-Automation/sofie-atem-connection/commit/537d90701959fa4c99e478814e53d4ea2f664e79))
* retransmit on demand and handle impossible retransmits by resetting the connection ([537d907](https://github.com/Sofie-Automation/sofie-atem-connection/commit/537d90701959fa4c99e478814e53d4ea2f664e79))
* rewrite command comparison tests, and add new properties to state ([9b6295b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9b6295b520b18ca2a28c6b382a56abe0809bf2c8))
* rewrite command comparison tests, and add new properties to state ([9b6295b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9b6295b520b18ca2a28c6b382a56abe0809bf2c8))
* some changes for atem-state ([e681623](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e681623db01636c5b7b60a2d4d17f93417e3fa7f))
* some changes for atem-state ([e681623](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e681623db01636c5b7b60a2d4d17f93417e3fa7f))
* some tidying of socket-child and parsing of previously unknown PacketFlag ([42a99c9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/42a99c92dda698d75fab5036909be2e9225a9a28))
* some tidying of socket-child and parsing of previously unknown PacketFlag ([42a99c9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/42a99c92dda698d75fab5036909be2e9225a9a28))
* split Atem into a BasicAtem base class, as an easier to mock alternative when commands are constructed manually ([d6e02d8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d6e02d806f407678284fb1c9e9ed34bd5a68ae05))
* split Atem into a BasicAtem base class, as an easier to mock alternative when commands are constructed manually ([d6e02d8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d6e02d806f407678284fb1c9e9ed34bd5a68ae05))
* strict tsconfig and use threadedClass ([#60](https://github.com/Sofie-Automation/sofie-atem-connection/issues/60)) ([a830261](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a830261afba4c0736ed6ae3df2ce31f16d55f9ce))
* strict tsconfig and use threadedClass ([#60](https://github.com/Sofie-Automation/sofie-atem-connection/issues/60)) ([a830261](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a830261afba4c0736ed6ae3df2ce31f16d55f9ce))
* tests for audio and clips uploading ([d1cf174](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d1cf1741bc2c97f4e39dc8960e41234c76ee50e0))
* tests for audio and clips uploading ([d1cf174](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d1cf1741bc2c97f4e39dc8960e41234c76ee50e0))
* throw InvalidIdError when trying to applyToState. These are only logged at the debug level. Tidy up the logging to be events emitted from the Atem class. ([d4f26ee](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d4f26ee8393c5314ea819d3d935360a4ed85f159))
* throw InvalidIdError when trying to applyToState. These are only logged at the debug level. Tidy up the logging to be events emitted from the Atem class. ([d4f26ee](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d4f26ee8393c5314ea819d3d935360a4ed85f159))
* unlock media pool as part of transfer. this avoids race conditions when doing multiple uploads ([14dda0b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/14dda0b9509d55a209193f4a3f54367d0b7c29a4))
* unlock media pool as part of transfer. this avoids race conditions when doing multiple uploads ([14dda0b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/14dda0b9509d55a209193f4a3f54367d0b7c29a4))
* update threadedclass ([8f39d18](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8f39d1897c0faa7b6f15a9d1eb8d79e8008ff795))
* update threadedclass ([8f39d18](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8f39d1897c0faa7b6f15a9d1eb8d79e8008ff795))
* updateProps only updates the valid properties (according to the mask). Returns true if anything was changed ([7d48ff6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7d48ff6d73ba40f6697e147b962a3f21714e6a4c))
* updateProps only updates the valid properties (according to the mask). Returns true if anything was changed ([7d48ff6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7d48ff6d73ba40f6697e147b962a3f21714e6a4c))
* use eventemitter3 to give easier stronger eventemitter typings ([9f7a0c8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9f7a0c82eac3e941610e588f81cfa4d62d426890))
* use objects instead of sparse arrays ([97d0522](https://github.com/Sofie-Automation/sofie-atem-connection/commit/97d0522813fccd266b83c51f41a832c9fd85a1d7))
* **tests:** For atemsocket class (child process wrapper) ([caa9ac5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/caa9ac54d39173476c75da4cd82919c85c31c67a))
* **tests:** For atemsocket class (child process wrapper) ([caa9ac5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/caa9ac54d39173476c75da4cd82919c85c31c67a))
* **tests:** Tests for basic atem methods ([c0a2471](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c0a2471a022c21f8265e186858c460a4851f68aa))
* use eventemitter3 to give easier stronger eventemitter typings ([9f7a0c8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9f7a0c82eac3e941610e588f81cfa4d62d426890))
* use objects instead of sparse arrays ([97d0522](https://github.com/Sofie-Automation/sofie-atem-connection/commit/97d0522813fccd266b83c51f41a832c9fd85a1d7))
* **tests:** Tests for basic atem methods ([c0a2471](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c0a2471a022c21f8265e186858c460a4851f68aa))


### Bug Fixes

* add atem-mini id ([6be1024](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6be10243d7fbb7fe19dce6c821c2e1a8f4ceb66f))
* add atem-mini id ([6be1024](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6be10243d7fbb7fe19dce6c821c2e1a8f4ceb66f))
* add MiniPro model enum ([7905c51](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7905c51f4af6454ff6569718e0c9cc3d460c9132))
* add MiniPro model enum ([7905c51](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7905c51f4af6454ff6569718e0c9cc3d460c9132))
* add usk mask into typings ([f29fb8d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f29fb8de9edf1aa9e48aa4d92acba6c9f2951c6d))
* add usk mask into typings ([f29fb8d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f29fb8de9edf1aa9e48aa4d92acba6c9f2951c6d))
* create new state object on connection start ([a451a90](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a451a90d997cc95595efa68f5fe746ab2b487758))
* create new state object on connection start ([a451a90](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a451a90d997cc95595efa68f5fe746ab2b487758))
* do a todo ([77ef0d1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/77ef0d164df68f4f2340ab732cd8c5d7c96818c2))
* do a todo ([77ef0d1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/77ef0d164df68f4f2340ab732cd8c5d7c96818c2))
* ensure the retransmit fromId is within range ([447f1d1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/447f1d1d256daab2eee6326fd9c39bd6723e0da4))
* ensure the retransmit fromId is within range ([447f1d1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/447f1d1d256daab2eee6326fd9c39bd6723e0da4))
* export keyer state types ([17b1fdb](https://github.com/Sofie-Automation/sofie-atem-connection/commit/17b1fdb70b314c171d6301b3948129b62935da0e))
* export keyer state types ([17b1fdb](https://github.com/Sofie-Automation/sofie-atem-connection/commit/17b1fdb70b314c171d6301b3948129b62935da0e))
* failing tests ([3b76248](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3b762487b44a5f8f95f2e78246fd004e2b89a1c6))
* failing tests ([3b76248](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3b762487b44a5f8f95f2e78246fd004e2b89a1c6))
* firmware v8.1.1 / protocol v2.30 changes topology command ([#80](https://github.com/Sofie-Automation/sofie-atem-connection/issues/80)) ([cd3f386](https://github.com/Sofie-Automation/sofie-atem-connection/commit/cd3f386009b198626705687fcceacaa7b5c06f6d))
* firmware v8.1.1 / protocol v2.30 changes topology command ([#80](https://github.com/Sofie-Automation/sofie-atem-connection/issues/80)) ([cd3f386](https://github.com/Sofie-Automation/sofie-atem-connection/commit/cd3f386009b198626705687fcceacaa7b5c06f6d))
* format received buffers as hex in debug messages ([611d12c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/611d12c579f318750c4f140a041c7a16703ab6a0))
* format received buffers as hex in debug messages ([611d12c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/611d12c579f318750c4f140a041c7a16703ab6a0))
* gracefully emit error if applyToState fails ([698c19e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/698c19e4a364c2f5ce4f073b965454212353dfa5))
* gracefully emit error if applyToState fails ([698c19e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/698c19e4a364c2f5ce4f073b965454212353dfa5))
* handle udp message errors gracefully ([022918c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/022918ce5f92ff452e947ccd90ca2cd78bd7f8e4))
* handle udp message errors gracefully ([022918c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/022918ce5f92ff452e947ccd90ca2cd78bd7f8e4))
* ignore dve commands if not supported ([aa9cea6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/aa9cea64fa470d429a3ee3c79f22d025a1f7ca5a))
* ignore dve commands if not supported ([aa9cea6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/aa9cea64fa470d429a3ee3c79f22d025a1f7ca5a))
* ignore properties set to undefined in updateProps ([7b40374](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7b4037414df5c1df63589a72fb9e2efa37b7bf45))
* ignore properties set to undefined in updateProps ([7b40374](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7b4037414df5c1df63589a72fb9e2efa37b7bf45))
* incorrectly handling acks for sent packets around the wrap point ([b261ee2](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b261ee2dbd563e1b8e88b89c499a3f547508b989))
* incorrectly handling acks for sent packets around the wrap point ([b261ee2](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b261ee2dbd563e1b8e88b89c499a3f547508b989))
* lint ([d9471ef](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d9471efc13210b88127d50aa0a1adc598e5ecfea))
* lint ([d9471ef](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d9471efc13210b88127d50aa0a1adc598e5ecfea))
* make cleanup of connections better ([8b840f4](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8b840f4af98db59388937c2a8bb6a4a12e794bb8))
* make cleanup of connections better ([8b840f4](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8b840f4af98db59388937c2a8bb6a4a12e794bb8))
* make more state properties readonly ([e5e57e7](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e5e57e7153ebb0980b082e308354cfa8f0a6e173))
* make more state properties readonly ([e5e57e7](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e5e57e7153ebb0980b082e308354cfa8f0a6e173))
* move exit-hook inside dataTransferManager to ensure it gets run when needed ([a9f5269](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a9f52698eefd0677971beeb94c08d1f7d7826ee4))
* move exit-hook inside dataTransferManager to ensure it gets run when needed ([a9f5269](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a9f52698eefd0677971beeb94c08d1f7d7826ee4))
* multiview source set command ([5575e9b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/5575e9bba7138f8869e9af8cd0300216bbd0fa1b))
* multiview source set command ([5575e9b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/5575e9bba7138f8869e9af8cd0300216bbd0fa1b))
* not resending packets when id has wrapped and retransmit is needed for just before the wrap ([1b32e35](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1b32e35a924bb7ad5a11ea805001ec36ef8ecdd8))
* not resending packets when id has wrapped and retransmit is needed for just before the wrap ([1b32e35](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1b32e35a924bb7ad5a11ea805001ec36ef8ecdd8))
* outdated test ([eb05a5c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/eb05a5cf896c68162348349f77a0e15128fcc864))
* outdated test ([eb05a5c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/eb05a5cf896c68162348349f77a0e15128fcc864))
* packet management incorrect if one times out ([b136ac0](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b136ac0f08f74efeb38e4a3854136336d9d252ad))
* packet management incorrect if one times out ([b136ac0](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b136ac0f08f74efeb38e4a3854136336d9d252ad))
* publish master to correct npm tag ([040f343](https://github.com/Sofie-Automation/sofie-atem-connection/commit/040f343d34bcfd3b934cef46f8bfdcbaf5c59ebf))
* publish master to correct npm tag ([040f343](https://github.com/Sofie-Automation/sofie-atem-connection/commit/040f343d34bcfd3b934cef46f8bfdcbaf5c59ebf))
* replace IPCMessageType with stricter basic strings ([3b07d0a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3b07d0a2d0b6394f851ab76346f72d84f679dd44))
* replace IPCMessageType with stricter basic strings ([3b07d0a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3b07d0a2d0b6394f851ab76346f72d84f679dd44))
* restructure transitionPosition properties in the state ([2aa7d14](https://github.com/Sofie-Automation/sofie-atem-connection/commit/2aa7d1499a6da4acc92023e35120736ba139f508))
* restructure transitionPosition properties in the state ([2aa7d14](https://github.com/Sofie-Automation/sofie-atem-connection/commit/2aa7d1499a6da4acc92023e35120736ba139f508))
* some command tests ([0086eee](https://github.com/Sofie-Automation/sofie-atem-connection/commit/0086eeebf15890d9efb5a0042d4e5635ef4d9a2e))
* some command tests ([0086eee](https://github.com/Sofie-Automation/sofie-atem-connection/commit/0086eeebf15890d9efb5a0042d4e5635ef4d9a2e))
* some defaults ([85ac91f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/85ac91f8402af4bb3798dbc4540ee4a7f6a85dc7))
* some defaults ([85ac91f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/85ac91f8402af4bb3798dbc4540ee4a7f6a85dc7))
* some more command tests ([4e5b5a7](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4e5b5a745b5f27738af14bf04a835d951768de3c))
* some more command tests ([4e5b5a7](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4e5b5a745b5f27738af14bf04a835d951768de3c))
* some topologyCommand properties using wrong index in 8.1.1+ ([11a05c0](https://github.com/Sofie-Automation/sofie-atem-connection/commit/11a05c0ef3e4f510307052dd9a7c80d2276ec945))
* some topologyCommand properties using wrong index in 8.1.1+ ([11a05c0](https://github.com/Sofie-Automation/sofie-atem-connection/commit/11a05c0ef3e4f510307052dd9a7c80d2276ec945))
* tests ([6048802](https://github.com/Sofie-Automation/sofie-atem-connection/commit/604880249b6942b632a0ffd528ef52b41d316646))
* tests ([e57d44c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e57d44c322dc22da99f672629a9fff53caf831c7))
* tests ([6048802](https://github.com/Sofie-Automation/sofie-atem-connection/commit/604880249b6942b632a0ffd528ef52b41d316646))
* tests ([e57d44c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e57d44c322dc22da99f672629a9fff53caf831c7))
* tidy up multiviewer state object ([c31fc1a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c31fc1a1c239089aaea0e76600fe6e9735f3079a))
* tidy up multiviewer state object ([c31fc1a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c31fc1a1c239089aaea0e76600fe6e9735f3079a))
* tidying ([cb255fb](https://github.com/Sofie-Automation/sofie-atem-connection/commit/cb255fb0294c28d0fea1ef9165574afc9738eb84))
* tidying ([cb255fb](https://github.com/Sofie-Automation/sofie-atem-connection/commit/cb255fb0294c28d0fea1ef9165574afc9738eb84))
* TransitionMixCommand using wrong base class ([416a520](https://github.com/Sofie-Automation/sofie-atem-connection/commit/416a5205603c94120253394c421b7a00af89f981))
* TransitionMixCommand using wrong base class ([416a520](https://github.com/Sofie-Automation/sofie-atem-connection/commit/416a5205603c94120253394c421b7a00af89f981))
* try to fix broken test ([33a3da4](https://github.com/Sofie-Automation/sofie-atem-connection/commit/33a3da44943ac5a735316f1e23c6eb1f2a1d8084))
* try to fix broken test ([33a3da4](https://github.com/Sofie-Automation/sofie-atem-connection/commit/33a3da44943ac5a735316f1e23c6eb1f2a1d8084))
* tslint member-access rule ([b26293a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b26293a337a94746af454831f4c8e3cc47f2e6ec))
* tslint member-access rule ([b26293a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b26293a337a94746af454831f4c8e3cc47f2e6ec))
* typedoc ([bf27947](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bf279479ccd5bff95767b93334328b074af8ff18))
* typedoc ([bf27947](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bf279479ccd5bff95767b93334328b074af8ff18))
* upstream keyers using missing field to check validity ([d884eb1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d884eb1b120d972c110985c958cb27f3ccb9d935))
* upstream keyers using missing field to check validity ([d884eb1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d884eb1b120d972c110985c958cb27f3ccb9d935))
* use dev threadedclass and remove some hacks ([69c7d32](https://github.com/Sofie-Automation/sofie-atem-connection/commit/69c7d326d47921efee9830fdec155c24a04708d8))
* use dev threadedclass and remove some hacks ([69c7d32](https://github.com/Sofie-Automation/sofie-atem-connection/commit/69c7d326d47921efee9830fdec155c24a04708d8))
* wrap transferIndex once it reaches maximum ([234284e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/234284ea57d62189b654d6ec3886f9bba71836d3))
* wrap transferIndex once it reaches maximum ([234284e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/234284ea57d62189b654d6ec3886f9bba71836d3))

### [1.3.2](https://github.com/Sofie-Automation/sofie-atem-connection/compare/1.3.1...1.3.2) (2020-06-25)


### Bug Fixes

* listVisibleInputs with multiple levels of nesting ([6c1c848](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6c1c8480a261ec7029906b31af8df95f91ff6e29))
* listVisibleInputs with multiple levels of nesting ([6c1c848](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6c1c8480a261ec7029906b31af8df95f91ff6e29))

### [1.3.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/1.3.0...1.3.1) (2020-06-17)


### Bug Fixes

* pin broken dev-dependencies ([edfa595](https://github.com/Sofie-Automation/sofie-atem-connection/commit/edfa5955006f878ec7c4e63a62ab2fd7c761aa9a))
* pin broken dev-dependencies ([edfa595](https://github.com/Sofie-Automation/sofie-atem-connection/commit/edfa5955006f878ec7c4e63a62ab2fd7c761aa9a))
* TopologyCommand for v8.1.1+ ([1db6cf8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1db6cf83a241d983a8cedb1af8c9b95fba2b5d0e))
* TopologyCommand for v8.1.1+ ([1db6cf8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1db6cf83a241d983a8cedb1af8c9b95fba2b5d0e))

## [1.3.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/1.2.0...1.3.0) (2020-01-12)


### Features

* add TimeCommand and TimeRequestCommand ([6a95340](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6a953403be9fd930a47a14b38bd843028174c167))


### Bug Fixes

* add atem-mini ModelId ([b6787a9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b6787a92f4ad35b60020219d36878db818adbdfb))
* expose listVisibleInputs to allow explicit usage on an old/cached state ([ee69821](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ee69821ed25af8e6d8c999bcb5271e8d87b04b9f))

## [1.2.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/1.1.0...1.2.0) (2019-12-13)


### Features

* add listVisibleInputs method ([#57](https://github.com/Sofie-Automation/sofie-atem-connection/issues/57)) ([23c9318](https://github.com/Sofie-Automation/sofie-atem-connection/commit/23c93185fe05c4bf763aefd301717414a5ec8d88))
* expose setFadeToBlackRate ([fa974a4](https://github.com/Sofie-Automation/sofie-atem-connection/commit/fa974a4412344054eca0cf9950aa5943381452d7))


### Bug Fixes

* add missing TVS-pro models to Model enum ([8ac6777](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8ac67776e8a419bb41ac0e543545b73210029673))

## [1.1.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/1.0.2...1.1.0) (2019-10-24)


### Features

* refactor circleci config ([a7b0ca2](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a7b0ca249b9e104833e8abde6d97e82934c8a14d))
* update ci to run for node 8,10,12 ([25f1fb1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/25f1fb13d6c3d551ecc5f35ad05375858d18dcc7))


### Bug Fixes

* incorrect order in ci release step ([ca0d207](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ca0d207a04d8a19cd53308d83e05e12c2808f852))
* parse productIdentifierCommand successfully even for unknown models ([d991fdd](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d991fddabf84e977c7a53197a4208e717d68e782))
* SuperSourceConfigCommand broken ([ccc7d33](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ccc7d333e226ec0e7f9c09f640789d5520d7061a))

### [1.0.2](https://github.com/Sofie-Automation/sofie-atem-connection/compare/1.0.1...1.0.2) (2019-10-09)


### Bug Fixes

* media player source still & clip inverted ([6dec48f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6dec48f09e4c02d404578095bb7e2cac551d398c))

### [1.0.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/1.0.0...1.0.1) (2019-09-21)


### Bug Fixes

* better support for constellation ([b540f11](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b540f11))
* better support for constellation ([#58](https://github.com/Sofie-Automation/sofie-atem-connection/issues/58)) ([5bb512d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/5bb512d))

## [1.0.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.10.0...1.0.0) (2019-09-17)


### Bug Fixes

* broken autoDownstreamKey function and mangled multiviewer window state ([71c61f6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/71c61f6))
* consistent API for super source methods ([4327660](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4327660))
* data transfer uses old command names ([e6a6bd0](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e6a6bd0))
* disable unsupported v8 tests ([8bcafb5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8bcafb5))
* dve value range ([33784bc](https://github.com/Sofie-Automation/sofie-atem-connection/commit/33784bc))
* exclude test helpers in build ([041c37f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/041c37f))
* exit cleanly after running tests ([c23a9f9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c23a9f9))
* ignore failing tests ([8cfcfaf](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8cfcfaf))
* improve commandParser typings ([1e26d6d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1e26d6d))
* Make buffer use in serialize consistent. Remove setting command name in serialize. ([40eec6e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/40eec6e))
* More command test data mangling ([8bd9009](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8bd9009))
* multiviewer state initialization ([2547af1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/2547af1))
* regenerate commands test data ([fe619c4](https://github.com/Sofie-Automation/sofie-atem-connection/commit/fe619c4))
* restructure all command tests to use new structure ([957ed76](https://github.com/Sofie-Automation/sofie-atem-connection/commit/957ed76))
* some broken cases ([9ebde2e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9ebde2e))
* some more command serialization ([cf66953](https://github.com/Sofie-Automation/sofie-atem-connection/commit/cf66953))
* some tests ([3f14715](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3f14715))
* **AudioMixerInputCommand:** sign in deserialization  ([d9a3865](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d9a3865))
* **MediaPlayerSourceCommand:** order of serialization ([a0a89f3](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a0a89f3))
* **MixEffectFlyKeyFrameGetCommand:** correct validators ([a1648c1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a1648c1))
* tidy up some commented out code ([f1a1252](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f1a1252))
* topology command ([e5812d9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e5812d9))


### Features

* 8.0.1 support ([eaa1e72](https://github.com/Sofie-Automation/sofie-atem-connection/commit/eaa1e72))
* Add test for api methods which change command based on version ([7208ee4](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7208ee4))
* add test to verify that all commands have serialization test cases ([3cb9ae7](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3cb9ae7))
* Enable and fix v8 command tests ([3a7d23d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3a7d23d))
* enable running tests in circleci ([662638d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/662638d))
* expect commands to be split to be a serialize or deserialize (unless they use the same name for both) ([e9704f2](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e9704f2))
* FadeToBlack control ([660e8dc](https://github.com/Sofie-Automation/sofie-atem-connection/commit/660e8dc))
* initial multi-version support ([fedc690](https://github.com/Sofie-Automation/sofie-atem-connection/commit/fedc690))
* prototype serialize command ([010fff2](https://github.com/Sofie-Automation/sofie-atem-connection/commit/010fff2))
* prototype what separate command converter structures would look like ([378be83](https://github.com/Sofie-Automation/sofie-atem-connection/commit/378be83))
* restructure some core buffer usage, and move command header (length + name) writing into common command serialization code ([3c8b062](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3c8b062))
* split some commands ([beae1c4](https://github.com/Sofie-Automation/sofie-atem-connection/commit/beae1c4))
* stateChanged events report a path instead of the Command ([845909f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/845909f))

# [0.10.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.9.0...0.10.0) (2019-04-02)


### Bug Fixes

* fix error spam that occurs when the child process attempts to log certain data ([7c9e31c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7c9e31c))
* fixed parsing of audioMixer input ([3430cb7](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3430cb7))
* kill the child process with an error code with an uncaughtException or unhandledRejection occurs ([e5323c9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e5323c9))
* rename setAudioChannelXX methods to setAudioMixerInputXXX to harmonize with other audio commands ([77fe521](https://github.com/Sofie-Automation/sofie-atem-connection/commit/77fe521))
* set enum values explicitly ([bd50491](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bd50491))
* upgrade dependencies to pass audit ([98d16a8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/98d16a8))
* upgrade typescript to latest ([b68afbf](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b68afbf))
* **AudioMixerMasterCommand:** set flag properly ([78fa0b5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/78fa0b5))


### Features

* add support for MasterChannel ([722d744](https://github.com/Sofie-Automation/sofie-atem-connection/commit/722d744))



# [0.9.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.8.2...0.9.0) (2019-02-21)


### Bug Fixes

* AudioMixerInputCommand ([69608c7](https://github.com/Sofie-Automation/sofie-atem-connection/commit/69608c7))


### Features

* audio channels ([1b3bd32](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1b3bd32))
* top level methods for audio channels ([6c390d3](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6c390d3))



<a name="0.8.2"></a>
## [0.8.2](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.8.1...0.8.2) (2019-01-19)


### Bug Fixes

* one object per multiviewer in the state ([5f53526](https://github.com/Sofie-Automation/sofie-atem-connection/commit/5f53526))



<a name="0.8.1"></a>
## [0.8.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.8.0...0.8.1) (2018-11-26)


### Bug Fixes

* **perf:** remove nanotimer for intervals as it uses 100% cpu ([d7bc543](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d7bc543))
* let node bind to a random port for our udp socket ([b7be165](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b7be165))
* timers are cleaned when calling disconnect, even when not connected ([d3040d1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d3040d1))



<a name="0.8.0"></a>
# [0.8.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.7.0...0.8.0) (2018-11-02)


### Bug Fixes

* improve reliability of resending ([ccaa051](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ccaa051))


### Features

* Rename downstreamKeyId to downstreamKeyerId to make them all consistent and be consistent with upstream keyer ([58f61ee](https://github.com/Sofie-Automation/sofie-atem-connection/commit/58f61ee))
* use a nanotimer in socket child for ack'ing ([84482ca](https://github.com/Sofie-Automation/sofie-atem-connection/commit/84482ca))



<a name="0.7.0"></a>
# [0.7.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.6.1...0.7.0) (2018-10-24)


### Bug Fixes

* **atemSocket:** fix _maxPacketID being off-by-one ([ee70083](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ee70083))
* **atemSocket:** fix _maxPacketID being off-by-one ([4efecdd](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4efecdd))
* file description cmd does not always need name / descr. ([8837dd0](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8837dd0))
* **Data Command:** size property ([df16109](https://github.com/Sofie-Automation/sofie-atem-connection/commit/df16109))
* **Data Command:** size property ([35a846d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/35a846d))
* ack'ing after init ([8197ab5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8197ab5))
* behaviour around packetId wrapping ([d8e4626](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d8e4626))
* child process timeout ([8196d8e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8196d8e))
* colour space ([bb19e9e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bb19e9e))
* colour space ([8f295d3](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8f295d3))
* convencience method for setting clip in MP ([a8feeef](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a8feeef))
* convencience method for setting clip in MP ([b5455a3](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b5455a3))
* do not ack discontinuous packet sequences ([bfb679f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bfb679f))
* file description cmd does not always need name / descr. ([683d83b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/683d83b))
* frame description file name ([bc1224b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bc1224b))
* frame description file name ([1c7290d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1c7290d))
* **Data Transfer:** stop condition, send description only once ([bca847f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bca847f))
* lint ([666cff5](https://github.com/Sofie-Automation/sofie-atem-connection/commit/666cff5))
* lint ([61ba6f8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/61ba6f8))
* Media Player Source Command ([3103ca6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3103ca6))
* Media Player Source Command ([5c1ebb1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/5c1ebb1))
* messages without correct transferid will be ignored ([301c545](https://github.com/Sofie-Automation/sofie-atem-connection/commit/301c545))
* more aggressive resend strategy ([8900ded](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8900ded))
* optimize inFlightTimeout ([32b3c44](https://github.com/Sofie-Automation/sofie-atem-connection/commit/32b3c44))
* reject timed out commands ([fd3d045](https://github.com/Sofie-Automation/sofie-atem-connection/commit/fd3d045))
* revert new packetId on resend ([2fe6368](https://github.com/Sofie-Automation/sofie-atem-connection/commit/2fe6368))
* socket process exits when parent process does ([#30](https://github.com/Sofie-Automation/sofie-atem-connection/issues/30)) ([4754cc7](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4754cc7))
* **Data Transfer:** remove old commands after failing ([09ee4b4](https://github.com/Sofie-Automation/sofie-atem-connection/commit/09ee4b4))
* **Data Transfer:** remove old commands after failing ([dfa1cfc](https://github.com/Sofie-Automation/sofie-atem-connection/commit/dfa1cfc))
* **Data Transfer:** stop condition, send description only once ([627c9f2](https://github.com/Sofie-Automation/sofie-atem-connection/commit/627c9f2))
* **dataTransfer:** ignore unexpected DataTransferCompleteCommands ([1f97a4a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1f97a4a))
* **dataTransfer:** ignore unexpected DataTransferCompleteCommands ([517253d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/517253d))
* **dataTrasnfer:** fail when a DataTransferErrorCommand is received ([ba17501](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ba17501))
* **dataTrasnfer:** fail when a DataTransferErrorCommand is received ([441ef68](https://github.com/Sofie-Automation/sofie-atem-connection/commit/441ef68))
* **Media:** fix Util imports ([55a1f28](https://github.com/Sofie-Automation/sofie-atem-connection/commit/55a1f28))
* **Media:** fix Util imports ([7f0577a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7f0577a))


### Features

* clear media pool ([310308b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/310308b))
* clear media pool ([9f64e58](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9f64e58))
* **DataTransfer:** add errorCode property to DataTransferErrorCommand ([7e302e1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7e302e1))
* Data Commands ([d1bf2ba](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d1bf2ba))
* Data Commands ([2e14efb](https://github.com/Sofie-Automation/sofie-atem-connection/commit/2e14efb))
* **DataTransfer:** add errorCode property to DataTransferErrorCommand ([d8b2d5f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d8b2d5f))
* **Media:** Media Pool Description Commands ([fbae9b1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/fbae9b1))
* **Media:** Media Pool Description Commands ([5050fe8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/5050fe8))
* **Media Pool:** clear / set commands ([40fce0c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/40fce0c))
* **Media Pool:** clear / set commands ([a2ecc82](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a2ecc82))
* Media Upload API, File Transfer Manager ([c240477](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c240477))
* Media Upload API, File Transfer Manager ([c5e4684](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c5e4684))
* TransferManager ([a9336c9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a9336c9))
* TransferManager ([a2588a7](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a2588a7))
* TransferManager ([e3e69a1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e3e69a1))
* TransferManager ([ee3ed26](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ee3ed26))
* Video Mode command ([b9980e3](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b9980e3))
* Video Mode command ([c87c0b8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c87c0b8))


### Performance Improvements

* **dataTransfer:** increase transfer throughput ([db8e4c4](https://github.com/Sofie-Automation/sofie-atem-connection/commit/db8e4c4))
* **dataTransfer:** increase transfer throughput ([d96b38d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d96b38d))



<a name="0.6.1"></a>
## [0.6.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.6.0...0.6.1) (2018-10-23)


### Bug Fixes

* behaviour around packetId wrapping ([9c8e3a8](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9c8e3a8))
* do not ack discontinuous packet sequences ([91f36bf](https://github.com/Sofie-Automation/sofie-atem-connection/commit/91f36bf))
* do not ack discontinuous packet sequences ([1bde19d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1bde19d))
* more aggressive resend strategy ([d1fd66c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d1fd66c))
* optimize inFlightTimeout ([0812a63](https://github.com/Sofie-Automation/sofie-atem-connection/commit/0812a63))
* reject timed out commands ([a8cfa68](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a8cfa68))



<a name="0.6.0"></a>
# [0.6.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.5.2...0.6.0) (2018-10-16)


### Bug Fixes

* **DVE upstream key:** borderHueWidth is 3600 ([4b2db48](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4b2db48))


### Features

* parse psu status ([16f677f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/16f677f))
* Use device ModelId to determine how many psu to track in state ([f0631d1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f0631d1))



<a name="0.5.2"></a>
## [0.5.2](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.5.1...0.5.2) (2018-09-23)


### Bug Fixes

* **socket:** prevent connection from dying when the main thread is blocked ([#19](https://github.com/Sofie-Automation/sofie-atem-connection/issues/19)) ([6814713](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6814713))
* dsk state not being updated ([bcdea2b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/bcdea2b))



<a name="0.5.1"></a>
## [0.5.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.5.0...0.5.1) (2018-09-04)



<a name="0.5.0"></a>
# [0.5.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.4.0...0.5.0) (2018-08-17)


### Bug Fixes

* macro state is not an array, it's one "macro player" ([76c8b7b](https://github.com/Sofie-Automation/sofie-atem-connection/commit/76c8b7b))
* typo in super source boxes capabilities command ([f123694](https://github.com/Sofie-Automation/sofie-atem-connection/commit/f123694))


### Features

* implement MacroRunStatus command (MRPr) ([98f5650](https://github.com/Sofie-Automation/sofie-atem-connection/commit/98f5650))



<a name="0.4.0"></a>
# [0.4.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.3.2...0.4.0) (2018-08-15)


### Bug Fixes

* symmetry is a percentage ([3dd03a9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3dd03a9))


### Features

* Super Source Properties ([031df18](https://github.com/Sofie-Automation/sofie-atem-connection/commit/031df18))



<a name="0.3.2"></a>
## [0.3.2](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.3.1...0.3.2) (2018-08-14)


### Bug Fixes

* symmetry is a percentage ([93e751d](https://github.com/Sofie-Automation/sofie-atem-connection/commit/93e751d))



<a name="0.3.1"></a>
## [0.3.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.3.0...0.3.1) (2018-08-09)


### Bug Fixes

* reported transition position may be 10 000 ([c301808](https://github.com/Sofie-Automation/sofie-atem-connection/commit/c301808))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.2.3...0.3.0) (2018-08-07)


### Bug Fixes

* emit error upon failing value sanity check ([e11b3fa](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e11b3fa))
* export util ([004ef9a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/004ef9a))
* flyKeyFrameId is 1 or 2 ([b0ced83](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b0ced83))
* use an object when appriopriate ([7d13bd3](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7d13bd3))
* **atemSocket:** fix _maxPacketID being off-by-one ([28c1400](https://github.com/Sofie-Automation/sofie-atem-connection/commit/28c1400))


### Features

* value sanity checks ([9d2b021](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9d2b021))



<a name="0.2.3"></a>
## [0.2.3](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.2.2...0.2.3) (2018-08-07)


### Bug Fixes

* **atemSocket:** fix _maxPacketID being off-by-one ([e116c35](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e116c35))



<a name="0.2.2"></a>
## [0.2.2](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.2.1...0.2.2) (2018-08-06)



<a name="0.2.1"></a>
## [0.2.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.2.0...0.2.1) (2018-07-01)


### Bug Fixes

* typo ([41a29ff](https://github.com/Sofie-Automation/sofie-atem-connection/commit/41a29ff))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.1.7...0.2.0) (2018-07-01)


### Features

* disconnect method ([54dfa15](https://github.com/Sofie-Automation/sofie-atem-connection/commit/54dfa15))



<a name="0.1.7"></a>
## [0.1.7](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.1.6...0.1.7) (2018-06-21)


### Bug Fixes

* deserialization of preview,program and aux source ([3c0027e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3c0027e))



<a name="0.1.6"></a>
## [0.1.6](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.1.5...0.1.6) (2018-06-21)


### Bug Fixes

* supersource info commands ([2e13938](https://github.com/Sofie-Automation/sofie-atem-connection/commit/2e13938))



<a name="0.1.5"></a>
## [0.1.5](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.1.4...0.1.5) (2018-06-15)



<a name="0.1.4"></a>
## [0.1.4](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.1.3...0.1.4) (2018-06-15)


### Bug Fixes

* preview command sets the right property in the state ([103fabd](https://github.com/Sofie-Automation/sofie-atem-connection/commit/103fabd))



<a name="0.1.3"></a>
## [0.1.3](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.1.2...0.1.3) (2018-06-09)


### Bug Fixes

* AbstractCommand works with static MaskFlags ([360f266](https://github.com/Sofie-Automation/sofie-atem-connection/commit/360f266))



<a name="0.1.2"></a>
## [0.1.2](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.1.1...0.1.2) (2018-06-07)


### Bug Fixes

* export abstract command ([5c82037](https://github.com/Sofie-Automation/sofie-atem-connection/commit/5c82037))



<a name="0.1.1"></a>
## [0.1.1](https://github.com/Sofie-Automation/sofie-atem-connection/compare/0.1.0...0.1.1) (2018-06-07)


### Bug Fixes

* export Abstract Command ([88a12b6](https://github.com/Sofie-Automation/sofie-atem-connection/commit/88a12b6))
* MaskFlags are a static property ([ddafc4f](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ddafc4f))



<a name="0.1.0"></a>
# 0.1.0 (2018-06-05)


### Bug Fixes

* **API:** make properties a public member of commands ([a3b69d3](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a3b69d3))
* **Aux command:** set default bus to 1, add a mask in the raw command ([db4f0ba](https://github.com/Sofie-Automation/sofie-atem-connection/commit/db4f0ba))
* **DVE Upstream Keyer:** Correct word size ([9ba5635](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9ba5635))
* add correct ssh fingerprint ([6019e6e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/6019e6e))
* prevent garbage data from being added to productName ([5b3417a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/5b3417a))
* rename back to atem-connection ([e1b3e63](https://github.com/Sofie-Automation/sofie-atem-connection/commit/e1b3e63))
* rename library and add contributer ([a57299e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a57299e))
* **DVE Upstream Keyer:** property name should equal flag name ([d684198](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d684198))
* rename workflow for better readability ([7f1fbd9](https://github.com/Sofie-Automation/sofie-atem-connection/commit/7f1fbd9))
* safely get the downstream keyer ([25bf0f1](https://github.com/Sofie-Automation/sofie-atem-connection/commit/25bf0f1))
* **Socket:** local packetId should start at 1 ([2199e5c](https://github.com/Sofie-Automation/sofie-atem-connection/commit/2199e5c))
* set rawnames ([b68ad41](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b68ad41))
* **InputPropertiesCommand:** include the inputId of each source in the state tree ([3fdabba](https://github.com/Sofie-Automation/sofie-atem-connection/commit/3fdabba))
* **Socket:** fix parsing of packet name and length ([dc25ea7](https://github.com/Sofie-Automation/sofie-atem-connection/commit/dc25ea7))
* **Utility functions:** remove unnecessary utility functions ([a7d0f78](https://github.com/Sofie-Automation/sofie-atem-connection/commit/a7d0f78))
* tests ([4d3576a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4d3576a))
* update config for new features ([4682a64](https://github.com/Sofie-Automation/sofie-atem-connection/commit/4682a64))
* update ignores ([d79b224](https://github.com/Sofie-Automation/sofie-atem-connection/commit/d79b224))
* update scripts-info ([8508f98](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8508f98))
* use ASCII encoding for strings, instead of utf8 ([8978d49](https://github.com/Sofie-Automation/sofie-atem-connection/commit/8978d49))


### Features

* **Inputs:** implement InPr (read) and CInL (write) commands ([17e1688](https://github.com/Sofie-Automation/sofie-atem-connection/commit/17e1688))
* **Media Player Status:** get and set play/loop/atBeginning and frames ([664af37](https://github.com/Sofie-Automation/sofie-atem-connection/commit/664af37))
* **SuperSource:** implement SSBP (read) and CSBP (write) commands ([b21e56e](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b21e56e))
* Downstream Keyer Settings ([b90cf3a](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b90cf3a))
* export commands and substates ([9be9e61](https://github.com/Sofie-Automation/sofie-atem-connection/commit/9be9e61))
* Initialization Complete Command ([ba55c89](https://github.com/Sofie-Automation/sofie-atem-connection/commit/ba55c89))
* top level connection status events ([1f606ed](https://github.com/Sofie-Automation/sofie-atem-connection/commit/1f606ed))
* Topology Command ([0380432](https://github.com/Sofie-Automation/sofie-atem-connection/commit/0380432))
* use external logging function, limit packet logs to debug mode ([b92f175](https://github.com/Sofie-Automation/sofie-atem-connection/commit/b92f175))



<a name="0.5.1"></a>
## [0.5.1](https://bitbucket.org/superflytv/node-boilerplate/compare/0.5.0...0.5.1) (2018-02-25)


### Bug Fixes

* remove auto-deploy to npm ([5515b71](https://bitbucket.org/superflytv/node-boilerplate/commits/5515b71))



<a name="0.5.0"></a>
# [0.5.0](https://bitbucket.org/superflytv/node-boilerplate/compare/0.4.6...0.5.0) (2018-02-25)


### Bug Fixes

* adding release for one final publication ([7f11b78](https://bitbucket.org/superflytv/node-boilerplate/commits/7f11b78))
* Cleaning up repository ([ba7cafc](https://bitbucket.org/superflytv/node-boilerplate/commits/ba7cafc))
* cleanup ([562fb0c](https://bitbucket.org/superflytv/node-boilerplate/commits/562fb0c))


### Features

* Disable automatic rollout to NPM for now ([18dd79f](https://bitbucket.org/superflytv/node-boilerplate/commits/18dd79f))



<a name="0.4.6"></a>
## [0.4.6](https://github.com/superflytv/node-boilerplate/compare/0.4.5...0.4.6) (2018-02-25)


### Bug Fixes

* add tslib ([2447570](https://github.com/superflytv/node-boilerplate/commit/2447570))



<a name="0.4.5"></a>
## [0.4.5](https://github.com/superflytv/node-boilerplate/compare/0.4.4...0.4.5) (2018-02-25)


### Bug Fixes

* send coverage before release ([b53c1aa](https://github.com/superflytv/node-boilerplate/commit/b53c1aa))



<a name="0.4.4"></a>
## [0.4.4](https://github.com/superflytv/node-boilerplate/compare/0.4.3...0.4.4) (2018-02-25)


### Bug Fixes

* auto rollout to npm on master branch ([ef5d68f](https://github.com/superflytv/node-boilerplate/commit/ef5d68f))



<a name="0.4.3"></a>
## [0.4.3](https://github.com/superflytv/node-boilerplate/compare/0.4.2...0.4.3) (2018-02-25)


### Bug Fixes

* only allow spec.ts files ([027b4f2](https://github.com/superflytv/node-boilerplate/commit/027b4f2))
* use npm for npm deploy, for now ([0bb1911](https://github.com/superflytv/node-boilerplate/commit/0bb1911))



<a name="0.4.2"></a>
## [0.4.2](https://github.com/superflytv/node-boilerplate/compare/0.4.1...0.4.2) (2018-02-25)


### Bug Fixes

* add ssh key to npm step for ssh ([8ca98f5](https://github.com/superflytv/node-boilerplate/commit/8ca98f5))



<a name="0.4.1"></a>
## [0.4.1](https://github.com/superflytv/node-boilerplate/compare/v0.4.0...v0.4.1) (2018-02-25)


### Bug Fixes

* Set skip ci in auto-commit message and rename tag releases ([1338bd0](https://github.com/superflytv/node-boilerplate/commit/1338bd0))



<a name="0.4.0"></a>
# 0.4.0 (2018-02-25)


### Bug Fixes

* add ssh key to release build ([00a03c2](https://github.com/superflytv/node-boilerplate/commit/00a03c2))
* Auto-release on circleci ([64ba8d7](https://github.com/superflytv/node-boilerplate/commit/64ba8d7))
* Bugfix and add not strict for bitbucket ([0d5f60b](https://github.com/superflytv/node-boilerplate/commit/0d5f60b))
* casing issue ([71a7295](https://github.com/superflytv/node-boilerplate/commit/71a7295))
* changing to .org ([746f766](https://github.com/superflytv/node-boilerplate/commit/746f766))
* changing to .org ([b0837bc](https://github.com/superflytv/node-boilerplate/commit/b0837bc))
* Explicit coverage repoting ([1aac204](https://github.com/superflytv/node-boilerplate/commit/1aac204))
* indent style on yaml files ([3b3582b](https://github.com/superflytv/node-boilerplate/commit/3b3582b))
* indentation and paths wrong ([cad01af](https://github.com/superflytv/node-boilerplate/commit/cad01af))
* rearange commands ([c7ad4c1](https://github.com/superflytv/node-boilerplate/commit/c7ad4c1))
* Reordering workflow ([c912127](https://github.com/superflytv/node-boilerplate/commit/c912127))
* set correct ssh fingerprint ([616fc49](https://github.com/superflytv/node-boilerplate/commit/616fc49))
* Set git push command ([b825993](https://github.com/superflytv/node-boilerplate/commit/b825993))
* Set orgname ([9eb70e3](https://github.com/superflytv/node-boilerplate/commit/9eb70e3))
* setting git config ([a61c929](https://github.com/superflytv/node-boilerplate/commit/a61c929))
* Temporarily remove gh-pages publish ([c1cd735](https://github.com/superflytv/node-boilerplate/commit/c1cd735))
* use knownhost in stead of ssh config ([e432a10](https://github.com/superflytv/node-boilerplate/commit/e432a10))
* use knownhost in stead of ssh config ([3f37f75](https://github.com/superflytv/node-boilerplate/commit/3f37f75))


### Features

* full npm release cycle ([955863a](https://github.com/superflytv/node-boilerplate/commit/955863a))
* Initial boiler plate ([fbd16db](https://github.com/superflytv/node-boilerplate/commit/fbd16db))
* rename package for npm release ([53ac25c](https://github.com/superflytv/node-boilerplate/commit/53ac25c))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/superflytv/node-boilerplate/compare/v0.2.2...v0.3.0) (2018-02-25)


### Bug Fixes

* Auto-release on circleci ([64ba8d7](https://github.com/superflytv/node-boilerplate/commit/64ba8d7))
* Explicit coverage repoting ([1aac204](https://github.com/superflytv/node-boilerplate/commit/1aac204))
* indent style on yaml files ([3b3582b](https://github.com/superflytv/node-boilerplate/commit/3b3582b))


### Features

* full npm release cycle ([955863a](https://github.com/superflytv/node-boilerplate/commit/955863a))



<a name="0.2.2"></a>
## [0.2.2](https://github.com/superflytv/node-boilerplate/compare/v0.2.1...v0.2.2) (2018-02-24)



<a name="0.2.1"></a>
## [0.2.1](https://github.com/superflytv/node-boilerplate/compare/v0.2.0...v0.2.1) (2018-02-24)


### Bug Fixes

* Set orgname ([9eb70e3](https://github.com/superflytv/node-boilerplate/commit/9eb70e3))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/superflytv/node-boilerplate/compare/v0.1.0...v0.2.0) (2018-02-24)


### Features

* rename package for npm release ([53ac25c](https://github.com/superflytv/node-boilerplate/commit/53ac25c))



<a name="0.1.0"></a>
# 0.1.0 (2018-02-24)


### Bug Fixes

* casing issue ([71a7295](https://github.com/superflytv/node-boilerplate/commit/71a7295))


### Features

* Initial boiler plate ([fbd16db](https://github.com/superflytv/node-boilerplate/commit/fbd16db))
