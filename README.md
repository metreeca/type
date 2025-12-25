# @metreeca/type

[![npm](https://img.shields.io/npm/v/@metreeca/type)](https://www.npmjs.com/package/@metreeca/type)

A lightweight TypeScript library for composable runtime type validation.

**@metreeca/type** provides an idiomatic, easy-to-use functional API for validating unknown data against type
definitions using guards. Guards validate type structure (for instance, that `radius` is a number) while leaving
semantic constraints (for instance, that `radius >= 0`) to application logic. Key features include:

- **Structural validation** › Focus on type structure for clean separation of concerns
- **Type safety** › Seamless type inference and automatic type narrowing
- **Composable guards** › Build complex validators from simple primitives
- **Union/intersection support** › Handle discriminated unions and type intersections
- **Recursive types** › Define self-referencing and mutually recursive structures
- **Memoization** › Factory-generated guards and validated objects are cached for efficiency

# Installation

```shell
npm install @metreeca/type
```

> [!WARNING]
>
> TypeScript consumers must use `"moduleResolution": "nodenext"/"node16"/"bundler"` in `tsconfig.json`.
> The legacy `"node"` resolver is not supported.

# Usage

> [!NOTE]
>
> This section introduces essential concepts and common patterns: see the
> [API reference](https://metreeca.github.io/type/modules.html) for complete coverage.

A **guard** is a function that takes an `unknown` value and returns an empty string on success or an error message on
failure. Guards perform **structural validation** only: they validate that a value has the expected type structure, not
semantic constraints like `radius >= 0`.

**@metreeca/type** provides three main abstractions built around guards:

- **[Guards](https://metreeca.github.io/type/modules.html#Guards)**: Factory functions that create validators for
  primitive types, arrays, and objects
- **[Assertions](https://metreeca.github.io/type/modules.html#Assertions)**: Functions that create type predicates and
  validating casts from guards
- **[Combinators](https://metreeca.github.io/type/modules.html#Combinators)**: Functions that combine guards for union
  and intersection types

## Defining Guards

Define guards using built-in factory functions.

```typescript
import { anObject, aString, aNumber, type Guard } from "@metreeca/type";

interface User {
    readonly name: string;
    readonly age: number;
}

function aUser(): Guard<User> {
    return anObject({
        name: aString,
        age: aNumber
    });
}
```

> [!IMPORTANT]
>
> **Guards must have stable identity**. Local functions and lambdas are handled without memory leaks, but won't be
> memoized since they lack persistent identity. Use module-level named guards or `const` declarations.

## Using Assertions

Create type predicates with `is()` for conditional narrowing, or validating casts with `as()` for guaranteed type-safe
conversions.

```typescript
import { is, as } from "@metreeca/type";

const isUser = is(aUser);
const asUser = as(aUser);

function processUser(value: unknown): string {
    if (isUser(value)) {
        return value.name;  // type narrowed to User
    } else {
        return "unknown";
    }
}

function castUser(value: unknown): User {
    return asUser(value);  // throws TypeError on invalid input
}
```

> [!CAUTION]
>
> **Circular references are not supported**. Validating objects with cycles causes stack overflow.

> [!WARNING]
>
> **Validated objects are frozen**. The `as()` function freezes objects after validation to preserve type guarantees.
> Subsequent mutations will silently fail in non-strict mode or throw in strict mode.

## Primitives

Guards for primitive types cover common JavaScript value types.

```typescript
import { anObject, aNull, aBoolean, aNumber, aString, aFunction, type Guard } from "@metreeca/type";

interface Profile {
    readonly avatar: null;
    readonly verified: boolean;
    readonly age: number;
    readonly name: string;
    readonly onClick: Function;
}

function aProfile(): Guard<Profile> {
    return anObject({
        avatar: aNull,
        verified: aBoolean,
        age: aNumber,
        name: aString,
        onClick: aFunction
    });
}
```

## Validating Arrays

Use `anArray()` without arguments to accept any array, or with an element guard to validate each item.

```typescript
import { anObject, anArray, aNumber, type Guard } from "@metreeca/type";

interface Playlist {
    readonly tracks: readonly unknown[];
    readonly ratings: readonly number[];
}

function aPlaylist(): Guard<Playlist> {
    return anObject({
        tracks: anArray(),           // any array
        ratings: anArray(aNumber)    // array of numbers
    });
}
```

## Objects

Use `anObject()` without arguments to accept any plain object.

```typescript
import { anObject, type Guard } from "@metreeca/type";

interface Headers {
    readonly [key: string]: unknown;
}

function aHeaders(): Guard<Headers> {
    return anObject();  // any plain object
}
```

Add key and value guards for uniform validation of all entries.

```typescript
import { anObject, aString, type Guard } from "@metreeca/type";
import { isTag, type Tag } from "./tags";

interface Dictionary {
    readonly [tag: Tag]: string;
}

function aDictionary(): Guard<Dictionary> {
    return anObject(
        (v: unknown) => isTag(v) ? "" : `malformed tag <${v}>`,
        aString
    );
}
```

> [!NOTE]
> Validating `Tag` with a regex is structural type validation: the pattern defines what a `Tag` is, not a semantic
> constraint on strings.

Add a schema to create a **closed** object: only schema properties are allowed, extra properties are rejected.

```typescript
import { anObject, aString, aNumber, type Guard } from "@metreeca/type";

interface Package {
    readonly name: string;
    readonly version: number;
}

function aPackage(): Guard<Package> {
    return anObject({
        name: aString,
        version: aNumber
    });  // closed: extra properties rejected
}
```

Add a catch-all guard to create an **open** object: extra properties are validated by the catch-all.

```typescript
import { anObject, aString, aNumber, anUnknown, type Guard } from "@metreeca/type";

interface Options {
    readonly name: string;
    readonly version: number;
    readonly [key: string]: unknown;
}

function anOptions(): Guard<Options> {
    return anObject({
        name: aString,
        version: aNumber
    }, anUnknown);  // open: extra properties allowed
}
```

## Intersections

Use `all()` to combine multiple guards conjunctively. All guards must pass for validation to succeed.

```typescript
import { all, anObject, aString, aBoolean, type Guard } from "@metreeca/type";

interface Identifiable {
    readonly id: string;
}

interface Trackable {
    readonly active: boolean;
}

type Device = Identifiable & Trackable;

function aDevice(): Guard<Device> {
    return all([
        anObject({ id: aString }),
        anObject({ active: aBoolean })
    ]);
}
```

## Unions

Use `any()` to combine guards disjunctively. Validation succeeds if any guard passes. Use literal values in schemas to
create discriminated unions.

```typescript
import { any, anObject, aString, type Guard } from "@metreeca/type";

type Result = Success | Failure;

interface Success {
    readonly ok: true;
    readonly value: string;
}

interface Failure {
    readonly ok: false;
    readonly error: string;
}

function aResult(): Guard<Result> {
    return any({
        aSuccess,
        aFailure
    });
}

function aSuccess(): Guard<Success> {
    return anObject({
        ok: true,       // literal value match
        value: aString
    });
}

function aFailure(): Guard<Failure> {
    return anObject({
        ok: false,
        error: aString
    });
}
```

## Recursive Definitions

Define self-referencing types by using guard factory functions. The factory pattern enables lazy evaluation and breaks
infinite recursion.

```typescript
import { anObject, anArray, aNumber, type Guard } from "@metreeca/type";

interface Node {
    readonly value: number;
    readonly children: readonly Node[];
}

function aNode(): Guard<Node> {
    return anObject({
        value: aNumber,
        children: anArray(aNode)  // self-reference via factory
    });
}
```

## Mutually Recursive Types

The factory pattern also supports mutually recursive types and complex hierarchies like discriminated union trees.

```typescript
import { any, anObject, anArray, aNumber, type Guard } from "@metreeca/type";

type Shape = Circle | Rectangle | Composite;

interface Circle {
    readonly type: "circle";
    readonly x: number;
    readonly y: number;
    readonly radius: number;
}

interface Rectangle {
    readonly type: "rectangle";
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

interface Composite {
    readonly type: "composite";
    readonly shapes: readonly Shape[];
}

function aShape(): Guard<Shape> {
    return any({ aCircle, aRectangle, aComposite });
}

function aCircle(): Guard<Circle> {
    return anObject({
        type: "circle",
        x: aNumber,
        y: aNumber,
        radius: aNumber
    });
}

function aRectangle(): Guard<Rectangle> {
    return anObject({
        type: "rectangle",
        x: aNumber,
        y: aNumber,
        width: aNumber,
        height: aNumber
    });
}

function aComposite(): Guard<Composite> {
    return anObject({
        type: "composite",
        shapes: anArray(aShape)  // recursive reference
    });
}
```

# Support

- open an [issue](https://github.com/metreeca/type/issues) to report a problem or to suggest a new feature
- start a [discussion](https://github.com/metreeca/type/discussions) to ask a how-to question or to share an idea

# License

This project is licensed under the Apache 2.0 License –
see [LICENSE](https://github.com/metreeca/type?tab=Apache-2.0-1-ov-file) file for details.
