/*
 * Copyright © 2025 Metreeca srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Runtime structural type validation with composable guards.
 *
 * Provides factory functions for creating guards that validate unknown values against expected structures. Guards
 * compose through conjunction and disjunction combinators, enabling validation of complex nested types. Validated
 * objects are memoized and frozen for safe reuse.
 *
 * @module
 *
 * @groupDescription Assertions
 *
 * Functions that apply guards to validate values at runtime.
 *
 * @groupDescription Guards
 *
 * Factory functions that create guards for primitive and structural types.
 *
 * @groupDescription Combinators
 *
 * Functions for building custom guards from predicates and composing guards.
 *
 */

import { resolve } from "./cache.js";

/**
 * Symbol key for branding validated objects.
 *
 * Attached as a non-enumerable property to objects validated by {@link as}, storing the guarding used for validation.
 * Enables memoization by allowing subsequent calls to recognize already-validated objects.
 */
const Guarded = Symbol("Guarded");


/**
 * Maps constructor names to lowercase type names for error messages.
 */
const types: Record<string, string> = Object.fromEntries(
	["Null", "Boolean", "Number", "String", "Function"].map(key => [key, key.toLowerCase()])
);



/**
 * Returns a human-readable type name for a value.
 *
 * @param v The value to inspect
 *
 * @returns A string describing the value's type
 */
function type(v: unknown): string {

	return v === null ? "null"
		: v === undefined ? "undefined"
			: Array.isArray(v) ? "array"
				: typeof v;

}


//// Types /////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A function that checks if a value conforms to type `T`.
 *
 * Takes an `unknown` value, returning an empty string on success or an error message on failure.
 *
 * @typeParam T The guarded type
 */
export type Guard<T = unknown> =
	((value: unknown) => string) & { readonly _?: T }

/**
 * Extracts the guarded type from a guard factory, guard, or literal.
 *
 * @typeParam T The guard factory, guard, or literal
 */
export type Guarded<T> =
	T extends () => Guard<infer U> ? U
		: T extends Guard<infer U> ? U
			: T;

/**
 * A guard or a factory function returning it.
 *
 * @typeParam T The guarded type
 */
export type Guarding<T = unknown> =
	Guard<T> | (() => Guard<T>);


/**
 * Literal types accepted as implicit guards in object schemas.
 *
 * Values of these types can be used directly in {@link anObject} schemas to match exact values.
 */
export type Constant =
	| null
	| boolean
	| number
	| string;

/**
 * A readonly array with elements of type `T`.
 *
 * @typeParam T The element type
 */
export type Array<T = unknown> =
	readonly T[];

/**
 * A plain object with property values of type `T`.
 *
 * @typeParam T The property value type
 */
export type Object<T = unknown> =
	Record<PropertyKey, T>;

/**
 * Object properties resolved to their guarded types.
 *
 * @typeParam T The object type with guard values
 */
export type Entries<T> =
	{ [K in keyof T]: Guarded<T[K]> };

/**
 * The intersection of all types in a union.
 *
 * @typeParam U The union type
 */
export type Intersection<U> =
	(U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : unknown;


//// Assertions ////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a type predicate function from a guarding.
 *
 * Wraps a {@link Guard} to produce a TypeScript type predicate for use in conditional narrowing.
 *
 * > [!CAUTION]
 * > Circular references are not supported. Validating objects with cycles causes stack overflow.
 *
 * > [!IMPORTANT]
 * > For memoization to work, guards must have stable identity. Local functions and lambdas are handled without
 * > memory leaks, but won't be memoized since they lack persistent identity. Use module-level named guards or
 * > `const` declarations.
 *
 * > [!IMPORTANT]
 * > Unlike {@link as}, this function does not memoize results since it returns a boolean rather than the validated
 * > value. For repeated validation of the same object, ensure it's validated using {@link as} beforehand.
 *
 * @group Assertions
 *
 * @typeParam T The type being validated
 *
 * @param guarding The guarding to use for validation
 *
 * @returns A type predicate function returning `true` when guarding passes
 *
 * @throws {RangeError} When the validated value contains circular references
 */
export function is<T>(guarding: Guarding<T>): (v: unknown) => v is T {

	const guard = resolve(guarding);

	return (v): v is T => guard(v) === "";

}

/**
 * Creates a validating cast function from a guarding.
 *
 * Applies `guarding` to ensure input matches the expected type, throwing on invalid input. For plain objects, memoizes
 * validation results by branding with the guarding, so subsequent calls return immediately without re-validation.
 * Validated objects are also frozen. Non-object values are validated on every call.
 *
 * > [!CAUTION]
 * > Circular references are not supported. Validating objects with cycles causes stack overflow.
 *
 * > [!WARNING]
 * > Validated objects are frozen. Subsequent mutations will silently fail in non-strict mode or throw in strict mode.
 *
 * > [!IMPORTANT]
 * > For memoization to work, guards must have stable identity. Local functions and lambdas are handled without
 * > memory leaks, but won't be memoized since they lack persistent identity. Use module-level named guards or
 * > `const` declarations.
 *
 * @group Assertions
 *
 * @typeParam T The type being validated
 *
 * @param guarding The guarding to use for validation
 *
 * @returns A cast function that throws on invalid input
 *
 * @throws {TypeError} When the guarding returns an error report
 * @throws {RangeError} When the validated value contains circular references
 */
export function as<T>(guarding: Guarding<T>): (v: unknown) => T {

	const guard = resolve(guarding);

	return (v) => {

		const object = v !== null && typeof v === "object";

		if ( object && (v as Object)[Guarded] === guarding ) {

			return v as T;

		} else {

			const result = guard(v);

			if ( result === "" ) {

				return (object ? brand(v) : v) as T;


				function brand(o: object): object {
					return Object.freeze(Object.defineProperty(Object.isExtensible(o) ? o : extensible(o), Guarded, {
						value: guarding,
						enumerable: false,
						configurable: true
					}));

				}

				function extensible(o: object): object {
					return Object.defineProperties({}, Object.fromEntries(Reflect.ownKeys(o)
						.filter(key => key !== Guarded)
						.map(key => [key, Object.getOwnPropertyDescriptor(o, key)!])
					));
				}

			} else {

				throw new TypeError(result);

			}

		}

	};

}


//// Guards ////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A null guard factory.
 *
 * The returned guard checks if a value is `null`.
 *
 * @group Guards
 */
export function aNull(): Guard<null> {

	return (v: unknown) => v === null ? "" : `illegal <${type(v)}> value, expected <null>`;

}

/**
 * A boolean guard factory.
 *
 * The returned guard checks if a value is a `boolean`.
 *
 * @group Guards
 */
export function aBoolean(): Guard<boolean> {

	return (v: unknown) => typeof v === "boolean" ? "" : `illegal <${type(v)}> value, expected <boolean>`;

}

/**
 * A number guard factory.
 *
 * The returned guard checks if a value is a `number`.
 *
 * @group Guards
 */
export function aNumber(): Guard<number> {

	return (v: unknown) => typeof v === "number" ? "" : `illegal <${type(v)}> value, expected <number>`;

}

/**
 * A string guard factory.
 *
 * The returned guard checks if a value is a `string`.
 *
 * @group Guards
 */
export function aString(): Guard<string> {

	return (v: unknown) => typeof v === "string" ? "" : `illegal <${type(v)}> value, expected <string>`;

}


/**
 * An array guard factory without element validation.
 *
 * The returned guard checks if a value is an array.
 *
 * @typeParam T The type of array elements
 */
export function anArray<T>(): Guard<Array<T>>;

/**
 * An array guard factory with element validation.
 *
 * The returned guard checks if a value is an array and validates each element.
 *
 * @typeParam T The type of array elements
 *
 * @param element Guard for validating each element
 */
export function anArray<T>(element: Guarding<T>): Guard<Array<T>>;

/**
 * An array guard factory.
 *
 * @group Guards
 *
 * @typeParam T The type of array elements
 *
 * @param element Optional guard for validating elements
 */
export function anArray<T>(element?: Guarding<T>) {

	const guard = resolve(element);

	return (v: unknown) => {

		if ( !Array.isArray(v) ) {

			return `illegal <${type(v)}> value, expected <array>`;

		} else if ( guard === undefined ) {

			return "";

		} else {

			for ( let index = 0; index < v.length; index++ ) {

				const result = guard(v[index]);

				if ( result !== "" ) {
					return `[${index}]: ${result}`;
				}

			}

			return "";

		}

	};

}


/**
 * An object guard factory without property validation.
 *
 * The returned guard checks if a value is a plain object.
 *
 * @typeParam T The object type
 */
export function anObject<T extends Object>(): Guard<T>;

/**
 * An object guard factory with key and value guards.
 *
 * The returned guard checks if a value is a plain object and validates each key and value
 * using the provided guards.
 *
 * @typeParam K The key type
 * @typeParam V The value type
 *
 * @param key {@link Guarding} for validating keys
 * @param value {@link Guarding} for validating values
 */
export function anObject<K extends PropertyKey, V>(key: Guarding<K>, value: Guarding<V>): Guard<Record<K, V>>;

/**
 * An object guard factory with schema-based property validation.
 *
 * The returned guard checks if a value is a plain object and validates each property against the schema.
 *
 * - If `rest` is omitted, the object is **closed**: unlisted properties are rejected
 * - If `rest` is provided, the object is **open**: unlisted properties are validated with the `rest` guard
 *
 * @typeParam T The object schema type
 *
 * @param schema Schema mapping property names to guards or literal values
 * @param rest Guard for validating unlisted properties (open object) or omit to reject them (closed object)
 */
export function anObject<const T extends Object<Constant | Guarding>>(schema: T, rest?: Guarding): Guard<Entries<T>>;

/**
 * An object guard factory.
 *
 * @group Guards
 *
 * @param a Key guard or property schema
 * @param b Value guard (key guard mode) or guard for unlisted properties (schema mode)
 */
export function anObject(a?: Guarding | Object, b?: Guarding) {

	return a === undefined ? object
		: typeof a === "function" && b !== undefined ? entry(a, b)
			: schema(a as Object<Constant | Guarding>, b);


	function isObject(v: unknown): v is Object {

		return v !== null
			&& typeof v === "object"
			&& Object.getPrototypeOf(v) === Object.prototype;

	}


	function object(v: unknown): string {

		return isObject(v) ? "" : `illegal <${type(v)}> value, expected <object>`;

	}

	function entry(asKey: Guarding, aValue: Guarding): Guard {

		const keyGuard = resolve(asKey);
		const valueGuard = resolve(aValue);

		return (v: unknown) => {

			if ( !isObject(v) ) {

				return `illegal <${type(v)}> value, expected <object>`;

			} else {

				for ( const key in v ) {

					const keyError = keyGuard(key);

					if ( keyError !== "" ) {
						return `${key}: ${keyError}`;
					}

					const valError = valueGuard(v[key]);

					if ( valError !== "" ) {
						return `${key}: ${valError}`;
					}

				}

				return "";

			}

		};

	}

	function schema(arg: Object<Constant | Guarding>, rest?: Guarding): Guard {

		const guards = Object.fromEntries(
			Object.entries(arg).map(([key, value]) => [
				key,
				isConstant(value) ? constant(value) : resolve(value)
			])
		);

		const keys = new Set(Object.keys(arg));
		const extra = rest !== undefined ? resolve(rest) : undefined;

		return (v: unknown) => {

			if ( !isObject(v) ) {

				return `illegal <${type(v)}> value, expected <object>`;

			} else {

				for ( const key in guards ) {

					const result = guards[key](v[key]);

					if ( result !== "" ) {
						return `${key}: ${result}`;
					}

				}

				for ( const key in v ) {

					if ( !keys.has(key) ) {

						if ( extra === undefined ) {
							return `${key}: unexpected property`;
						}

						const result = extra(v[key]);

						if ( result !== "" ) {
							return `${key}: ${result}`;
						}

					}

				}

				return "";

			}

		};


		function isConstant(value: unknown): value is Constant {

			return value === null
				|| typeof value === "boolean"
				|| typeof value === "number"
				|| typeof value === "string";

		}

		function constant(expected: Constant): Guard {
			return (v: unknown) => v === expected ? "" : `unexpected <${v}> value, expected <${expected}>`;
		}

	}


}


/**
 * A function guard factory.
 *
 * The returned guard checks if a value is a `function`.
 *
 * @group Guards
 */
export function aFunction(): Guard<Function> {

	return (v: unknown) => typeof v === "function" ? "" : `illegal <${type(v)}> value, expected <function>`;

}

/**
 * An unknown guard factory.
 *
 * The returned guard accepts any value, always returning success. Useful as a placeholder when a guard is required
 * but no validation is needed, or as the `rest` parameter in {@link anObject} schemas for open objects.
 *
 * @group Guards
 */
export function anUnknown(): Guard {

	return () => "";

}


//// Combinators ///////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Combines multiple guards into a conjunctive guard.
 *
 * Creates a guard that passes only when all component guards pass. Guards are evaluated in order until one fails,
 * returning its error message. Supports both direct guards and {@link Guarding | guard factories} for deferred
 * evaluation.
 *
 * @group Combinators
 *
 * @typeParam G The guards tuple type
 *
 * @param sources The guards or guard factories to combine
 *
 * @returns A guard returning empty string when all guards pass, or the first error message on failure
 */
export function all<G extends readonly Guarding[]>(sources: G): Guard<Intersection<Guarded<G[number]>>> {

	const guards = sources.map(source => resolve(source));

	if ( guards.length === 0 ) {

		return () => "";

	} else if ( guards.length === 1 ) {

		return (v: unknown) => guards[0](v);

	} else if ( guards.length === 2 ) {

		const [first, second] = guards;

		return (v: unknown) => first(v) || second(v);

	} else {

		return (v: unknown) => {

			for ( const guard of guards ) {

				const result = guard(v);

				if ( result !== "" ) {
					return result;
				}

			}

			return "";

		};

	}

}

/**
 * Creates a disjunctive guard from named guards.
 *
 * Creates a guard that passes when any component guard passes.
 *
 * @group Combinators
 *
 * @typeParam G The guards record type
 *
 * @param sources Record mapping names to guards or guard factories
 *
 * @returns A guard returning empty string when any guard passes
 */
export function any<G extends Record<string, Guarding>>(sources: G): Guard<Guarded<G[keyof G]>> {

	const entries = Object.entries(sources).map(([name, source]) => [name, resolve(source)] as const);

	const names = entries.map(([name]) => `<${label(name)}>`);

	const expected = names.length === 1 ? names[0]
		: `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;


	function label(name: string): string {

		const stripped = name.replace(/^an?(?=\p{Lu})/u, "");

		return types[stripped] ?? stripped;

	}

	function error(v: unknown): string {
		return `unexpected <${type(v)}> value, expected ${expected}`;
	}


	if ( entries.length === 0 ) {

		return (v: unknown) => `unexpected <${type(v)}> value`;

	} else if ( entries.length === 1 ) {

		const [[, first]] = entries;

		return (v: unknown) => first(v) === "" ? "" : error(v);

	} else if ( entries.length === 2 ) {

		const [[, first], [, second]] = entries;

		return (v: unknown) => first(v) === "" || second(v) === "" ? "" : error(v);

	} else {

		const guards = entries.map(([, guard]) => guard);

		return (v: unknown) => {

			for ( const guard of guards ) {

				if ( guard(v) === "" ) {
					return "";
				}

			}

			return error(v);

		};

	}

}
