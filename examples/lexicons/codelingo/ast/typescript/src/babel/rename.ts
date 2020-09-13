import { Node } from "@babel/types";

export const renameNode = (n: Node): string => {
    switch (n.type) {
        case "ArrayExpression": return "array_expr";
        case "ArrayPattern": return "array_pattern";
        case "ArrowFunctionExpression": return "arrow_func_expr";
        case "AssignmentExpression": return "assign_expr";
        case "AssignmentPattern": return "assign_pattern";
        case "AwaitExpression": return "await_expr";
        case "BigIntLiteral": return "bigint_lit";
        case "BinaryExpression": return "binary_expr";
        case "BooleanLiteral": return "bool_lit";
        case "BlockStatement": return "block";
        case "BreakStatement": return "break";
        case "ContinueStatement": return "continue";
        case "CallExpression": return "call_expr";
        case "CatchClause": return "catch";
        case "ClassBody": return "class_body";
        case "ClassDeclaration": return "class";
        case "ClassExpression": return "class_expr";
        case "ClassMethod": return "class_meth";
        case "ClassProperty": return "class_prop";
        case "ConditionalExpression": return "cond_expr";
        case "DebuggerStatement": return "debugger";
        case "EmptyStatement": return "empty";
        case "Noop": return "noop";
        case "Super": return "super";
        case "Decorator": return "decorator";
        case "DeclareFunction": return "declare_func";
        case "Directive": return "directive";
        case "DirectiveLiteral": return "directive_lit";
        case "InterpreterDirective": return "int_directive";
        case "DoExpression": return "do_expr";
        case "DoWhileStatement": return "do_while";
        case "ExportAllDeclaration": return "export_all";
        case "ExportDefaultDeclaration": return "export_def";
        case "ExportNamedDeclaration": return "export_named";
        case "ExportSpecifier": return "export_spec";
        case "ExpressionStatement": return "expression";
        case "ForOfStatement": return "for_of";
        case "ForInStatement": return "for_in";
        case "ForStatement": return "for";
        case "FunctionDeclaration": return "func";
        case "FunctionExpression": return "func_expr";
        case "Identifier": return "ident";
        case "IfStatement": return "if";
        case "Import": return "import";
        case "ImportDeclaration": return "import";
        case "ImportSpecifier": return "import_std";
        case "ImportNamespaceSpecifier": return "import_ns";
        case "ImportDefaultSpecifier": return "import_def";
        case "ParenthesizedExpression": return "paren_expr";
        case "JSXAttribute": return "jsx_attr";
        case "JSXClosingElement": return "jsx_close";
        case "JSXElement": return "jsx_elem";
        case "JSXEmptyExpression": return "jsx_empty";
        case "JSXFragment": return "jsx_frag";
        case "JSXOpeningFragment": return "jsx_open_frag";
        case "JSXClosingFragment": return "jsx_close_frag";
        case "JSXExpressionContainer": return "jsx_expr_cont";
        case "JSXSpreadChild": return "jsx_spreadee";
        case "JSXIdentifier": return "jsx_ident";
        case "JSXMemberExpression": return "jdx_member_expr";
        case "JSXNamespacedName": return "jsx_ns_name";
        case "JSXOpeningElement": return "jsx_open";
        case "JSXSpreadAttribute": return "jsx_spread";
        case "JSXText": return "jsx_text";
        case "LabeledStatement": return "label";
        case "LogicalExpression": return "logic_expr";
        case "MemberExpression": return "member_expr";
        case "NewExpression": return "new";
        case "ObjectExpression": return "obj_expr";
        case "ObjectMethod": return "obj_meth";
        case "ObjectPattern": return "obj_pattern";
        case "ObjectProperty": return "obj_prop";
        case "OptionalCallExpression": return "opt_call_expr";
        case "OptionalMemberExpression": return "opt_member_expr";
        case "Program": return "program";
        case "RestElement": return "rest";
        case "ReturnStatement": return "return";
        case "BooleanLiteral": return "bool";
        case "NumericLiteral": return "numeric";
        case "StringLiteral": return "string";
        case "NullLiteral": return "null";
        case "RegExpLiteral": return "regexp";
        case "SequenceExpression": return "seq";
        case "SpreadElement": return "spread_elem";
        case "SwitchCase": return "case";
        case "SwitchStatement": return "switch";
        case "TaggedTemplateExpression": return "tag_templ";
        case "TemplateElement": return "templ_elem";
        case "TemplateLiteral": return "templ_lit";
        case "ThrowStatement": return "throw";
        case "TryStatement": return "try";
        case "TSArrayType": return "array";
        case "TSAsExpression": return "as";
        case "TSConstructorType": return "constructor";
        case "TSEnumDeclaration": return "enum";
        case "TSExportAssignment": return "export_assign";
        case "TSExternalModuleReference": return "ext_mod_ref";
        case "TSFunctionType": return "function_type";
        case "TSImportEqualsDeclaration": return "import_eq";
        case "TSImportType": return "import_type";
        case "TSInterfaceDeclaration": return "iface";
        case "InterfaceDeclaration": return "iface";
        case "TSInterfaceBody": return "iface_body";
        case "TSLiteralType": return "lit_type";
        case "TSModuleBlock": return "mod_block";
        case "TSModuleDeclaration": return "mod";
        case "TSParameterProperty": return "param_prop";
        case "TSPropertySignature": return "prop_sig";
        case "TSTupleType": return "tuple_type";
        case "TSTypeParameterDeclaration": return "type_param";
        case "TSTypeQuery": return "type_query";
        case "TSTypeReference": return "type_ref";
        case "TSCallSignatureDeclaration": return "call_sig";
        case "TSConstructSignatureDeclaration": return "constructor_sig";
        case "InterfaceExtends": return "iface_ext";
        case "TSConditionalType": return "cond_type";
        case "TSDeclareFunction": return "decl_func";
        case "TSDeclareMethod": return "decl_meth";
        case "TSEnumMember": return "enum_memb";
        case "TSExpressionWithTypeArguments": return "exp_type_arg";
        case "TSTypeOperator": return "type_op";
        case "TSIndexSignature": return "idx_sig";
        case "TSIndexedAccessType": return "idx_access";
        case "TSIntersectionType": return "isection_type";
        case "TSMappedType": return "mapped_type";
        case "TSMethodSignature": return "method_sig";
        case "TSNamespaceExportDeclaration": return "ns_exp";
        case "TSNamedTupleMember": return "named_tuple_memb";
        case "TSNonNullExpression": return "non_null_expr";
        case "TSOptionalType": return "opt_type";
        case "TSParenthesizedType": return "paren_type";
        case "TSRestType": return "rest_type";
        case "TSTypeAnnotation": return "type";
        case "TSQualifiedName": return "qual_name";
        case "TSStringKeyword": return "string";
        case "TSAnyKeyword": return "any";
        case "TSBooleanKeyword": return "boolean";
        case "TSBigIntKeyword": return "int";
        case "TSNeverKeyword": return "never";
        case "TSNullKeyword": return "null";
        case "TSNumberKeyword": return "number";
        case "TSObjectKeyword": return "object";
        case "TSSymbolKeyword": return "symbol";
        case "TSUndefinedKeyword": return "undefined";
        case "TSUnknownKeyword": return "unknown";
        case "TSVoidKeyword": return "void";
        case "TSThisType": return "this";
        case "ThisExpression": return "this_expr";
        case "TSTypeAliasDeclaration": return "type_alias";
        case "TSTypeAssertion": return "type_assert";
        case "TSInferType": return "infer_type";
        case "TSTypeLiteral": return "type_lit";
        case "TSTypeParameter": return "type_param";
        case "TSTypeParameterInstantiation": return "type_param_init";
        case "TSTypePredicate": return "type_pred";
        case "TSUnionType": return "union_type";
        case "UnaryExpression": return "unary_expr";
        case "UpdateExpression": return "update_expr";
        case "VariableDeclaration": return "variable";
        case "VariableDeclarator": return "var";
        case "WhileStatement": return "while";
        case "WithStatement": return "with";
        case "YieldExpression": return "yield";
        case "File": return "file";
        case "MetaProperty": return "meta";
        case "ExportNamespaceSpecifier": return "export_ns_spec";

        // flow types
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
        case "EnumSymbolBody":
        case "EnumBooleanMember":
        case "EnumNumberMember":
        case "EnumStringMember":
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
        case "ExportDefaultSpecifier":
        case "PrivateName":
        case "RecordExpression":
        case "TupleExpression":
        case "DecimalLiteral":
        default:
            return n.type;
    }
};
