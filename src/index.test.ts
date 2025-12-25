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
import {
	aBoolean,
	aFunction,
	all,
	anArray,
	anObject,
	aNull,
	aNumber,
	anUnknown,
	any,
	as,
	aString,
	type Guard,
	is
} from "./index.js";


describe("assertions", () => {

	describe("is", () => {

		describe("type predicate", () => {

			it("should return true for valid value", async () => {
				const predicate = is(aString());

				expect(predicate("hello")).toBeTruthy();
			});

			it("should return false for invalid value", async () => {
				const predicate = is(aString());

				expect(predicate(123)).toBeFalsy();
			});

		});

		describe("lazy guards", () => {

			it("should accept lazy guard factory", async () => {
				const predicate = is(() => aNumber());

				expect(predicate(42)).toBeTruthy();
			});

			it("should return false for invalid value with lazy guard", async () => {
				const predicate = is(() => aNumber());

				expect(predicate("hello")).toBeFalsy();
			});

		});

	});

	describe("as", () => {

		describe("validation", () => {

			it("should return valid value unchanged", async () => {
				const cast = as(aString());

				expect(cast("hello")).toBe("hello");
			});

			it("should throw TypeError for invalid value", async () => {
				const cast = as(aString());

				expect(() => cast(123)).toThrow(TypeError);
			});

		});

		describe("memoization", () => {

			it("should memoize validated objects", async () => {
				const cast = as(anObject({ name: aString() }));
				const obj = { name: "Alice" };

				const first = cast(obj);
				const second = cast(first);

				expect(second).toBe(first);
			});

			it("should freeze validated objects", async () => {
				const cast = as(anObject({ name: aString() }));

				const result = cast({ name: "Alice" });

				expect(Object.isFrozen(result)).toBeTruthy();
			});

			it("should not memoize primitive values", async () => {
				const cast = as(aString());

				const first = cast("hello");
				const second = cast("hello");

				expect(first).toBe("hello");
				expect(second).toBe("hello");
			});

		});

		describe("lazy guards", () => {

			it("should accept lazy guard factory", async () => {
				const cast = as(() => aNumber());

				expect(cast(42)).toBe(42);
			});

			it("should throw for invalid value with lazy guard", async () => {
				const cast = as(() => aNumber());

				expect(() => cast("hello")).toThrow(TypeError);
			});

		});

	});

});

describe("guards", () => {

	describe("aNull", () => {

		describe("success cases", () => {

			it("should return empty string for null", async () => {
				const guard = aNull();

				expect(guard(null)).toBe("");
			});

		});

		describe("failure cases", () => {

			it("should return error message for undefined", async () => {
				const guard = aNull();

				expect(guard(undefined)).not.toBe("");
			});

			it("should return error message for number", async () => {
				const guard = aNull();

				expect(guard(0)).not.toBe("");
			});

			it("should return error message for string", async () => {
				const guard = aNull();

				expect(guard("")).not.toBe("");
			});

			it("should return error message for boolean", async () => {
				const guard = aNull();

				expect(guard(false)).not.toBe("");
			});

			it("should return error message for object", async () => {
				const guard = aNull();

				expect(guard({})).not.toBe("");
			});

			it("should return error message for array", async () => {
				const guard = aNull();

				expect(guard([])).not.toBe("");
			});

		});

	});

	describe("aBoolean", () => {

		describe("success cases", () => {

			it("should return empty string for true", async () => {
				const guard = aBoolean();

				expect(guard(true)).toBe("");
			});

			it("should return empty string for false", async () => {
				const guard = aBoolean();

				expect(guard(false)).toBe("");
			});

		});

		describe("failure cases", () => {

			it("should return error message for number", async () => {
				const guard = aBoolean();

				expect(guard(123)).not.toBe("");
			});

			it("should return error message for string", async () => {
				const guard = aBoolean();

				expect(guard("true")).not.toBe("");
			});

			it("should return error message for null", async () => {
				const guard = aBoolean();

				expect(guard(null)).not.toBe("");
			});

			it("should return error message for undefined", async () => {
				const guard = aBoolean();

				expect(guard(undefined)).not.toBe("");
			});

			it("should return error message for object", async () => {
				const guard = aBoolean();

				expect(guard({})).not.toBe("");
			});

			it("should return error message for array", async () => {
				const guard = aBoolean();

				expect(guard([])).not.toBe("");
			});

		});

	});

	describe("aNumber", () => {

		describe("success cases", () => {

			it("should return empty string for number values", async () => {
				const guard = aNumber();

				expect(guard(123)).toBe("");
			});

			it("should return empty string for zero", async () => {
				const guard = aNumber();

				expect(guard(0)).toBe("");
			});

			it("should return empty string for negative numbers", async () => {
				const guard = aNumber();

				expect(guard(-42)).toBe("");
			});

		});

		describe("failure cases", () => {

			it("should return error message for string", async () => {
				const guard = aNumber();

				expect(guard("hello")).not.toBe("");
			});

			it("should return error message for boolean", async () => {
				const guard = aNumber();

				expect(guard(true)).not.toBe("");
			});

			it("should return error message for null", async () => {
				const guard = aNumber();

				expect(guard(null)).not.toBe("");
			});

			it("should return error message for undefined", async () => {
				const guard = aNumber();

				expect(guard(undefined)).not.toBe("");
			});

			it("should return error message for object", async () => {
				const guard = aNumber();

				expect(guard({})).not.toBe("");
			});

			it("should return error message for array", async () => {
				const guard = aNumber();

				expect(guard([])).not.toBe("");
			});

		});

	});

	describe("aString", () => {

		describe("success cases", () => {

			it("should return empty string for string values", async () => {
				const guard = aString();

				expect(guard("hello")).toBe("");
			});

			it("should return empty string for empty string", async () => {
				const guard = aString();

				expect(guard("")).toBe("");
			});

		});

		describe("failure cases", () => {

			it("should return error message for number", async () => {
				const guard = aString();

				expect(guard(123)).not.toBe("");
			});

			it("should return error message for boolean", async () => {
				const guard = aString();

				expect(guard(true)).not.toBe("");
			});

			it("should return error message for null", async () => {
				const guard = aString();

				expect(guard(null)).not.toBe("");
			});

			it("should return error message for undefined", async () => {
				const guard = aString();

				expect(guard(undefined)).not.toBe("");
			});

			it("should return error message for object", async () => {
				const guard = aString();

				expect(guard({})).not.toBe("");
			});

			it("should return error message for array", async () => {
				const guard = aString();

				expect(guard([])).not.toBe("");
			});

		});

	});

	describe("anArray", () => {

		describe("without element guard", () => {

			it("should return empty string for array", async () => {
				const guard = anArray();

				expect(guard([])).toBe("");
				expect(guard([1, 2, 3])).toBe("");
			});

			it("should return error for non-array", async () => {
				const guard = anArray();

				expect(guard("hello")).not.toBe("");
				expect(guard({})).not.toBe("");
				expect(guard(null)).not.toBe("");
			});

		});

		describe("with element guard", () => {

			it("should return empty string for valid element types", async () => {
				const guard = anArray(aNumber());

				expect(guard([1, 2, 3])).toBe("");
			});

			it("should return error for invalid element types", async () => {
				const guard = anArray(aNumber());

				expect(guard(["a", "b"])).not.toBe("");
			});

			it("should support lazy element guard factory", async () => {
				const guard = anArray(() => aString());

				expect(guard(["a", "b"])).toBe("");
				expect(guard([1, 2])).not.toBe("");
			});

		});

	});

	describe("anObject", () => {

		describe("without schema", () => {

			it("should return empty string for plain object", async () => {
				const guard = anObject();

				expect(guard({})).toBe("");
				expect(guard({ a: 1 })).toBe("");
			});

			it("should return error for non-object", async () => {
				const guard = anObject();

				expect(guard("hello")).not.toBe("");
				expect(guard(null)).not.toBe("");
				expect(guard([])).not.toBe("");
			});

		});

		describe("with schema", () => {

			it("should return empty string for matching schema", async () => {
				const guard = anObject({
					name: aString(),
					age: aNumber()
				});

				expect(guard({ name: "Alice", age: 30 })).toBe("");
			});

			it("should return error for non-matching schema", async () => {
				const guard = anObject({
					name: aString(),
					age: aNumber()
				});

				expect(guard({ name: 123, age: "thirty" })).not.toBe("");
			});

			it("should support literal values as guards", async () => {
				const guard = anObject({
					type: "circle",
					radius: aNumber()
				});

				expect(guard({ type: "circle", radius: 10 })).toBe("");
				expect(guard({ type: "square", radius: 10 })).not.toBe("");
			});

			it("should reject unlisted properties (closed object)", async () => {
				const guard = anObject({
					name: aString()
				});

				expect(guard({ name: "Alice" })).toBe("");
				expect(guard({ name: "Alice", extra: 123 })).not.toBe("");
			});

		});

		describe("with schema and other guard (open object)", () => {

			it("should validate listed properties with schema guards", async () => {
				const guard = anObject({
					name: aString()
				}, aNumber());

				expect(guard({ name: "Alice" })).toBe("");
				expect(guard({ name: 123 })).not.toBe("");
			});

			it("should validate unlisted properties with other guard", async () => {
				const guard = anObject({
					name: aString()
				}, aNumber());

				expect(guard({ name: "Alice", age: 30 })).toBe("");
				expect(guard({ name: "Alice", age: "thirty" })).not.toBe("");
			});

			it("should support lazy other guard factory", async () => {
				const guard = anObject({
					name: aString()
				}, () => aNumber());

				expect(guard({ name: "Alice", age: 30 })).toBe("");
				expect(guard({ name: "Alice", age: "thirty" })).not.toBe("");
			});

		});

		describe("with key and value guards", () => {

			it("should return empty string for valid keys and values", async () => {
				const guard = anObject(aString(), aNumber());

				expect(guard({ a: 1, b: 2 })).toBe("");
			});

			it("should return empty string for empty object", async () => {
				const guard = anObject(aString(), aNumber());

				expect(guard({})).toBe("");
			});

			it("should return error for invalid key pattern", async () => {

				const lowercase = (): Guard<string> => (v: unknown) =>
					typeof v === "string" && /^[a-z]+$/.test(v) ? "" : "expected lowercase";

				const guard = anObject(lowercase, aNumber);

				expect(guard({ abc: 1 })).toBe("");
				expect(guard({ ABC: 1 })).not.toBe("");
				expect(guard({ "123": 1 })).not.toBe("");
			});

			it("should return error for invalid value type", async () => {
				const guard = anObject(aString(), aNumber());

				expect(guard({ a: "one" })).not.toBe("");
			});

			it("should return error for non-object", async () => {
				const guard = anObject(aString(), aNumber());

				expect(guard("hello")).not.toBe("");
				expect(guard(null)).not.toBe("");
				expect(guard([])).not.toBe("");
			});

			it("should support lazy guard factories", async () => {
				const guard = anObject(() => aString(), () => aNumber());

				expect(guard({ a: 1, b: 2 })).toBe("");
				expect(guard({ a: "one" })).not.toBe("");
			});

		});

	});

	describe("aFunction", () => {

		describe("success cases", () => {

			it("should return empty string for arrow function", async () => {
				const guard = aFunction();

				expect(guard(() => {})).toBe("");
			});

			it("should return empty string for function declaration", async () => {
				const guard = aFunction();

				expect(guard(function() {})).toBe("");
			});

			it("should return empty string for async function", async () => {
				const guard = aFunction();

				expect(guard(async () => {})).toBe("");
			});

			it("should return empty string for class constructor", async () => {
				const guard = aFunction();

				expect(guard(class {})).toBe("");
			});

		});

		describe("failure cases", () => {

			it("should return error message for null", async () => {
				const guard = aFunction();

				expect(guard(null)).not.toBe("");
			});

			it("should return error message for undefined", async () => {
				const guard = aFunction();

				expect(guard(undefined)).not.toBe("");
			});

			it("should return error message for number", async () => {
				const guard = aFunction();

				expect(guard(123)).not.toBe("");
			});

			it("should return error message for string", async () => {
				const guard = aFunction();

				expect(guard("hello")).not.toBe("");
			});

			it("should return error message for boolean", async () => {
				const guard = aFunction();

				expect(guard(true)).not.toBe("");
			});

			it("should return error message for object", async () => {
				const guard = aFunction();

				expect(guard({})).not.toBe("");
			});

			it("should return error message for array", async () => {
				const guard = aFunction();

				expect(guard([])).not.toBe("");
			});

		});

	});

	describe("anUnknown", () => {

		describe("success cases", () => {

			it("should return empty string for null", async () => {
				const guard = anUnknown();

				expect(guard(null)).toBe("");
			});

			it("should return empty string for undefined", async () => {
				const guard = anUnknown();

				expect(guard(undefined)).toBe("");
			});

			it("should return empty string for boolean", async () => {
				const guard = anUnknown();

				expect(guard(true)).toBe("");
				expect(guard(false)).toBe("");
			});

			it("should return empty string for number", async () => {
				const guard = anUnknown();

				expect(guard(0)).toBe("");
				expect(guard(42)).toBe("");
				expect(guard(-1)).toBe("");
			});

			it("should return empty string for string", async () => {
				const guard = anUnknown();

				expect(guard("")).toBe("");
				expect(guard("hello")).toBe("");
			});

			it("should return empty string for object", async () => {
				const guard = anUnknown();

				expect(guard({})).toBe("");
				expect(guard({ a: 1 })).toBe("");
			});

			it("should return empty string for array", async () => {
				const guard = anUnknown();

				expect(guard([])).toBe("");
				expect(guard([1, 2, 3])).toBe("");
			});

			it("should return empty string for function", async () => {
				const guard = anUnknown();

				expect(guard(() => {})).toBe("");
			});

			it("should return empty string for symbol", async () => {
				const guard = anUnknown();

				expect(guard(Symbol("test"))).toBe("");
			});

		});

	});

});

describe("combinators", () => {

	describe("all", () => {

		describe("empty array", () => {

			it("should return empty string for any value", async () => {
				const guard = all([]);

				expect(guard(123)).toBe("");
				expect(guard("hello")).toBe("");
				expect(guard(null)).toBe("");
				expect(guard(undefined)).toBe("");
				expect(guard({})).toBe("");
			});

		});

		describe("single guard", () => {

			it("should return empty string when guard passes", async () => {
				const guard = all([aNumber()]);

				expect(guard(123)).toBe("");
			});

			it("should return error when guard fails", async () => {
				const guard = all([aNumber()]);

				expect(guard("hello")).not.toBe("");
			});

			it("should support lazy guard factory", async () => {
				const guard = all([() => aNumber()]);

				expect(guard(123)).toBe("");
				expect(guard("hello")).not.toBe("");
			});

		});

		describe("multiple guards", () => {

			it("should return error when any guard fails", async () => {
				const guard = all([aNumber(), aString()]);

				expect(guard(123)).not.toBe("");
			});

			it("should support lazy guard factories", async () => {
				const guard = all([
					() => aNumber(),
					() => aString()
				]);

				expect(guard(123)).not.toBe("");
			});

		});

	});

	describe("any", () => {

		describe("empty record", () => {

			it("should return error for any value", async () => {
				const guard = any({});

				expect(guard(123)).not.toBe("");
				expect(guard("hello")).not.toBe("");
				expect(guard(null)).not.toBe("");
			});

		});

		describe("single guard", () => {

			it("should return empty string when guard passes", async () => {
				const guard = any({ number: aNumber() });

				expect(guard(123)).toBe("");
			});

			it("should return error when guard fails", async () => {
				const guard = any({ number: aNumber() });

				expect(guard("hello")).not.toBe("");
			});

			it("should support lazy guard factory", async () => {
				const guard = any({ number: () => aNumber() });

				expect(guard(123)).toBe("");
				expect(guard("hello")).not.toBe("");
			});

		});

		describe("multiple guards", () => {

			it("should return empty string when any guard passes", async () => {
				const guard = any({ number: aNumber(), string: aString() });

				expect(guard(123)).toBe("");
				expect(guard("hello")).toBe("");
			});

			it("should return error when no guard passes", async () => {
				const guard = any({ number: aNumber(), string: aString() });

				expect(guard(null)).not.toBe("");
			});

			it("should support lazy guard factories", async () => {
				const guard = any({
					number: () => aNumber(),
					string: () => aString()
				});

				expect(guard(123)).toBe("");
				expect(guard("hello")).toBe("");
				expect(guard(null)).not.toBe("");
			});

		});

	});

});
