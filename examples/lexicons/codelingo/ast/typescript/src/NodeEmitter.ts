import { Node, identifier, blockStatement } from "@babel/types";
import { Dictionary } from "./AstNode";

type Primitive = string | number | boolean | null | undefined;

export interface EmitInstructions {
    skipEmit?: boolean;
    children?: Array<Node | null | undefined>;
    namedChildren?: Dictionary<(Node | null)[] | null | undefined>;
    props?: Dictionary<Primitive>;
}

const firstIfSame = (a: Node, b: Node): Node[] => (a.start === b.start && a.end === b.end ? [a] : [a, b]);

export const chooseHowToEmit = (n: Node): EmitInstructions | undefined => {
    // console.warn(node.type);
    switch (n.type) {
        case "ArrayExpression":
            return { namedChildren: { Elements: n.elements } };

        case "ArrowFunctionExpression":
            return { props: { async: n.async, expression: n.expression, generator: n.generator }, namedChildren: { Parameters: n.params }, children: [n.body, n.returnType, n.typeParameters] };

        case "AssignmentExpression":
            return { props: { operator: n.operator }, namedChildren: { LHS: [n.left], RHS: [n.right] } };

        case "AssignmentPattern":
            return { children: [n.typeAnnotation], namedChildren: { LHS: [n.left], RHS: [n.right], Decorators: n.decorators } };

        case "AwaitExpression":
            return { children: [n.argument] };

        case "BinaryExpression":
            return { props: { operator: n.operator }, namedChildren: { LHS: [n.left], RHS: [n.right] } };

        case "BooleanLiteral":
            return { props: { value: n.value } };

        case "BlockStatement":
            return { children: n.body };

        case "CallExpression":
            return { props: { optional: n.optional }, namedChildren: { arguments: n.arguments }, children: [n.typeArguments, n.typeParameters, n.callee] };

        case "CatchClause":
            return { children: [n.param, n.body] };

        case "ClassBody":
            return { children: n.body };

        case "ClassDeclaration":
            return {
                props: { abstract: n.abstract, declare: n.declare },
                namedChildren: {
                    Decorators: n.decorators,
                    Implements: n.implements,
                    Super: [n.superClass, n.superTypeParameters],
                },
                children: [n.body, n.typeParameters, n.mixins /* Flow */],
            };

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

        case "Identifier":
            return { props: { name: n.name } };

        case "ImportDeclaration":
            // XXX: Should node.source be named?
            return { props: { importKind: n.importKind }, children: [n.source], namedChildren: { Specifiers: n.specifiers } };

        case "ImportSpecifier": {
            // if the local name for the import is the same as the imported name
            // then only specify one identity child (the imported)
            return { children: firstIfSame(n.imported, n.local) };
        }

        case "ImportNamespaceSpecifier":
        case "ImportDefaultSpecifier":
            return { children: [n.local] };

        case "ExportAllDeclaration":
            return { children: [n.source] };

        case "ExportDefaultDeclaration":
            return { children: [n.declaration] };

        case "ExportNamedDeclaration":
            return { props: { exportKind: n.exportKind }, children: [n.source, n.declaration], namedChildren: { Specifiers: n.specifiers } };

        case "ExportSpecifier":
            // if the exported name for the import is the same as the local name
            // then only specify one identity child (the local)
            return { children: firstIfSame(n.local, n.exported) };

        case "ExpressionStatement":
            return { children: [n.expression] };

        case "FunctionDeclaration":
            return {
                props: { async: n.async, generator: n.generator, declare: n.declare },
                children: [n.id, n.body, n.typeParameters, n.returnType],
                namedChildren: { Parameters: n.params },
            };

        case "IfStatement":
            /// XXX: do we need a better way to distinguish if from else?
            return { children: [n.test, n.consequent, n.alternate] };

        case "LogicalExpression":
            return { props: { operator: n.operator }, namedChildren: { LHS: [n.left], RHS: [n.right] } };

        case "MemberExpression":
            return { props: { optional: n.optional, computed: n.computed }, children: [n.object, n.property] };

        case "NewExpression":
            return { props: { optional: n.optional }, children: [n.callee, n.typeParameters, n.typeArguments /* Flow */] };

        case "Noop":
            return {};

        case "ObjectExpression":
            return { namedChildren: { Properties: n.properties } };

        case "ObjectProperty":
            return { props: { computed: n.computed, shorthand: n.shorthand }, namedChildren: { Decorators: n.decorators }, children: [n.key, n.value] };

        case "Program":
            return { skipEmit: true, children: n.body };

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

        case "TSInterfaceDeclaration":
            return { children: [n.id, n.body], namedChildren: { Extends: n.extends /*, Implements: node.implements, Mixins: node.mixins */ } };

        case "InterfaceDeclaration":
            return { children: [n.id, n.body], namedChildren: { Extends: n.extends, Implements: n.implements, Mixins: n.mixins } };

        case "TSInterfaceBody":
            return { skipEmit: true, children: n.body };

        case "TSPropertySignature":
            return { children: [n.key, n.typeAnnotation], props: { computed: n.computed } };

        case "TSTypeAnnotation":
            return { children: [n.typeAnnotation] };

        case "TSTypeReference":
            return { children: [n.typeName, n.typeParameters] };

        case "TSCallSignatureDeclaration":
            return { children: [n.typeAnnotation, n.typeParameters], namedChildren: { Parameters: n.parameters } };

        case "InterfaceExtends":
            return { children: [n.id] };

        case "TSConstructSignatureDeclaration":
            return { children: [n.typeParameters, n.typeAnnotation], namedChildren: { Parameters: n.parameters } };

        case "TSDeclareMethod": {
            const { abstract, access, accessibility, async, computed, generator, kind, optional, static: static_ } = n;
            return {
                props: { abstract, access, accessibility, async, computed, generator, kind, optional, static: static_ },
                namedChildren: {
                    Decorators: n.decorators,
                    Key: [n.key],
                    Parameters: n.params,
                },
                children: [
                    n.typeParameters,
                    n.returnType,
                ]
            };
        }
        
        case "TSMethodSignature":
            return { props: { optional: n.optional, computed: n.computed }, children: [n.typeParameters, n.typeAnnotation] };

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
            return {};

        case "TSTypeAssertion":
            return { children: [n.typeAnnotation, n.expression] };

        case "TSTypeParameterInstantiation":
            return { namedChildren: { Parameters: n.params } };

        case "TSUnionType":
            return { namedChildren: { Types: n.types } };

        case "UnaryExpression":
            return { props: { prefix: n.prefix, operator: n.operator }, children: [n.argument] };

        case "VariableDeclaration":
            return { props: { kind: n.kind, declare: n.declare }, namedChildren: { Declarations: n.declarations } };

        case "VariableDeclarator":
            return { props: { definite: n.definite }, children: [n.id, n.init] };
        // -------------------------

        case "BinaryExpression":
        case "InterpreterDirective":
        case "Directive":
        case "DirectiveLiteral":
        case "BreakStatement":
        case "ConditionalExpression":
        case "ContinueStatement":
        case "DebuggerStatement":
        case "DoWhileStatement":
        case "EmptyStatement":
        case "File":
        case "ForInStatement":
        case "ForStatement":
        case "FunctionExpression":
        case "LabeledStatement":
        case "ObjectMethod":
        case "RestElement":
        case "SequenceExpression":
        case "ParenthesizedExpression":
        case "SwitchCase":
        case "SwitchStatement":
        case "ThisExpression":
        case "UpdateExpression":
        case "WhileStatement":
        case "WithStatement":
        case "AssignmentPattern":
        case "ArrayPattern":
        case "ClassExpression":
        case "ForOfStatement":
        case "MetaProperty":
        case "ObjectPattern":
        case "SpreadElement":
        case "Super":
        case "TaggedTemplateExpression":
        case "YieldExpression":
        case "Import":
        case "BigIntLiteral":
        case "ExportNamespaceSpecifier":
        case "OptionalMemberExpression":
        case "OptionalCallExpression":
        case "AnyTypeAnnotation":
        case "ArrayTypeAnnotation":
        case "BooleanTypeAnnotation":
        case "BooleanLiteralTypeAnnotation":
        case "NullLiteralTypeAnnotation":
        case "ClassImplements":
        case "DeclareClass":
        case "DeclareFunction":
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
        case "JSXAttribute":
        case "JSXClosingElement":
        case "JSXElement":
        case "JSXEmptyExpression":
        case "JSXExpressionContainer":
        case "JSXSpreadChild":
        case "JSXIdentifier":
        case "JSXMemberExpression":
        case "JSXNamespacedName":
        case "JSXOpeningElement":
        case "JSXSpreadAttribute":
        case "JSXText":
        case "JSXFragment":
        case "JSXOpeningFragment":
        case "JSXClosingFragment":
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
        case "Decorator":
        case "DoExpression":
        case "ExportDefaultSpecifier":
        case "PrivateName":
        case "RecordExpression":
        case "TupleExpression":
        case "DecimalLiteral":
        case "TSParameterProperty":
        case "TSDeclareFunction":
        case "TSQualifiedName":
        case "TSIndexSignature":
        case "TSFunctionType":
        case "TSConstructorType":
        case "TSTypePredicate":
        case "TSTypeQuery":
        case "TSTypeLiteral":
        case "TSTupleType":
        case "TSOptionalType":
        case "TSRestType":
        case "TSNamedTupleMember":
        case "TSIntersectionType":
        case "TSConditionalType":
        case "TSInferType":
        case "TSParenthesizedType":
        case "TSTypeOperator":
        case "TSIndexedAccessType":
        case "TSMappedType":
        case "TSLiteralType":
        case "TSExpressionWithTypeArguments":
        case "TSTypeAliasDeclaration":
        case "TSAsExpression":
        case "TSEnumDeclaration":
        case "TSEnumMember":
        case "TSModuleDeclaration":
        case "TSModuleBlock":
        case "TSImportType":
        case "TSImportEqualsDeclaration":
        case "TSExternalModuleReference":
        case "TSNonNullExpression":
        case "TSExportAssignment":
        case "TSNamespaceExportDeclaration":
        case "TSTypeParameterDeclaration":
        case "TSTypeParameter":
        default:
            console.warn(`No handler for "${n.type}"`);
            return undefined;
    }
};
