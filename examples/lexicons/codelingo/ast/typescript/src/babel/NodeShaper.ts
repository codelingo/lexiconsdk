import { Node, typeParameter, typeAnnotation } from "@babel/types";
import { firstIfSame } from "./helpers";
import { EmitInstructions, EmitInstructions_v2 } from "./model";

export const shapeNodeForEmit = (n: Node): EmitInstructions_v2 | undefined => {
    // console.warn(node.type);
    switch (n.type) {
        case "ArrayExpression":
            return {
                children: [
                    { kind: "Elements", nodes: n.elements }, // optional
                ],
            };

        case "ArrayPattern":
            return {
                children: [
                    { kind: "Elements", nodes: n.elements },
                    n.typeAnnotation, // optional
                    { kind: "Decorators", nodes: n.decorators }, // optional
                ],
            };

        case "ArrowFunctionExpression": {
            const { async, expression, generator } = n;
            return {
                props: { async, expression, generator },
                children: [
                    { kind: "Parameters", nodes: n.params, keepWhenEmpty: true }, // optional
                    n.body,
                    n.returnType, // optional
                    n.typeParameters, // optional
                ],
            };
        }

        case "AssignmentExpression":
            return {
                props: { operator: n.operator },
                children: [
                    { kind: "Left", nodes: [n.left] },
                    { kind: "Right", nodes: [n.right] },
                ],
            };

        case "AssignmentPattern":
            return {
                children: [
                    { kind: "Left", nodes: [n.left] },
                    { kind: "Right", nodes: [n.right] },
                    { kind: "Decorators", nodes: n.decorators }, // optional
                    n.typeAnnotation, // optional
                ],
            };

        case "AwaitExpression":
            return { children: [n.argument] };

        case "BinaryExpression":
            return {
                props: { operator: n.operator },
                children: [
                    { kind: "Left", nodes: [n.left] },
                    { kind: "Right", nodes: [n.right] },
                ],
            };

        case "BooleanLiteral":
            return { props: { value: n.value } };

        case "BlockStatement":
            return { children: [...n.body] };

        case "BreakStatement":
        case "ContinueStatement":
            return { children: [n.label] };

        case "CallExpression": {
            const { optional } = n;
            return {
                props: { optional },
                children: [
                    n.callee,
                    { kind: "Arguments", nodes: n.arguments, keepWhenEmpty: true }, // optional
                    n.typeArguments, // optional
                    n.typeParameters, // optional
                ],
            };
        }

        case "CatchClause":
            return { children: [n.param, n.body], positional: true };

        case "ClassBody":
            return { children: [...n.body] };

        case "ClassDeclaration": {
            const { abstract, declare } = n;
            return {
                props: { abstract, declare },
                children: [
                    /// XXX: Consider the order of class children
                    n.id,
                    { kind: "Super", nodes: [n.superClass, n.superTypeParameters] }, // optional
                    n.body,
                    { kind: "Implements", nodes: n.implements }, // optional
                    n.typeParameters, // optional
                    n.mixins /* Flow */, // optional
                    { kind: "Decorators", nodes: n.decorators }, // optional
                ],
            };
        }

        case "ClassExpression": {
            return {
                children: [
                    n.id,
                    { kind: "Super", nodes: [n.superClass, n.superTypeParameters] }, // optional
                    n.body,
                    { kind: "Implements", nodes: n.implements }, // optional
                    n.typeParameters, // optional
                    n.mixins /* Flow */, // optional
                    { kind: "Decorators", nodes: n.decorators }, // optional
                ],
            };
        }

        case "ClassMethod": {
            const { access, accessibility, kind, computed, static: static_, generator, async, abstract, optional } = n;
            return {
                props: { access, accessibility, kind, computed, static: static_, generator, async, abstract, optional },
                children: [
                    { kind: "Key", nodes: [n.key] },
                    { kind: "Parameters", nodes: n.params, keepWhenEmpty: true },
                    n.body,
                    n.returnType, // optional
                    n.typeParameters, // optional
                    { kind: "Decorators", nodes: n.decorators }, // optional
                ],
            };
        }

        case "ClassProperty": {
            const { computed, static: s_, abstract, accessibility, declare, definite, optional, readonly } = n;
            return {
                props: { computed, static: s_, abstract, accessibility, declare, definite, optional, readonly },
                children: [
                    { kind: "Key", nodes: [n.key] },
                    { kind: "Value", nodes: [n.value], keepWhenEmpty: true }, // optional
                    n.typeAnnotation, // optional
                    { kind: "Decorators", nodes: n.decorators }, // optional
                ],
            };
        }

        case "ConditionalExpression":
            return { children: [n.test, n.consequent, n.alternate] };

        case "DebuggerStatement":
        case "EmptyStatement": /// XXX: skipEmit
        case "Import":
        case "Noop":
        case "Super":
            return {};

        case "Decorator":
            return { children: [n.expression] };

        case "DeclareFunction":
            return {
                children: [
                    n.id,
                    n.predicate, // optional
                ],
            };

        case "DoWhileStatement":
            return {
                children: [n.test, n.body],
                positional: true,
            };

        case "ExportAllDeclaration":
            return { children: [{ kind: "Source", nodes: [n.source] }] };

        case "ExportDefaultDeclaration":
            return { children: [{ kind: "Declaration", nodes: [n.declaration], keepWhenEmpty: true }] };

        case "ExportNamedDeclaration": {
            const { exportKind } = n;
            return {
                props: { exportKind },
                children: [
                    { kind: "Declaration", nodes: [n.declaration] /* optional */, keepWhenEmpty: true },
                    { kind: "Specifiers", nodes: n.specifiers, keepWhenEmpty: true },
                    { kind: "Source", nodes: [n.source] /* optional */, keepWhenEmpty: true },
                ],
            };
        }

        case "ExportSpecifier":
            // if the exported name for the import is the same as the local name
            // then only specify one identity child (the local)
            return { children: firstIfSame(n.local, n.exported) };

        case "ExpressionStatement":
            return { children: [n.expression] };

        case "ForOfStatement": {
            const { await } = n;
            return {
                props: { await },
                children: [{ kind: "Left", nodes: [n.left] }, { kind: "Right", nodes: [n.right] }, n.body],
            };
        }

        case "ForInStatement":
            return {
                children: [{ kind: "Left", nodes: [n.left] }, { kind: "Right", nodes: [n.right] }, n.body],
            };

        case "ForStatement":
            return {
                children: [
                    {
                        kind: "Init",
                        nodes: [n.init], //optional
                        keepWhenEmpty: true,
                    },
                    {
                        kind: "Test",
                        nodes: [n.test], //optional
                        keepWhenEmpty: true,
                    },
                    {
                        kind: "Update",
                        nodes: [n.update], //optional
                        keepWhenEmpty: true,
                    },
                    n.body,
                ],
                positional: true,
            };

        case "FunctionDeclaration": {
            const { async, generator, declare } = n;
            return {
                props: { async, generator, declare },
                children: [
                    n.id,
                    { kind: "Parameters", nodes: n.params },
                    n.body,
                    n.returnType, // optional
                    n.typeParameters, // optional
                ],
            };
        }

        case "FunctionExpression": {
            const { async, generator } = n;
            return {
                props: { async, generator },
                children: [
                    n.id,
                    { kind: "Parameters", nodes: n.params },
                    n.body,
                    n.returnType, // optional
                    n.typeParameters, // optional
                ],
            };
        }

        case "Identifier":
            return { props: { name: n.name } };

        case "IfStatement":
            return {
                children: [
                    n.test,
                    n.consequent,
                    n.alternate, // optional
                ],
                positional: true,
            };

        case "ImportDeclaration":
            return {
                props: { importKind: n.importKind },
                children: [
                    { kind: "Specifiers", nodes: n.specifiers },
                    { kind: "Source", nodes: [n.source] },
                ],
            };

        case "ImportSpecifier": {
            // if the local name for the import is the same as the imported name
            // then only specify one identity child (the imported)
            return { children: firstIfSame(n.imported, n.local) };
        }

        case "ImportNamespaceSpecifier":
        case "ImportDefaultSpecifier":
            return { children: [n.local] };

        case "JSXAttribute":
            return {
                children: [n.name, n.value],
                positional: true,
            };

        case "JSXClosingElement":
            return {
                children: [n.name],
            };

        case "JSXElement": {
            const { selfClosing } = n;
            return {
                props: { selfClosing },
                children: [
                    n.openingElement,
                    n.closingElement, // optional
                    { kind: "Children", nodes: n.children }, // optional
                ],
                positional: true,
            };
        }

        case "JSXEmptyExpression":
        case "JSXFragment":
        case "JSXOpeningFragment":
        case "JSXClosingFragment":
            return {};

        case "JSXExpressionContainer":
        case "JSXSpreadChild":
            return { children: [n.expression] };

        case "JSXIdentifier":
            return { props: { name: n.name } };

        case "JSXMemberExpression":
            return {
                children: [n.object, n.property],
                positional: true,
            };

        case "JSXNamespacedName":
            return {
                children: [n.namespace, n.name],
                positional: true,
            };

        case "JSXOpeningElement": {
            const { selfClosing } = n;
            return {
                props: { selfClosing },
                children: [
                    n.name,
                    { kind: "Attributes", nodes: n.attributes }, // optional
                    n.typeParameters, // optional
                ],
            };
        }

        case "JSXSpreadAttribute":
            return { children: [n.argument] };

        case "JSXText":
            return { props: { value: n.value } };

        case "LabeledStatement":
            return { children: [n.label, n.body] };

        case "LogicalExpression":
            return {
                props: { operator: n.operator },
                children: [
                    { kind: "Left", nodes: [n.left] },
                    { kind: "Right", nodes: [n.right] },
                ],
            };

        case "MemberExpression":
            return {
                props: { optional: n.optional, computed: n.computed },
                children: [n.object, n.property],
            };

        case "NewExpression":
            return {
                props: { optional: n.optional },
                children: [
                    n.callee,
                    n.typeParameters, // optional
                    n.typeArguments, // optional /* Flow */
                ],
            };

        case "ObjectExpression":
            return {
                children: [{ kind: "Properties", nodes: n.properties, keepWhenEmpty: true }],
            };

        case "ObjectMethod": {
            const { kind, computed, generator, async } = n;
            return {
                props: { kind, computed, generator, async },
                children: [
                    { kind: "Key", nodes: [n.key] },
                    { kind: "Parameters", nodes: n.params, keepWhenEmpty: true }, // optional
                    n.body,
                    n.returnType, // optional
                    n.typeParameters, // optional
                    { kind: "Decorators", nodes: n.decorators }, // optional
                ],
            };
        }

        case "ObjectPattern":
            return {
                children: [
                    { kind: "Properties", nodes: n.properties, keepWhenEmpty: true },
                    n.typeAnnotation, // optional
                    { kind: "Decorators", nodes: n.decorators }, // optional
                ],
            };

        case "ObjectProperty":
            return {
                props: { computed: n.computed, shorthand: n.shorthand },
                children: [
                    n.key,
                    n.value,
                    { kind: "Decorators", nodes: n.decorators }, // optional
                ],
                positional: true,
            };

        case "OptionalCallExpression": {
            const { optional } = n;
            return {
                props: { optional },
                children: [
                    n.callee,
                    { kind: "Arguments", nodes: n.arguments, keepWhenEmpty: true }, // optional
                    n.typeArguments, // optional
                    n.typeParameters, // optional
                ],
                positional: true,
            };
        }

        case "OptionalMemberExpression": {
            const { computed, optional } = n;
            return {
                props: { computed, optional },
                children: [n.object, n.property],
                positional: true,
            };
        }

        case "Program":
            return { skipEmit: true, children: n.body };

        case "RestElement":
            return {
                children: [
                    n.argument,
                    n.typeAnnotation, // optional
                    { kind: "Decorators", nodes: n.decorators }, // optional
                ],
            };

        case "ReturnStatement":
            return { children: [n.argument] };

        case "BooleanLiteral":
        case "NumericLiteral":
        case "StringLiteral":
            return { props: { value: n.value } };

        case "NullLiteral":
            return {};

        case "RegExpLiteral":
            return { props: { pattern: n.pattern, flags: n.flags } };

        case "SequenceExpression":
            return { children: [{ kind: "Expressions", nodes: n.expressions, keepWhenEmpty: true }] };

        case "SpreadElement":
            return { children: [n.argument] };

        case "SwitchCase":
            return { children: [n.test, { kind: "Consequent", nodes: n.consequent }] };

        case "SwitchStatement":
            return {
                children: [
                    n.discriminant,
                    {
                        kind: "Cases",
                        nodes: n.cases, // optional
                        keepWhenEmpty: true,
                    },
                ],
            };

        case "TaggedTemplateExpression":
            return {
                children: [
                    n.tag,
                    n.quasi,
                    n.typeParameters, // optional
                ],
                positional: true,
            };

        case "TemplateElement":
            return {
                props: {
                    value: n.value.raw,
                    cooked: n.value.cooked,
                    tail: n.tail,
                },
            };

        case "TemplateLiteral":
            return {
                children: [
                    { kind: "Quasis", nodes: n.quasis, keepWhenEmpty: true },
                    { kind: "Expressions", nodes: n.expressions, keepWhenEmpty: true },
                ],
            };

        case "ThrowStatement":
            return { children: [n.argument] };

        case "TryStatement":
            return {
                children: [
                    n.block,
                    n.handler, // optional
                    n.finalizer, // optional
                ],
                positional: true,
            };

        case "TSArrayType":
            return { children: [n.elementType] };

        case "TSAsExpression":
            return { children: [n.expression, n.typeAnnotation] };

        case "TSConstructorType":
            return {
                children: [
                    { kind: "Parameters", nodes: n.parameters },
                    n.typeAnnotation, // optional
                    n.typeParameters, // optional
                ],
            };

        case "TSEnumDeclaration": {
            const { const: const_, declare } = n;
            return {
                props: { const: const_, declare },
                children: [
                    n.id,
                    { kind: "Members", nodes: n.members, keepWhenEmpty: true },
                    n.initializer, // optional
                ],
            };
        }

        case "TSExportAssignment":
            return { children: [n.expression] };

        case "TSExternalModuleReference":
            return { children: [n.expression] };

        case "TSFunctionType":
            return {
                children: [
                    { kind: "Parameters", nodes: n.parameters, keepWhenEmpty: true },
                    n.typeAnnotation,
                    n.typeParameters,
                ],
            };

        case "TSImportEqualsDeclaration": {
            const { isExport } = n;
            return {
                props: { isExport },
                children: [n.id, n.moduleReference],
            };
        }

        case "TSImportType":
            return {
                children: [
                    n.argument,
                    n.qualifier, // optional
                    n.typeParameters, // optional
                ],
            };

        case "TSInterfaceDeclaration":
            return {
                children: [
                    n.id,
                    n.body,
                    n.typeParameters, // optional
                    { kind: "Extends", nodes: n.extends }, // optional
                ],
            };

        case "InterfaceDeclaration":
            return {
                children: [
                    n.id,
                    n.body,
                    n.typeParameters, // optional
                    { kind: "Extends", nodes: n.extends }, // optional
                    { kind: "Implements", nodes: n.implements }, // optional
                    { kind: "Mixins", nodes: n.mixins }, // optional
                ],
            };

        case "TSInterfaceBody":
            return { skipEmit: true, children: n.body };

        case "TSLiteralType":
            return { children: [n.literal] };

        case "TSModuleBlock":
            return { children: n.body };

        case "TSModuleDeclaration": {
            const { declare, global } = n;
            return {
                props: { declare, global },
                children: [n.id, n.body],
            };
        }

        case "TSParameterProperty": {
            const { accessibility, readonly } = n;
            return {
                props: { accessibility, readonly },
                children: [n.parameter],
            };
        }

        case "TSPropertySignature":
            return {
                props: { computed: n.computed },
                children: [
                    { kind: "Key", nodes: [n.key] },
                    { kind: "Initializer", nodes: [n.initializer] }, // optional
                    n.typeAnnotation, // optional
                ],
            };

        case "TSTupleType":
            return { children: n.elementTypes };

        case "TSTypeParameterDeclaration":
            return { children: [{ kind: "Parameters", nodes: n.params }] };

        case "TSTypeQuery":
            return { children: [n.exprName] };

        case "TSTypeReference":
            return {
                children: [
                    n.typeName,
                    n.typeParameters, // optional
                ],
            };

        case "TSCallSignatureDeclaration":
        case "TSConstructSignatureDeclaration":
            return {
                children: [
                    { kind: "Parameters", nodes: n.parameters },
                    n.typeAnnotation, // optional
                    n.typeParameters, // optional
                ],
            };

        case "InterfaceExtends":
            return { children: [n.id] };

        case "TSConditionalType":
            return {
                children: [n.checkType, n.extendsType, n.trueType, n.falseType],
            };

        case "TSDeclareFunction": {
            const { async, declare, generator } = n;
            return {
                props: { async, declare, generator },
                children: [
                    n.id,
                    { kind: "Parameters", nodes: n.params, keepWhenEmpty: true },
                    n.returnType, // optional
                    n.typeParameters, // optional
                ],
            };
        }

        case "TSDeclareMethod": {
            const { abstract, access, accessibility, async, computed, generator, kind, optional, static: static_ } = n;
            return {
                props: {
                    abstract,
                    access,
                    accessibility,
                    async,
                    computed,
                    generator,
                    kind,
                    optional,
                    static: static_,
                },
                children: [
                    { kind: "Key", nodes: [n.key] },
                    { kind: "Parameters", nodes: n.params, keepWhenEmpty: true },
                    n.returnType, // optional
                    n.typeParameters, // optional
                    { kind: "Decorators", nodes: n.decorators }, // optional
                ],
            };
        }

        case "TSEnumMember":
            return {
                children: [n.id, n.initializer],
                positional: true,
            };

        case "TSExpressionWithTypeArguments":
            return { children: [n.expression, n.typeParameters] };

        case "TSTypeOperator": {
            const { operator } = n;
            return {
                props: { operator },
                children: [n.typeAnnotation],
            };
        }
        case "TSIndexSignature": {
            const { readonly } = n;
            return {
                props: { readonly },
                children: [
                    { kind: "Parameters", nodes: n.parameters, keepWhenEmpty: true },
                    n.typeAnnotation, // optional
                ],
            };
        }

        case "TSIndexedAccessType":
            return {
                children: [n.objectType, n.indexType],
                positional: true,
            };

        case "TSIntersectionType":
            return { children: [...n.types] };

        case "TSMappedType": {
            const { optional, readonly } = n;
            return {
                props: { optional, readonly },
                children: [n.typeParameter, n.typeAnnotation],
            };
        }

        case "TSMethodSignature":
            return {
                props: { optional: n.optional, computed: n.computed },
                children: [n.typeParameters, n.typeAnnotation],
            };

        case "TSNamespaceExportDeclaration":
            return { children: [n.id] };

        case "TSNonNullExpression":
            return { children: [n.expression] };

        case "TSParenthesizedType":
        case "TSRestType":
        case "TSTypeAnnotation":
            return { children: [n.typeAnnotation] };

        case "TSQualifiedName":
            return {
                children: [
                    { kind: "Left", nodes: [n.left] },
                    { kind: "Right", nodes: [n.right] },
                ],
            };

        case "TSStringKeyword":
        case "TSAnyKeyword":
        case "TSBooleanKeyword":
        case "TSBigIntKeyword":
        case "TSNeverKeyword":
        case "TSNullKeyword":
        case "TSNumberKeyword":
        case "TSObjectKeyword":
        case "TSSymbolKeyword":
        case "TSUndefinedKeyword":
        case "TSUnknownKeyword":
        case "TSVoidKeyword":
        case "TSThisType":
        case "ThisExpression":
            return {};

        case "TSTypeAliasDeclaration": {
            const { declare } = n;
            return {
                props: { declare },
                children: [
                    n.id,
                    n.typeAnnotation,
                    n.typeParameters, // optional
                ],
            };
        }

        case "TSTypeAssertion":
            return { children: [n.typeAnnotation, n.expression] };

        case "TSInferType":
            return { children: [n.typeParameter] };

        case "TSTypeLiteral":
            // XXX: Should this be un-nested? i.e. `{ children: n.members }`
            return { children: [{ kind: "Members", nodes: n.members }] };

        case "TSTypeParameter": {
            const { name } = n;
            return {
                props: { name },
                children: [
                    n.constraint,
                    n.default, // optional
                ],
                positional: true,
            };
        }

        case "TSTypeParameterInstantiation":
            return { children: [{ kind: "Parameters", nodes: n.params }] };

        case "TSTypePredicate": {
            const { asserts } = n;
            return {
                props: { asserts },
                children: [
                    n.parameterName,
                    n.typeAnnotation, // optional
                ],
                positional: true,
            };
        }

        case "TSUnionType":
            return { children: [{ kind: "Types", nodes: n.types }] };

        case "UnaryExpression":
            return {
                props: { prefix: n.prefix, operator: n.operator },
                children: [n.argument],
            };

        case "UpdateExpression": {
            const { prefix, operator } = n;
            return {
                props: { operator, prefix },
                children: [n.argument],
            };
        }

        case "VariableDeclaration":
            return {
                props: { kind: n.kind, declare: n.declare },
                children: [...n.declarations],
            };

        case "VariableDeclarator":
            return {
                props: { definite: n.definite },
                children: [n.id, n.init],
                positional: true,
            };

        case "WhileStatement":
            return {
                children: [n.test, n.body],
                positional: true,
            };

        case "YieldExpression":
            const { delegate } = n;
            return {
                props: { delegate },
                children: [n.argument],
            };

        // -------------------------

        case "BinaryExpression":
        case "InterpreterDirective":
        case "Directive":
        case "DirectiveLiteral":
        case "File":
        case "ParenthesizedExpression":
        case "WithStatement":
        case "AssignmentPattern":
        case "MetaProperty":
        case "BigIntLiteral":
        case "ExportNamespaceSpecifier":
        case "AnyTypeAnnotation":
        case "ArrayTypeAnnotation":
        case "BooleanTypeAnnotation":
        case "BooleanLiteralTypeAnnotation":
        case "NullLiteralTypeAnnotation":
        case "ClassImplements":
        case "DeclareClass":
        case "DeclareInterface":
        case "DeclareModule":
        case "DeclareModuleExports":
        case "DeclareTypeAlias":
        case "DeclareOpaqueType":
        case "DeclareVariable":
        case "DeclareExportDeclaration":
        case "DeclareExportAllDeclaration":
        case "DeclaredPredicate":
        case "ExistsTypeAnnotation":
        case "FunctionTypeAnnotation":
        case "FunctionTypeParam":
        case "GenericTypeAnnotation":
        case "InferredPredicate":
        case "InterfaceTypeAnnotation":
        case "IntersectionTypeAnnotation":
        case "MixedTypeAnnotation":
        case "EmptyTypeAnnotation":
        case "NullableTypeAnnotation":
        case "NumberLiteralTypeAnnotation":
        case "NumberTypeAnnotation":
        case "ObjectTypeAnnotation":
        case "ObjectTypeInternalSlot":
        case "ObjectTypeCallProperty":
        case "ObjectTypeIndexer":
        case "ObjectTypeProperty":
        case "ObjectTypeSpreadProperty":
        case "OpaqueType":
        case "QualifiedTypeIdentifier":
        case "StringLiteralTypeAnnotation":
        case "StringTypeAnnotation":
        case "SymbolTypeAnnotation":
        case "ThisTypeAnnotation":
        case "TupleTypeAnnotation":
        case "TypeofTypeAnnotation":
        case "TypeAlias":
        case "TypeAnnotation":
        case "TypeCastExpression":
        case "TypeParameter":
        case "TypeParameterDeclaration":
        case "TypeParameterInstantiation":
        case "UnionTypeAnnotation":
        case "Variance":
        case "VoidTypeAnnotation":
        case "EnumDeclaration":
        case "EnumBooleanBody":
        case "EnumNumberBody":
        case "EnumStringBody":
        case "EnumSymbolBody":
        case "EnumBooleanMember":
        case "EnumNumberMember":
        case "EnumStringMember":
        case "EnumDefaultedMember":
        case "Placeholder":
        case "V8IntrinsicIdentifier":
        case "ArgumentPlaceholder":
        case "BindExpression":
        case "PipelineTopicExpression":
        case "PipelineBareFunction":
        case "PipelinePrimaryTopicReference":
        case "ClassPrivateProperty":
        case "ClassPrivateMethod":
        case "ImportAttribute":
        case "DoExpression":
        case "ExportDefaultSpecifier":
        case "PrivateName":
        case "RecordExpression":
        case "TupleExpression":
        case "DecimalLiteral":
        case "TSOptionalType":
        case "TSNamedTupleMember":
        case "TSNonNullExpression":
        default:
            console.warn(`No shaper for "${n.type}"`);
            return undefined;
    }
};
