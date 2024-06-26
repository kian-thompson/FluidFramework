/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by flub generate:typetests in @fluid-tools/build-cli.
 */

import type * as old from "@fluidframework/routerlicious-urlresolver-previous/internal";

import type * as current from "../../index.js";

type ValueOf<T> = T[keyof T];
type OnlySymbols<T> = T extends symbol ? T : never;
type WellKnownSymbols = OnlySymbols<ValueOf<typeof Symbol>>;
/**
 * Omit (replace with never) a key if it is a custom symbol,
 * not just symbol or a well known symbol from the global Symbol.
 */
type SkipUniqueSymbols<Key> = symbol extends Key
	? Key // Key is symbol or a generalization of symbol, so leave it as is.
	: Key extends symbol
		? Key extends WellKnownSymbols
			? Key // Key is a well known symbol from the global Symbol object. These are shared between packages, so they are fine and kept as is.
			: never // Key is most likely some specialized symbol, typically a unique symbol. These break type comparisons so are removed by replacing them with never.
		: Key; // Key is not a symbol (for example its a string or number), so leave it as is.
/**
 * Remove details of T which are incompatible with type testing while keeping as much as is practical.
 *
 * See 'build-tools/packages/build-tools/src/typeValidator/compatibility.ts' for more information.
 */
type TypeOnly<T> = T extends number
	? number
	: T extends boolean | bigint | string
		? T
		: T extends symbol
			? SkipUniqueSymbols<T>
			: {
					[P in keyof T as SkipUniqueSymbols<P>]: TypeOnly<T[P]>;
				};

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IAlfredUser": {"forwardCompat": false}
 */
declare function get_old_InterfaceDeclaration_IAlfredUser():
    TypeOnly<old.IAlfredUser>;
declare function use_current_InterfaceDeclaration_IAlfredUser(
    use: TypeOnly<current.IAlfredUser>): void;
use_current_InterfaceDeclaration_IAlfredUser(
    get_old_InterfaceDeclaration_IAlfredUser());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IAlfredUser": {"backCompat": false}
 */
declare function get_current_InterfaceDeclaration_IAlfredUser():
    TypeOnly<current.IAlfredUser>;
declare function use_old_InterfaceDeclaration_IAlfredUser(
    use: TypeOnly<old.IAlfredUser>): void;
use_old_InterfaceDeclaration_IAlfredUser(
    get_current_InterfaceDeclaration_IAlfredUser());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IConfig": {"forwardCompat": false}
 */
declare function get_old_InterfaceDeclaration_IConfig():
    TypeOnly<old.IConfig>;
declare function use_current_InterfaceDeclaration_IConfig(
    use: TypeOnly<current.IConfig>): void;
use_current_InterfaceDeclaration_IConfig(
    get_old_InterfaceDeclaration_IConfig());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "InterfaceDeclaration_IConfig": {"backCompat": false}
 */
declare function get_current_InterfaceDeclaration_IConfig():
    TypeOnly<current.IConfig>;
declare function use_old_InterfaceDeclaration_IConfig(
    use: TypeOnly<old.IConfig>): void;
use_old_InterfaceDeclaration_IConfig(
    get_current_InterfaceDeclaration_IConfig());

/*
 * Validate forward compatibility by using the old type in place of the current type.
 * If this test starts failing, it indicates a change that is not forward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_RouterliciousUrlResolver": {"forwardCompat": false}
 */
declare function get_old_ClassDeclaration_RouterliciousUrlResolver():
    TypeOnly<old.RouterliciousUrlResolver>;
declare function use_current_ClassDeclaration_RouterliciousUrlResolver(
    use: TypeOnly<current.RouterliciousUrlResolver>): void;
use_current_ClassDeclaration_RouterliciousUrlResolver(
    get_old_ClassDeclaration_RouterliciousUrlResolver());

/*
 * Validate backward compatibility by using the current type in place of the old type.
 * If this test starts failing, it indicates a change that is not backward compatible.
 * To acknowledge the breaking change, add the following to package.json under
 * typeValidation.broken:
 * "ClassDeclaration_RouterliciousUrlResolver": {"backCompat": false}
 */
declare function get_current_ClassDeclaration_RouterliciousUrlResolver():
    TypeOnly<current.RouterliciousUrlResolver>;
declare function use_old_ClassDeclaration_RouterliciousUrlResolver(
    use: TypeOnly<old.RouterliciousUrlResolver>): void;
use_old_ClassDeclaration_RouterliciousUrlResolver(
    get_current_ClassDeclaration_RouterliciousUrlResolver());
