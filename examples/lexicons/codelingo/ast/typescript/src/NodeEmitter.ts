import { Node, identifier } from "@babel/types";
import { Dictionary } from "./AstNode";

type Primitive = string | number | boolean | null | undefined;

export interface EmitInstructions {
    skipEmit?: boolean;
    children?: Array<Node | null | undefined>;
    namedChildren?: Dictionary<Node[] | null | undefined>;
    props?: Dictionary<Primitive>;
}

const firstIfSame = (a: Node, b: Node): Node[] => (a.start === b.start && a.end === b.end ? [a] : [a, b]);

export const chooseHowToEmit = (node: Node): EmitInstructions | undefined => {
    // console.warn(node.type);
    switch (node.type) {
        case "AssignmentExpression":
            return { props: { operator: node.operator }, namedChildren: { LHS: [node.left], RHS: [node.right] } };

        case "AssignmentPattern":
            return { children: [node.typeAnnotation], namedChildren: { LHS: [node.left], RHS: [node.right], Decorators: node.decorators } };

        case "BooleanLiteral":
            return { props: { value: node.value } };

        case "BlockStatement":
            return { children: node.body };

        case "CallExpression":
            return { props: { optional: node.optional }, namedChildren: { arguments: node.arguments }, children: [node.typeArguments, node.typeParameters, node.callee] };

        case "Identifier":
            return { props: { name: node.name } };

        case "ImportDeclaration":
            return { props: { importKind: node.importKind }, children: [node.source], namedChildren: { Specifiers: node.specifiers } };

        case "ImportSpecifier": {
            // if the local name for the import is the same as the imported name
            // then only specify one identity child (the imported)
            return { children: firstIfSame(node.imported, node.local) };
        }

        case "ImportNamespaceSpecifier":
        case "ImportDefaultSpecifier":
            return { children: [node.local] };

        case "ExportAllDeclaration":
            return { children: [node.source] };

        case "ExportDefaultDeclaration":
            return { children: [node.declaration] };

        case "ExportNamedDeclaration":
            return { props: { exportKind: node.exportKind }, children: [node.source, node.declaration], namedChildren: { Specifiers: node.specifiers } };

        case "ExportSpecifier":
            // if the exported name for the import is the same as the local name
            // then only specify one identity child (the local)
            return { children: firstIfSame(node.local, node.exported) };

        case "ExpressionStatement":
            return { children: [node.expression] };

        case "FunctionDeclaration":
            return {
                props: { async: node.async, generator: node.generator, declare: node.declare },
                children: [node.id, node.body, node.typeParameters, node.returnType],
                namedChildren: {
                    Parameters: node.params,
                },
            };
        case "IfStatement":
            /// TODO: do we need a better way to distinguish if from else?
            return { children: [node.test, node.consequent, node.alternate] };

        case "MemberExpression":
            return { props: { optional: node.optional, computed: node.computed }, children: [node.object, node.property] };

        case "Noop":
            return {};

        case "ObjectExpression":
            return { namedChildren: { Properties: node.properties } };

        case "ObjectProperty":
            return { props: { computed: node.computed, shorthand: node.shorthand }, namedChildren: { Decorators: node.decorators }, children: [node.key, node.value] };

        case "Program":
            return { skipEmit: true, children: node.body };

        case "ReturnStatement":
            return { children: [node.argument] };

        case "StringLiteral":
            return { props: { value: node.value } };

        case "TemplateElement":
            return { props: { value: node.value.raw, cooked: node.value.cooked, tail: node.tail } };

        case "TemplateLiteral":
            return { namedChildren: { Quasis: node.quasis, Expressions: node.expressions } };

        case "TSInterfaceDeclaration":
            return { children: [node.id, node.body], namedChildren: { Extends: node.extends /*, Implements: node.implements, Mixins: node.mixins */ } };

        case "InterfaceDeclaration":
            return { children: [node.id, node.body], namedChildren: { Extends: node.extends, Implements: node.implements, Mixins: node.mixins } };

        case "TSInterfaceBody":
            return { skipEmit: true, children: node.body };

        case "TSPropertySignature":
            return { children: [node.key, node.typeAnnotation], props: { computed: node.computed } };

        case "TSTypeAnnotation":
            return { children: [node.typeAnnotation] };

        case "TSTypeReference":
            return { children: [node.typeName, node.typeParameters] };

        case "TSCallSignatureDeclaration":
            return { children: [node.typeAnnotation, node.typeParameters], namedChildren: { Parameters: node.parameters } };

        case "InterfaceExtends":
            return { children: [node.id] };

            return {};

        case "TSConstructSignatureDeclaration":
            return { children: [node.typeParameters, node.typeAnnotation], namedChildren: { Parameters: node.parameters } };

        case "TSMethodSignature":
            return { props: { optional: node.optional, computed: node.computed }, children: [node.typeParameters, node.typeAnnotation] };

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

        case "VariableDeclaration":
            return { props: { kind: node.kind, declare: node.declare }, namedChildren: { Declarations: node.declarations } };

        case "VariableDeclarator":
            return { props: { definite: node.definite }, children: [node.id, node.init] };
        // -------------------------

        case "ArrayExpression":
        case "BinaryExpression":
        case "InterpreterDirective":
        case "Directive":
        case "DirectiveLiteral":
        case "BreakStatement":
        case "CatchClause":
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
        case "NumericLiteral":
        case "NullLiteral":
        case "BooleanLiteral":
        case "RegExpLiteral":
        case "LogicalExpression":
        case "NewExpression":
        case "ObjectMethod":
        case "RestElement":
        case "SequenceExpression":
        case "ParenthesizedExpression":
        case "SwitchCase":
        case "SwitchStatement":
        case "ThisExpression":
        case "ThrowStatement":
        case "TryStatement":
        case "UnaryExpression":
        case "UpdateExpression":
        case "WhileStatement":
        case "WithStatement":
        case "AssignmentPattern":
        case "ArrayPattern":
        case "ArrowFunctionExpression":
        case "ClassBody":
        case "ClassExpression":
        case "ClassDeclaration":
        case "ForOfStatement":
        case "MetaProperty":
        case "ClassMethod":
        case "ObjectPattern":
        case "SpreadElement":
        case "Super":
        case "TaggedTemplateExpression":
        case "YieldExpression":
        case "AwaitExpression":
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
        case "ClassProperty":
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
        case "TSDeclareMethod":
        case "TSQualifiedName":
        case "TSIndexSignature":
        case "TSFunctionType":
        case "TSConstructorType":
        case "TSTypePredicate":
        case "TSTypeQuery":
        case "TSTypeLiteral":
        case "TSArrayType":
        case "TSTupleType":
        case "TSOptionalType":
        case "TSRestType":
        case "TSNamedTupleMember":
        case "TSUnionType":
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
        case "TSTypeAssertion":
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
        case "TSTypeParameterInstantiation":
        case "TSTypeParameterDeclaration":
        case "TSTypeParameter":
        default:
            console.warn(`No handler for "${node.type}"`);
            return undefined;
    }
};
