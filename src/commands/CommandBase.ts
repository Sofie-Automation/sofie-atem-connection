import { AtemState } from '../state/index.js'
import { ProtocolVersion } from '../enums/index.js'

export interface IDeserializedCommand {
	properties: any

	applyToState(state: AtemState): string | string[]
}

/** Base type for a receivable command */
export abstract class DeserializedCommand<T> implements IDeserializedCommand {
	public static readonly rawName?: string
	public static readonly minimumVersion?: ProtocolVersion

	public readonly properties: Readonly<T>

	constructor(properties: T) {
		this.properties = properties
	}

	public abstract applyToState(state: AtemState): string | string[]
}

export interface ISerializableCommand {
	serialize(version: ProtocolVersion): Buffer
	/**
	 * Controls the command's execution order and batching.
	 *
	 * Lower values run **earlier**. Commands with different `runOrderGroup` values
	 * will not be processed in the same batch.
	 *
	 * Defaults to 0. Use a **negative value** to ensure execution before the default group.
	 */
	runOrderGroup?: number
}

/** Base command type for a simple writable command, which has a few values which must all be sent */
export abstract class BasicWritableCommand<T> implements ISerializableCommand {
	public static readonly rawName?: string
	public static readonly minimumVersion?: ProtocolVersion

	/** @link ISerializableCommand.runOrderGroup */
	public runOrderGroup?: number = 0

	protected _properties: T

	public get properties(): Readonly<T> {
		return this._properties
	}

	constructor(properties: T) {
		this._properties = properties
	}

	public abstract serialize(version: ProtocolVersion): Buffer
}

/** Base command type for a full writable command, which uses flags to indicate the changed properties */
export abstract class WritableCommand<T> extends BasicWritableCommand<Partial<T>> {
	public static readonly MaskFlags?: { [key: string]: number }

	public flag: number

	constructor() {
		super({})

		this.flag = 0
	}

	/** Update the values of some properties with this command */
	public updateProps(newProps: Partial<T>): boolean {
		return this._updateProps(newProps)
	}

	protected _updateProps(newProps: { [key: string]: any }): boolean {
		const maskFlags = (this.constructor as any).MaskFlags as { [key: string]: number }
		let hasChanges = false
		if (maskFlags) {
			for (const key in newProps) {
				const key2 = key as keyof T
				const val = newProps[key]
				if (key in maskFlags && val !== undefined) {
					this.flag = this.flag | maskFlags[key]
					this._properties[key2] = val
					hasChanges = true
				}
			}
		}
		return hasChanges
	}
}

/** Base command type for a command which gets sent in both directions */
export abstract class SymmetricalCommand<T> extends DeserializedCommand<T> implements ISerializableCommand {
	public abstract serialize(version: ProtocolVersion): Buffer
}
