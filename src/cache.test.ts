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

import { describe, expect, it } from "vitest";
import { resolve } from "./cache.js";
import type { Guard } from "./index.js";


describe("resolve", () => {

	describe("non-factory values", () => {

		it("should return undefined for undefined input", async () => {
			expect(resolve(undefined)).toBe(undefined);
		});

		it("should return guard directly when passed a guard function", async () => {

			const guard: Guard = (_v: unknown) => "";

			expect(resolve(guard)).toBe(guard);

		});

	});

	describe("factory resolution", () => {

		it("should invoke factory and return resulting guard", async () => {

			const guard: Guard = (_v: unknown) => "";
			const factory = () => guard;

			expect(resolve(factory)).toBe(guard);

		});

		it("should memoize factory results", async () => {

			let callCount = 0;
			const guard: Guard = (_v: unknown) => "";
			const factory = () => {
				callCount++;
				return guard;
			};

			resolve(factory);
			resolve(factory);

			expect(callCount).toBe(1);

		});

	});

	describe("recursive factories", () => {

		it("should support self-referencing factory", async () => {

			// recursive guard: validates number or array of valid elements

			function aTree(): Guard {

				return (v: unknown) => {

					if ( typeof v === "number" ) return "";

					if ( !Array.isArray(v) ) return "not number or array";

					const tree = resolve(aTree);

					for ( const e of v ) {
						const error = tree(e);
						if ( error ) return error;
					}

					return "";

				};

			}

			const guard = resolve(aTree);

			expect(guard(42)).toBe("");
			expect(guard([1, 2, 3])).toBe("");
			expect(guard([1, [2, [3]]])).toBe("");
			expect(guard("hello")).toBe("not number or array");
			expect(guard([1, "bad"])).toBe("not number or array");

		});

		it("should support mutually recursive factories", async () => {

			// mutually recursive: ping references pong, pong references ping

			type Ping = { type: "ping"; next: unknown };
			type Pong = { type: "pong"; next: unknown };

			function aPing(): Guard {
				return (v: unknown) => {

					if ( typeof v !== "object" || v === null ) return "not object";
					if ( !("type" in v) || v.type !== "ping" ) return "not ping";

					const { next } = v as Ping;

					if ( next === null ) return "";

					return resolve(aPong)(next);

				};
			}

			function aPong(): Guard {
				return (v: unknown) => {

					if ( typeof v !== "object" || v === null ) return "not object";
					if ( !("type" in v) || v.type !== "pong" ) return "not pong";

					const { next } = v as Pong;

					if ( next === null ) return "";

					return resolve(aPing)(next);

				};
			}

			const ping = resolve(aPing);
			const pong = resolve(aPong);

			expect(ping({ type: "ping", next: null })).toBe("");
			expect(ping({ type: "ping", next: { type: "pong", next: null } })).toBe("");
			expect(ping({ type: "ping", next: { type: "pong", next: { type: "ping", next: null } } })).toBe("");

			expect(pong({ type: "pong", next: null })).toBe("");
			expect(pong({ type: "pong", next: { type: "ping", next: null } })).toBe("");

			expect(ping({ type: "pong", next: null })).toBe("not ping");
			expect(ping({ type: "ping", next: { type: "ping", next: null } })).toBe("not pong");

		});

	});

});
