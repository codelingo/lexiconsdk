import { Node, typeParameter } from "@babel/types";
import { Dictionary } from "./model";
import { parse } from "@babel/parser";

type Primitive = string | number | boolean | null | undefined;

export interface EmitInstructions {
    skipEmit?: boolean;
    children?: Array<Node | null | undefined>;
    namedChildren?: Dictionary<(Node | null)[] | null | undefined>;
    props?: Dictionary<Primitive>;
    positional?: true | undefined;
}

const firstIfSame = (a: Node, b: Node): Node[] => (a.start === b.start && a.end === b.end ? [a] : [a, b]);

export const shapeNodeForEmit = (n: Node): EmitInstructions | undefined => {
    // console.warn(node.type);
    switch (n.type) {
        case "ArrayExpression":
            return { namedChildren: { Elements: n.elements } };

        case "ArrayPattern":
            return {
                children: [n.typeAnnotation],
                namedChildren: { Elements: n.elements, Decorators: n.decorators },
            };

        case "ArrowFunctionExpression":
            return {
                props: { async: n.async, expression: n.expression, generator: n.generator },
                children: [n.body, n.returnType, n.typeParameters],
                namedChildren: { Parameters: n.params },
            };

        case "AssignmentExpression":
            return {
                props: { operator: n.operator },
                namedChildren: { LHS: [n.left], RHS: [n.right] },
            };

        case "AssignmentPattern":
            return {
                children: [n.typeAnnotation],
                namedChildren: { LHS: [n.left], RHS: [n.right], Decorators: n.decorators },
            };

        case "AwaitExpression":
            return { children: [n.argument] };

        case "BinaryExpression":
            return {
                props: { operator: n.operator },
                namedChildren: { LHS: [n.left], RHS: [n.right] },
            };

        case "BooleanLiteral":
            return { props: { value: n.value } };

        case "BlockStatement":
            return { children: n.body };

        case "BreakStatement":
        case "ContinueStatement":
            return { children: [n.label] };

        case "CallExpression":
            return {
                props: { optional: n.optional },
                children: [n.typeArguments, n.typeParameters, n.callee],
                namedChildren: { Arguments: n.arguments },
            };

        case "CatchClause":
            return { children: [n.param, n.body] };

        case "ClassBody":
            return { children: n.body };

        case "ClassDeclaration": {
            const { abstract, declare } = n;
            return {
                props: { abstract, declare },
                namedChildren: {
                    Decorators: n.decorators,
                    Implements: n.implements,
                    Super: [n.superClass, n.superTypeParameters],
                },
                children: [n.id, n.body, n.typeParameters, n.mixins /* Flow */],
            };
        }

        case "ClassExpression": {
            return {
                namedChildren: {
                    Decorators: n.decorators,
                    Implements: n.implements,
                    Super: [n.superClass, n.superTypeParameters],
                },
                children: [n.id, n.body, n.typeParameters, n.mixins /* Flow */],
            };
        }

        case "ClassMethod": {
            const { access, accessibility, kind, computed, static: static_, generator, async, abstract, optional } = n;
            return {
                props: { access, accessibility, kind, computed, static: static_, generator, async, abstract, optional },
                namedChildren: {
                    Parameters: n.params,
                    Decorators: n.decorators,
                    Key: [n.key],
                },
                children: [n.body, n.typeParameters, n.returnType],
            };
        }

        case "ClassProperty": {
            const { computed, static: static_, abstract, accessibility, declare, definite, optional, readonly } = n;
            return {
                props: { computed, static: static_, abstract, accessibility, declare, definite, optional, readonly },
                namedChildren: {
                    Key: [n.key],
                    Value: [n.value],
                    Decorators: n.decorators,
                },
                children: [n.typeAnnotation],
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
            return { children: [n.id, n.predicate] };

        case "DoWhileStatement":
            return {
                children: [n.test, n.body],
                positional: true,
            };

        case "ExportAllDeclaration":
            return { children: [n.source] };

        case "ExportDefaultDeclaration":
            return { children: [n.declaration] };

        case "ExportNamedDeclaration":
            return {
                props: { exportKind: n.exportKind },
                children: [n.source, n.declaration],
                namedChildren: { Specifiers: n.specifiers },
            };

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
                namedChildren: { LHS: [n.left], RHS: [n.right] },
                children: [n.body],
            };
        }

        case "ForInStatement":
            return {
                namedChildren: { LHS: [n.left], RHS: [n.right] },
                children: [n.body],
            };

        case "ForStatement":
            return {
                children: [n.init, n.test, n.update, n.body],
                positional: true,
            };

        case "FunctionDeclaration": {
            const { async, generator, declare } = n;
            return {
                props: { async, generator, declare },
                children: [n.id, n.body, n.typeParameters, n.returnType],
                namedChildren: { Parameters: n.params },
            };
        }

        case "FunctionExpression": {
            const { async, generator } = n;
            return {
                props: { async, generator },
                children: [n.id, n.body, n.returnType, n.typeParameters],
                namedChildren: {
                    Parameters: n.params,
                },
            };
        }

        case "Identifier":
            return { props: { name: n.name } };

        case "IfStatement":
            /// XXX: do we need a better way to distinguish if from else?
            return { children: [n.test, n.consequent, n.alternate] };

        case "ImportDeclaration":
            // XXX: Should node.source be named?
            return {
                props: { importKind: n.importKind },
                children: [n.source],
                namedChildren: { Specifiers: n.specifiers },
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
                children: [n.openingElement, n.closingElement],
                namedChildren: { Children: n.children },
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
                children: [n.name, n.typeParameters],
                namedChildren: { Attributes: n.attributes },
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
                namedChildren: { LHS: [n.left], RHS: [n.right] },
            };

        case "MemberExpression":
            return {
                props: { optional: n.optional, computed: n.computed },
                children: [n.object, n.property],
            };

        case "NewExpression":
            return {
                props: { optional: n.optional },
                children: [n.callee, n.typeParameters, n.typeArguments /* Flow */],
            };

        case "ObjectExpression":
            return { namedChildren: { Properties: n.properties } };

        case "ObjectMethod": {
            const { kind, computed, generator, async } = n;
            return {
                props: { kind, computed, generator, async },
                children: [n.body, n.returnType, n.typeParameters],
                namedChildren: {
                    Key: [n.key], /// XXX: maybe
                    Parameters: n.params,
                    Decorators: n.decorators,
                },
            };
        }

        case "ObjectPattern":
            return {
                children: [n.typeAnnotation],
                namedChildren: { Properties: n.properties, Decorators: n.decorators },
            };

        case "ObjectProperty":
            return {
                props: { computed: n.computed, shorthand: n.shorthand },
                children: [n.key, n.value],
                namedChildren: { Decorators: n.decorators },
            };

        case "OptionalCallExpression": {
            const { optional } = n;
            return {
                props: { optional },
                children: [n.callee, n.typeArguments, n.typeParameters],
                namedChildren: { Arguments: n.arguments },
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
                children: [n.argument, n.typeAnnotation],
                namedChildren: { Decorators: n.decorators },
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
            return { namedChildren: { Expressions: n.expressions } };

        case "SpreadElement":
            return { children: [n.argument] };

        case "SwitchCase":
            return {
                children: [n.test],
                namedChildren: { Consequent: n.consequent },
            };

        case "SwitchStatement":
            return {
                children: [n.discriminant],
                namedChildren: { Cases: n.cases },
            };

        case "TaggedTemplateExpression":
            return {
                children: [n.tag, n.quasi, n.typeParameters],
                positional: true,
            };

        case "TemplateElement":
            return { props: { value: n.value.raw, cooked: n.value.cooked, tail: n.tail } };

        case "TemplateLiteral":
            return { namedChildren: { Quasis: n.quasis, Expressions: n.expressions } };

        case "ThrowStatement":
            return { children: [n.argument] };

        case "TryStatement":
            return { children: [n.block, n.handler, n.finalizer] };

        case "TSArrayType":
            return { children: [n.elementType] };

        case "TSAsExpression":
            return { children: [n.expression, n.typeAnnotation] };

        case "TSConstructorType":
            return { namedChildren: { Parameters: n.parameters }, children: [n.typeParameters, n.typeAnnotation] };
        case "TSEnumDeclaration": {
            const { const: const_, declare } = n;
            return {
                props: { const: const_, declare },
                children: [n.id],
                namedChildren: {
                    Members: n.members,
                    Initializer: [n.initializer],
                },
            };
        }

        case "TSExportAssignment":
            return { children: [n.expression] };

        case "TSExternalModuleReference":
            return { children: [n.expression] };

        case "TSFunctionType":
            return {
                children: [n.typeAnnotation, n.typeParameters],
                namedChildren: { Parameters: n.parameters },
            };

        case "TSImportEqualsDeclaration": {
            const { isExport } = n;
            return {
                props: { isExport },
                children: [n.id, n.moduleReference],
            };
        }

        case "TSImportType":
            return { children: [n.argument, n.qualifier, n.typeParameters] };

        case "TSInterfaceDeclaration":
            return {
                children: [n.id, n.body],
                namedChildren: { Extends: n.extends /*, Implements: node.implements, Mixins: node.mixins */ },
            };

        case "InterfaceDeclaration":
            return {
                children: [n.id, n.body],
                namedChildren: { Extends: n.extends, Implements: n.implements, Mixins: n.mixins },
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
            return { props: { accessibility, readonly }, children: [n.parameter] };
        }

        case "TSPropertySignature":
            return {
                props: { computed: n.computed },
                children: [n.key, n.typeAnnotation],
            };

        case "TSTupleType":
            return { children: n.elementTypes };

        case "TSTypeParameterDeclaration":
            return { namedChildren: { Parameters: n.params } };

        case "TSTypeQuery":
            return { children: [n.exprName] };

        case "TSTypeReference":
            return { children: [n.typeName, n.typeParameters] };

        case "TSCallSignatureDeclaration":
            return {
                children: [n.typeAnnotation, n.typeParameters],
                namedChildren: { Parameters: n.parameters },
            };

        case "InterfaceExtends":
            return { children: [n.id] };

        case "TSConditionalType":
            return { children: [n.checkType, n.extendsType, n.trueType, n.falseType] };

        case "TSConstructSignatureDeclaration":
            return {
                children: [n.typeParameters, n.typeAnnotation],
                namedChildren: { Parameters: n.parameters },
            };

        case "TSDeclareFunction": {
            const { async, declare, generator } = n;
            return {
                props: { async, declare, generator },
                children: [n.id, n.typeParameters, n.returnType],
                namedChildren: {
                    Parameters: n.params,
                },
            };
        }

        case "TSDeclareMethod": {
            const { abstract, access, accessibility, async, computed, generator, kind, optional, static: static_ } = n;
            return {
                props: { abstract, access, accessibility, async, computed, generator, kind, optional, static: static_ },
                namedChildren: {
                    Decorators: n.decorators,
                    Key: [n.key],
                    Parameters: n.params,
                },
                children: [n.typeParameters, n.returnType],
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
                children: [n.typeAnnotation],
                namedChildren: { Parameters: n.parameters }, /// XXX: Gah! does order matter?
            };
        }

        case "TSIndexedAccessType":
            return {
                children: [n.objectType, n.indexType],
                positional: true,
            };

        case "TSIntersectionType":
            return { children: n.types };

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
            return { namedChildren: { LHS: [n.left], RHS: [n.right] } };

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
                children: [n.id, n.typeParameters, n.typeAnnotation],
            };
        }

        case "TSTypeAssertion":
            return { children: [n.typeAnnotation, n.expression] };

        case "TSInferType":
            return { children: [n.typeParameter] };

        case "TSTypeLiteral":
            // XXX: Should this be un-nested? i.e. `{ children: n.members }`
            return { namedChildren: { Members: n.members } };

        case "TSTypeParameter": {
            const { name } = n;
            return {
                props: { name },
                children: [n.constraint, n.default],
                positional: true,
            };
        }

        case "TSTypeParameterInstantiation":
            return { namedChildren: { Parameters: n.params } };

        case "TSTypePredicate": {
            const { asserts } = n;
            return {
                props: { asserts },
                children: [n.parameterName, n.typeAnnotation],
                positional: true,
            };
        }

        case "TSUnionType":
            return { namedChildren: { Types: n.types } };

        case "UnaryExpression":
            return { props: { prefix: n.prefix, operator: n.operator }, children: [n.argument] };

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
                namedChildren: { Declarations: n.declarations },
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
