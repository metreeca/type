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
 * Memoizing resolution for guard sources with recursion support.
 *
 * Provides a caching mechanism for resolving {@link Guarding} definitions, supporting both self-referencing and
 * mutually recursive guard factories. Factories are distinguished from guards by checking `function.length`: guards
 * have at least one declared parameter (the value to validate), while factories are zero-argument functions returning
 * guards.
 *
 * **Recursion Handling**
 *
 * Recursive factories are supported through a lazy thunk mechanism. When a factory is first encountered, a thunk is
 * cached before invoking the factory. If the factory (or any factory it depends on) references the same factory during
 * construction, the thunk is returned instead, breaking the infinite recursion. Once the factory completes, the thunk
 * is replaced with the actual guard.
 *
 * When the thunk is invoked during validation (which only happens for recursive structures), it looks up the real guard
 * from the cache and delegates to it. If the guard hasn't been set yet (indicating an unresolvable cycle), the thunk
 * returns an empty string, treating the recursive reference as valid.
 *
 * **Memory Management**
 *
 * The cache uses a `WeakMap` keyed by factory functions. This prevents memory leaks when transient or locally-defined
 * factories go out of scope: entries are garbage collected when the factory is no longer reachable. For recursive
 * guards, the factory remains reachable through closures within the guard itself, keeping the cache entry alive as long
 * as the guard is in use.
 *
 * @module
 */

import type { Guard, Guarding } from "./index.js";


/**
 * Memoization cache for guard factories.
 *
 * Maps factory functions to their resolved guards. Uses `WeakMap` to allow garbage collection of entries when factories
 * are no longer reachable from application code.
 */
const cache = new WeakMap<() => Guard, Guard>();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Resolves a guard source to a concrete guard.
 *
 * @typeParam T The guarded type
 *
 * @param source The guard source to resolve
 *
 * @returns The resolved guard
 */
export function resolve<T>(source: Guarding<T>): Guard<T>;

/**
 * Resolves an optional guard source to a concrete guard.
 *
 * @typeParam T The guarded type
 *
 * @param source The optional guard source to resolve
 *
 * @returns The resolved guard, or `undefined` if `source` is `undefined`
 */
export function resolve<T>(source: undefined | Guarding<T>): undefined | Guard<T>;

/**
 * Resolves guard sources with memoization and recursion support.
 */
export function resolve<T>(source: undefined | Guarding<T>): undefined | Guard<T> {

	return source === undefined ? undefined // undefined passthrough
		: typeof source !== "function" ? source // pre-resolved guard
			: source.length > 0 ? source as Guard<T> // guard (has declared parameters)
				: materialize(source as () => Guard<T>); // factory (zero-argument function)


	function materialize(factory: () => Guard<T>): Guard<T> {

		const key = factory as () => Guard;
		const cached = cache.get(key);

		if ( cached === undefined ) {

			const thunk: Guard = (v: unknown) => {

				const guard = cache.get(key);

				return guard && guard !== thunk ? guard(v) : "";

			};

			cache.set(key, thunk);

			const guard = factory();

			cache.set(key, guard as Guard);

			return guard;

		} else {

			return cached as Guard<T>;

		}

	}

}
