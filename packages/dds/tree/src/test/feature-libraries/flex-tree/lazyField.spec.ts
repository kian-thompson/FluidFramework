/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable import/no-internal-modules */

import { strict as assert } from "node:assert";

import { validateAssertionError } from "@fluidframework/test-runtime-utils/internal";

import {
	type FieldAnchor,
	type FieldKey,
	type ITreeSubscriptionCursor,
	type TreeFieldStoredSchema,
	type TreeStoredSchema,
	TreeStoredSchemaRepository,
	type UpPath,
	rootFieldKey,
} from "../../../core/index.js";
import {
	LazyField,
	LazyOptionalField,
	LazySequence,
	LazyValueField,
	unboxedFlexNode,
} from "../../../feature-libraries/flex-tree/lazyField.js";
import {
	FieldKinds,
	MockNodeIdentifierManager,
	cursorForJsonableTreeNode,
	defaultSchemaPolicy,
	Context,
	isFlexTreeNode,
	mapTreeFromCursor,
} from "../../../feature-libraries/index.js";
import { brand, disposeSymbol } from "../../../util/index.js";
import {
	fieldCursorFromInsertable,
	flexTreeViewWithContent,
	forestWithContent,
	MockTreeCheckout,
} from "../../utils.js";

import {
	getReadonlyContext,
	initializeCursor,
	readonlyTreeWithContent,
	rootFieldAnchor,
} from "./utils.js";
import { numberSchema, SchemaFactory, stringSchema } from "../../../simple-tree/index.js";
import { getStoredSchema, toStoredSchema } from "../../../simple-tree/toStoredSchema.js";
import { singleJsonCursor } from "../../json/index.js";
import { JsonAsTree } from "../../../jsonDomainSchema.js";

const detachedField: FieldKey = brand("detached");
const detachedFieldAnchor: FieldAnchor = { parent: undefined, fieldKey: detachedField };

/**
 * Test {@link LazyField} implementation.
 */
class TestLazyField extends LazyField {}

describe("LazyField", () => {
	it("LazyField implementations do not allow edits to detached trees", () => {
		const schema = toStoredSchema(JsonAsTree.JsonObject);
		const forest = forestWithContent({
			schema,
			initialTree: singleJsonCursor({}),
		});
		const context = getReadonlyContext(forest, JsonAsTree.JsonObject);
		const cursor = initializeCursor(context, detachedFieldAnchor);

		const optionalField = new LazyOptionalField(
			context,
			FieldKinds.optional.identifier,
			cursor,
			detachedFieldAnchor,
		);
		const valueField = new LazyValueField(
			context,
			FieldKinds.required.identifier,
			cursor,
			detachedFieldAnchor,
		);
		cursor.free();
		assert.throws(
			() => optionalField.editor.set(undefined, optionalField.length === undefined),
			(e: Error) =>
				validateAssertionError(e, /only allowed on fields with TreeStatus.InDocument status/),
		);
		assert.throws(
			() => valueField.editor.set(mapTreeFromCursor(singleJsonCursor({}))),
			(e: Error) =>
				validateAssertionError(e, /only allowed on fields with TreeStatus.InDocument status/),
		);
	});

	it("is", () => {
		// #region Tree and schema initialization

		const builder = new SchemaFactory("test");
		const rootSchema = builder.optional(JsonAsTree.JsonObject);

		// Note: this tree initialization is strictly to enable construction of the lazy field.
		// The test cases below are strictly in terms of the schema of the created fields.
		const { context, cursor } = readonlyTreeWithContent({
			schema: rootSchema,
			initialTree: {},
		});

		// #endregion

		// #region OptionalField<Primitive>

		const booleanOptionalField = new LazyOptionalField(
			context,
			FieldKinds.optional.identifier,
			cursor,
			detachedFieldAnchor,
		);

		assert(booleanOptionalField.is(FieldKinds.optional));
		// Different kinds
		assert(!booleanOptionalField.is(FieldKinds.required));
		// #endregion
	});

	it("parent", () => {
		const factory = new SchemaFactory("test");
		class Struct extends factory.object("Struct", {
			foo: factory.number,
		}) {}
		const schema = toStoredSchema(Struct);

		const { context, cursor } = readonlyTreeWithContent({
			schema: Struct,
			initialTree: { foo: 5 },
		});

		const rootField = new TestLazyField(
			context,
			schema.rootFieldSchema.kind,
			cursor,
			rootFieldAnchor,
		);
		assert.equal(rootField.parent, undefined);

		const parentPath: UpPath = {
			parent: undefined,
			parentField: rootFieldKey,
			parentIndex: 0,
		};
		const parentAnchor = context.checkout.forest.anchors.track(parentPath);

		// Move cursor down to leaf field
		cursor.enterNode(0);
		cursor.enterField(brand("foo"));

		const leafField = new TestLazyField(context, FieldKinds.required.identifier, cursor, {
			parent: parentAnchor,
			fieldKey: brand("foo"),
		});
		assert.equal(leafField.parent, rootField.boxedAt(0));
	});

	it("Disposes when context is disposed", () => {
		const factory = new SchemaFactory("LazyField");
		const schema = toStoredSchema(factory.number);
		const forest = forestWithContent({
			schema,
			initialTree: fieldCursorFromInsertable(SchemaFactory.number, 5),
		});
		const context = getReadonlyContext(forest, SchemaFactory.number);
		const cursor = initializeCursor(context, detachedFieldAnchor);

		const field = new TestLazyField(
			context,
			schema.rootFieldSchema.kind,
			cursor,
			detachedFieldAnchor,
		);

		assert(!field.isFreed());
		context[disposeSymbol]();
		assert(field.isFreed());
	});

	it("Disposes when parent is disposed", () => {
		const factory = new SchemaFactory("LazyField");
		class Holder extends factory.object("holder", { f: factory.number }) {}
		const schema = toStoredSchema(Holder);
		const forest = forestWithContent({
			schema,
			initialTree: fieldCursorFromInsertable(Holder, { f: 5 }),
		});
		const context = getReadonlyContext(forest, Holder);

		const holder = [...context.root][0];
		assert(holder.type === Holder.identifier);
		const field = holder.getBoxed(brand("f"));
		assert(field instanceof LazyField);

		assert(!field.isFreed());
		const v = forest.anchors.acquireVisitor();
		v.destroy(rootFieldKey, 1);
		assert(field.isFreed());

		// Should not double free.
		context[disposeSymbol]();
	});

	it("Disposes when context then parent is disposed", () => {
		const factory = new SchemaFactory("LazyField");
		class Holder extends factory.object("holder", { f: factory.number }) {}
		const schema = toStoredSchema(Holder);
		const forest = forestWithContent({
			schema,
			initialTree: fieldCursorFromInsertable(Holder, { f: 5 }),
		});
		const context = getReadonlyContext(forest, Holder);

		const holder = [...context.root][0];
		assert(holder.type === Holder.identifier);
		const field = holder.getBoxed(brand("f"));
		assert(field instanceof LazyField);

		assert(!field.isFreed());
		context[disposeSymbol]();
		assert(field.isFreed());
		// Should not double free.
		const v = forest.anchors.acquireVisitor();
		v.destroy(rootFieldKey, 1);
	});

	describe("unboxedFlexNode", () => {
		it("Leaf", () => {
			const { context, cursor } = readonlyTreeWithContent({
				schema: stringSchema,
				initialTree: "Hello world",
			});
			cursor.enterNode(0); // Root node field has 1 node; move into it

			assert.equal(
				unboxedFlexNode(context, cursor, { fieldKey: brand("x"), parent: undefined }),
				"Hello world",
			);
		});

		it("null-Leaf", () => {
			const { context, cursor } = readonlyTreeWithContent({
				schema: JsonAsTree.Tree,
				initialTree: null,
			});
			cursor.enterNode(0); // Root node field has 1 node; move into it

			assert.equal(
				unboxedFlexNode(context, cursor, { fieldKey: brand("x"), parent: undefined }),
				null,
			);
		});

		it("Non-Leaf", () => {
			const { context, cursor } = readonlyTreeWithContent({
				schema: JsonAsTree.Tree,
				initialTree: {},
			});
			cursor.enterNode(0); // Root node field has 1 node; move into it

			assert(
				isFlexTreeNode(
					unboxedFlexNode(context, cursor, { fieldKey: brand("x"), parent: undefined }),
				),
			);
		});

		it("Non-Leaf - cached", () => {
			const { context, cursor } = readonlyTreeWithContent({
				schema: JsonAsTree.Tree,
				initialTree: {},
			});

			const anchor = cursor.buildFieldAnchor();
			cursor.enterNode(0); // Root node field has 1 node; move into it

			const first = unboxedFlexNode(context, cursor, anchor);
			assert(isFlexTreeNode(first));
			// Cached.
			const second = unboxedFlexNode(
				context,
				// Dummy cursor which will only work on cached code path
				{ fieldIndex: 0 } as unknown as ITreeSubscriptionCursor,
				anchor,
			);
			assert(first === second);
		});
	});

	describe("LazyOptionalField", () => {
		const builder = new SchemaFactory("test");
		const schema = builder.optional(builder.number);
		const storedSchema = toStoredSchema(schema);
		const rootSchema = storedSchema.rootFieldSchema;

		describe("Field with value", () => {
			const { context, cursor } = readonlyTreeWithContent({
				schema,
				initialTree: 42,
			});
			const field = new LazyOptionalField(context, rootSchema.kind, cursor, rootFieldAnchor);

			it("atIndex", () => {
				assert.equal(field.atIndex(0), 42);
			});

			it("boxedAt", () => {
				const boxedResult = field.boxedAt(0) ?? assert.fail();
				assert.equal(boxedResult.type, numberSchema.identifier);
				assert.equal(boxedResult.value, 42);
			});

			it("length", () => {
				assert.equal(field.length, 1);
			});

			it("map", () => {
				assert.deepEqual(
					field.map((value) => value),
					[42],
				);
			});
		});

		describe("Field without value", () => {
			const { context, cursor } = readonlyTreeWithContent({
				schema,
				initialTree: undefined,
			});
			const field = new LazyOptionalField(context, rootSchema.kind, cursor, rootFieldAnchor);

			it("atIndex", () => {
				// Invalid to request the value if there isn't one.
				assert.throws(() => field.atIndex(0));
			});

			it("boxedAt", () => {
				assert.equal(field.boxedAt(0), undefined);
			});

			it("length", () => {
				assert.equal(field.length, 0);
			});

			it("map", () => {
				assert.deepEqual(
					field.map((value) => value),
					[],
				);
			});
		});

		it("content", () => {
			const view = flexTreeViewWithContent({
				schema: SchemaFactory.optional(JsonAsTree.Tree),
				initialTree: 5,
			});
			assert(view.root.is(FieldKinds.optional));
			assert.equal(view.root.content, 5);
			view.root.editor.set(mapTreeFromCursor(singleJsonCursor(6)), view.root.length === 0);
			assert.equal(view.root.content, 6);
			view.root.editor.set(undefined, view.root.length === 0);
			assert.equal(view.root.content, undefined);
			view.root.editor.set(
				mapTreeFromCursor(
					cursorForJsonableTreeNode({
						type: brand(numberSchema.identifier),
						value: 7,
					}),
				),
				view.root.length === 0,
			);
			assert.equal(view.root.content, 7);
		});
	});

	describe("LazyValueField", () => {
		const builder = new SchemaFactory("test");
		const schema = builder.required(builder.string);
		const schemaStored = toStoredSchema(schema);
		const rootSchema = schemaStored.rootFieldSchema;
		const initialTree = "Hello world";

		const { context, cursor } = readonlyTreeWithContent({
			schema,
			initialTree,
		});

		const field = new LazyValueField(context, rootSchema.kind, cursor, rootFieldAnchor);

		it("atIndex", () => {
			assert.equal(field.atIndex(0), initialTree);
		});

		it("boxedAt", () => {
			const boxedResult = field.boxedAt(0) ?? assert.fail();
			assert.equal(boxedResult.type, stringSchema.identifier);
			assert.equal(boxedResult.value, initialTree);
		});

		it("length", () => {
			assert.equal(field.length, 1);
		});

		it("map", () => {
			assert.deepEqual(
				field.map((value) => value),
				[initialTree],
			);
		});

		it("content", () => {
			const view = flexTreeViewWithContent({
				schema,
				initialTree: "X",
			});
			assert(view.root.is(FieldKinds.required));
			assert.equal(view.root.content, "X");
			view.root.editor.set(mapTreeFromCursor(singleJsonCursor("Y")));
			assert.equal(view.root.content, "Y");
			const zCursor = cursorForJsonableTreeNode({
				type: brand(stringSchema.identifier),
				value: "Z",
			});
			view.root.editor.set(mapTreeFromCursor(zCursor));
			assert.equal(view.root.content, "Z");
		});
	});

	describe("LazySequence", () => {
		const rootSchema: TreeFieldStoredSchema = {
			kind: FieldKinds.sequence.identifier,
			types: new Set([brand(numberSchema.identifier)]),
			persistedMetadata: undefined,
		};
		const schema: TreeStoredSchema = {
			rootFieldSchema: rootSchema,
			nodeSchema: new Map([[brand(numberSchema.identifier), getStoredSchema(numberSchema)]]),
		};

		/**
		 * Creates a tree with a sequence of numbers at the root, and returns the sequence
		 */
		function testSequence(data: number[]) {
			const content = data.map((n) => singleJsonCursor(n));
			const forest = forestWithContent({
				schema,
				initialTree: content,
			});
			const context = new Context(
				defaultSchemaPolicy,
				new MockTreeCheckout(forest, {
					schema: new TreeStoredSchemaRepository(schema),
				}),
				new MockNodeIdentifierManager(),
			);
			const cursor = initializeCursor(context, rootFieldAnchor);

			return new LazySequence(context, rootSchema.kind, cursor, rootFieldAnchor);
		}

		it("atIndex", () => {
			const sequence = testSequence([37, 42]);
			assert.equal(sequence.length, 2);
			assert.equal(sequence.atIndex(0), 37);
			assert.equal(sequence.atIndex(1), 42);
			assert.throws(() => sequence.atIndex(2));
		});

		it("at", () => {
			const sequence = testSequence([37, 42]);
			assert.equal(sequence.length, 2);
			assert.equal(sequence.at(0), 37);
			assert.equal(sequence.at(1), 42);
			assert.equal(sequence.at(-1), 42); // Negative index > -sequence.length
			assert.equal(sequence.at(-2), 37); // Negative index > -sequence.length
			assert.equal(sequence.at(2), undefined); // Positive index >= sequence.length
			assert.equal(sequence.at(-3), undefined); // Negative index < -sequence.length
		});

		it("boxedAt", () => {
			const sequence = testSequence([37, 42]);
			const boxedResult0 = sequence.boxedAt(0) ?? assert.fail();
			assert.equal(boxedResult0.type, numberSchema.identifier);
			assert.equal(boxedResult0.value, 37);

			const boxedResult1 = sequence.boxedAt(1) ?? assert.fail();
			assert.equal(boxedResult1.type, numberSchema.identifier);
			assert.equal(boxedResult1.value, 42);

			const boxedResultNeg1 = sequence.boxedAt(-1) ?? assert.fail();
			assert.equal(boxedResultNeg1.type, numberSchema.identifier);
			assert.equal(boxedResultNeg1.value, 42);

			assert.equal(sequence.boxedAt(2), undefined);
			assert.equal((sequence.boxedAt(-2) ?? assert.fail()).value, 37);
		});

		it("length", () => {
			assert.equal(testSequence([]).length, 0);
			assert.equal(testSequence([37, 42]).length, 2);
		});

		it("map", () => {
			const sequence = testSequence([1, 2]);
			const mapResult = sequence.map((value) => (value as number) * 2);
			assert.deepEqual(mapResult, [2, 4]);
		});
	});
});
