# Developer Information

## Contributing

[How to Contribute to this Repository](/CONTRIBUTING.md).

## Code Style

This project uses [_Prettier_](https://prettier.io/) and [_ESLint_](https://eslint.org/) with [_TypeScript_](https://www.typescriptlang.org/).

There is a pre-commit hook to ensure any changes follow the enforced style, as well as [continuous integration](https://github.com/Sofie-Automation/sofie-atem-connection/actions) to help ensure any contributions follow the rules (as well as other checks).

It is recommended to install the _Prettier plugin_ for _VSCode_ while developing, as it will auto format the code whenever you save a file.

## TypeScript

This project uses _TypeScript_ to help with code quality and avoid type errors. Most changes won't have to deal with anything complex, but occasionally they will. We know _TypeScript_ isn't for everybody (especially in the strict mode we run it), and are happy to help you with the complex parts if you get stuck.

## API Stability

This library follows _semver_, so we want to avoid breaking changes if they are not necessary. We find that increasing the major version number too often causes excess maintainance burden for library users.

This means that any changes to the state object or the methods on the Atem class must be backwards compatbile with previous versions.

We are not including the commands in the stability guarantee. They are an internal detail. Some libraries will want to use them explicitly, in which case they should pin to a specific version of this library and make sure to check for any changes when updating.

## Adding New Commands

This project is based on the work of the [_C# LibAtem_](https://github.com/libatem/libatem). We work closely with the author of that library to develop this one, and to generate accurate test data.
_LibAtem_ mostly has 100% coverage of the atem commands, so it can be used as a reference for adding new ones to this library. So before you break out wireshark, [look up the matching command in here](https://github.com/LibAtem/LibAtem/tree/master/LibAtem/Commands).

## Updating a Command

Sometimes Blackmagic Design makes a breaking change in the protocol that requires various commands to be updated.

We generally try to handle this completely inside the `serialize()` or `deserialize()` methods of the Command, by checking against the protocol version, but sometimes it is more appropriate to use a new class instead. A new class is generally required if there are significant changes to how it maps onto the state object, or major changes to the structure/layout of the command.

## Porting Commands from _LibAtem_

We generally do not follow the naming conventions used in _LibAtem_, and instead use our own.

A good example of how things translate is [SuperSourceBoxParameters](/src/commands/SuperSource/SuperSourceBoxParametersCommand.ts). This has a command for each direction, and shows how the simple versioning can be handled. The equivalent in _LibAtem_ is [SuperSourceBoxGetV8Command](https://github.com/LibAtem/LibAtem/blob/master/LibAtem/Commands/SuperSource/SuperSourceBoxGetV8Command.cs) and [SuperSourceBoxSetV8Command](https://github.com/LibAtem/LibAtem/blob/master/LibAtem/Commands/SuperSource/SuperSourceBoxSetV8Command.cs).

Hopefully the _C#_ attribute annotations are clear enough in explaining the encoding, if not ask us and that can be documented here.

A few things to note about our commands, there are a few different base interfaces to choose from:

- `DeserializedCommand<T>` is for commands which shall be received
- `BasicWritableCommand<T>` is for commands which shall be sent, which do not have a flags property
- `WritableCommand<T>` is for commands which shall be sent, which have a flags property

The flags property is a way of the command to tell the atem to only update a few fields.

You may notice some properties being inside the `<T>`(properties) type and some residing solely on the command class itself. The ones on the class are the 'id' properties (labelled in _LibAtem_ as _CommandId_). These identify where it resides in the state and are always set via the constructor. The other properties are the 'data' portion of the command.

Once you have written a draft of the command, make sure the file it is in is imported up via the various index.ts files in the folder structure. This will let the parser and tests find the new command implementation.

Then try running the tests.
If you get a failure like...

```
 FAIL  src/commands/__tests__/index.spec.ts (52.617s)
  ● Commands vs LibAtem › Test #1006: RFlK (V7_2) - Serialize

    expect(received).toEqual(expected) // deep equality

    Expected: "02-00-00-00-00-00-00-00"
    Received: "00-02-03-00-02-04-00-00"
```

...then we already have some test data for this command that needs a bit of tweaking. You can fix this by defining the property name mappings in [converters-default.ts](src/commands/__tests__/converters-default.ts). This maps between the _ATEM-Connection_ and _LibAtem_ namings.  
It is also possible that our test data is wrong. Feel free to query that once you have tested the command against an ATEM device.

If you get a failure like...

```
TODO
```

...then we do not have any auto-generated test data for this command currently. Ignore this for now and let us know in the PR and we shall get the necessary data for you.

## Writing a New Command

We do not do this often enough to document it properly right now.  
Porting from _LibAtem_ gives us good unit tests, and makes the process simpler (they can do tests against the official SDK).

## Some Useful Links

- https://github.com/peschuster/wireshark-atem-dissector
- https://github.com/LibAtem/AtemUtils
