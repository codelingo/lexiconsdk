import ast
import json
import os
import sys
from pathlib import PurePath

NAMESPACE = "python36"
ALLOWED_EXTENSIONS = (".py",)


class KeyManager(object):
    def __init__(self, trunk_key):
        parts = trunk_key.split('_')
        if len(parts) == 2:
            self.trunk = int(parts[0])
            self.num = int(parts[1])
        elif len(parts) == 1:
            self.trunk = int(parts[0])
            self.num = 0
        else:
            raise Exception("invalid trunk key")

    @property
    def next_key(self):
        self.num += 1
        return '{0}_{1}'.format(self.trunk, self.num)


def mod(visit_func):
    def wrapper(node, ast_node):
        node.common_kind = 'mod'
        node.properties['start_column'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['start_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        visit_func(node, ast_node)

    return wrapper


def stmt(visit_func):
    def wrapper(node, ast_node):
        node.common_kind = 'stmt'
        node.properties['start_column'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['start_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        visit_func(node, ast_node)

    return wrapper


def expr(visit_func):
    def wrapper(node, ast_node):
        node.common_kind = 'expr'
        node.properties['start_column'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['start_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        visit_func(node, ast_node)

    return wrapper


class Node(ast.NodeVisitor):
    def __init__(self, key, kind, common_kind=None, parent_key=None, orderable=False):
        self.key = key
        self.common_kind = common_kind
        self.kind = kind
        self.parent_key = parent_key
        self.orderable = orderable
        self.namespace = NAMESPACE
        self.properties = {}
        self.siblings = []
        self.children = []

    def set_prop(self, key, value):
        self.properties[key] = {
            'type': value.__class__.__name__,
            'value': str(value),
        }

    def is_root(self):
        return self.parent_key is None

    # Modules
    @mod
    def visit_Module(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'mod_module', 'orderable': True}

    @mod
    def visit_Interactive(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'mod_interactive', 'orderable': True}

    @mod
    def visit_Expression(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'mod_expression', 'orderable': True}

    @mod
    def visit_Suite(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'mod_suite', 'orderable': True}

    # Statements
    @stmt
    def visit_FunctionDef(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_function_def', 'orderable': True}
        self.properties['name'] = {'type': 'string', 'value': node.name}

    @stmt
    def visit_AsyncFunctionDef(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_async_function_def', 'orderable': True}
        self.visit_FunctionDef(node)

    @stmt
    def visit_ClassDef(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_class_def', 'orderable': True}
        self.properties['name'] = {'type': 'string', 'value': node.name}

    @stmt
    def visit_Return(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_return', 'orderable': True}

    @stmt
    def visit_Delete(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_delete', 'orderable': True}

    @stmt
    def visit_Assign(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_assign', 'orderable': True}

    @stmt
    def visit_AugAssign(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_aug_assign', 'orderable': True}

    @stmt
    def visit_AnnAssign(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_ann_assign', 'orderable': True}

    @stmt
    def visit_For(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_for', 'orderable': True}

    @stmt
    def visit_AsyncFor(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_async_for', 'orderable': True}

    @stmt
    def visit_While(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_while', 'orderable': True}

    @stmt
    def visit_If(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_if', 'orderable': True}

    @stmt
    def visit_With(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_with', 'orderable': True}

    @stmt
    def visit_AsyncWith(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_async_with', 'orderable': True}

    @stmt
    def visit_Raise(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_raise', 'orderable': True}

    @stmt
    def visit_Try(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_try', 'orderable': True}

    @stmt
    def visit_Assert(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_assert', 'orderable': True}

    @stmt
    def visit_Import(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_import', 'orderable': True}

    @stmt
    def visit_ImportFrom(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_import_from', 'orderable': True}

    @stmt
    def visit_Global(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_global', 'orderable': True}

    @stmt
    def visit_Nonlocal(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_nonlocal', 'orderable': True}

    @stmt
    def visit_Expr(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_expr', 'orderable': True}

    @stmt
    def visit_Pass(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_pass', 'orderable': True}

    @stmt
    def visit_Break(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_break', 'orderable': True}

    @stmt
    def visit_Continue(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_continue', 'orderable': True}

    # Expressions
    @expr
    def visit_BoolOp(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_bool_op', 'orderable': True}

    @expr
    def visit_BinOp(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_bin_op', 'orderable': True}

    @expr
    def visit_UnaryOp(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_unary_op', 'orderable': True}

    @expr
    def visit_Lambda(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_lambda', 'orderable': True}

    @expr
    def visit_IfExp(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_if_exp', 'orderable': True}

    @expr
    def visit_Dict(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_dict', 'orderable': True}

    @expr
    def visit_Set(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_set', 'orderable': True}

    @expr
    def visit_ListComp(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_list_comp', 'orderable': True}

    @expr
    def visit_SetComp(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_set_comp', 'orderable': True}

    @expr
    def visit_DictComp(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_dict_comp', 'orderable': True}

    @expr
    def visit_GeneratorExp(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_generator_exp', 'orderable': True}

    @expr
    def visit_Await(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_await', 'orderable': True}

    @expr
    def visit_Yield(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_yield', 'orderable': True}

    @expr
    def visit_YieldFrom(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_yield_from', 'orderable': True}

    @expr
    def visit_Compare(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_compare', 'orderable': True}

    @expr
    def visit_Call(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_call', 'orderable': True}

    @expr
    def visit_Num(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_num', 'orderable': True}

    @expr
    def visit_Str(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_str', 'orderable': True}

    @expr
    def visit_FormattedValue(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_formatted_value', 'orderable': True}

    @expr
    def visit_JoinedStr(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_join_str', 'orderable': True}

    @expr
    def visit_Bytes(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_bytes', 'orderable': True}

    @expr
    def visit_NameConstant(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_name_constant', 'orderable': True}

    @expr
    def visit_Ellipsis(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_ellipsis', 'orderable': True}

    @expr
    def visit_Constant(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_constant', 'orderable': True}

    @expr
    def visit_Attribute(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_attribute', 'orderable': True}

    @expr
    def visit_Subscript(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_subscript', 'orderable': True}

    @expr
    def visit_Starred(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_starred', 'orderable': True}

    @expr
    def visit_Name(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_name', 'orderable': True}

    @expr
    def visit_List(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_list', 'orderable': True}

    @expr
    def visit_Tuple(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'expr_tuple', 'orderable': True}


class NodeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Node):
            return {"commonKind": obj.common_kind, "key": obj.key,
                    "kind": {"namespace": obj.namespace, "kind": obj.kind, "orderable": obj.orderable},
                    "parentKey": obj.parent_key,
                    "properties": obj.properties,
                    "olderSiblings": obj.siblings}


def ast_node_to_node(ast_node, km=None, filename=None):
    if km is None:
        km = KeyManager("0")
    if filename is None:
        filename = '__MISSING__'

    node = Node(km.next_key, filename)
    node.visit(ast_node)
    return node


def build_graph(trunk_key, path):
    km = KeyManager(trunk_key)
    nodes = [Node(km.next_key, "project", "project"),]
    for roots, dirs, files in os.walk(path):
        for f in files:
            print(f)
            suffix = PurePath(f).suffix
            if suffix in ALLOWED_EXTENSIONS:
                abs_file = os.path.join(roots, f)
                root = ast.parse(open(abs_file, 'r').read())
                parsed_root = ast_node_to_node(root, km, abs_file)
                parsed_root.parent = nodes[0]
                nodes.append(parsed_root)
                for node in ast.walk(root):
                    parsed_node = ast_node_to_node(node, km, abs_file)
                    parsed_node.parent = parsed_root
                    nodes.append(parsed_node)
                    for child in ast.iter_child_nodes(node):
                        parsed_child = ast_node_to_node(child, km, abs_file)
                        parsed_child.parent = parsed_node
                        nodes.append(parsed_child)
    return nodes


def print_node(node):
    print(json.dumps(node, cls=NodeEncoder))


class Parser(object):

    def __init__(self, base_dir, key_man, files):
        self.base_dir = base_dir
        self.key_man = key_man
        self.files = files
        self.parse_all = len(files) == 0

    def parse_dir(self, parent_key, dir_path):
        has_files = False
        abs_dir_path = os.path.abspath(dir_path)
        rel_dir_path = os.path.relpath(dir_path, self.base_dir)
        if rel_dir_path != '.' and not rel_dir_path.startswith('./'):
            rel_dir_path = './' + rel_dir_path

        dir_node = Node(self.key_man.next_key, 'dir', common_kind='dir', parent_key=parent_key)
        dir_node.set_prop('filename', rel_dir_path)

        for file_path in os.listdir(abs_dir_path):
            abs_file_path = os.path.join(dir_path, file_path)
            if os.path.isdir(abs_file_path):
                if self.parse_dir(dir_node.key, abs_file_path):
                    has_files = True
            if os.path.isfile(abs_file_path):
                suffix = PurePath(file_path).suffix
                if suffix in ALLOWED_EXTENSIONS:
                    if self.parse_file(dir_node.key, abs_file_path):
                        has_files = True

        if has_files:
            print_node(dir_node)

        return has_files

    def parse_file(self, parent_key, file_path):
        abs_file_path = os.path.abspath(file_path)
        rel_file_path = './' + os.path.relpath(file_path, self.base_dir)
        if not rel_file_path.startswith('./'):
            rel_file_path = './' + rel_file_path

        if not self.parse_all:
            if rel_file_path not in self.files:
                return False

        file_node = Node(self.key_man.next_key, 'file', common_kind="file", parent_key=parent_key)
        file_node.set_prop("filename", rel_file_path)
        print_node(file_node)

        # root = ast.parse(open(abs_file_path, 'r').read())
        # parsed_root = ast_node_to_node(root, km, abs_file)
        # parsed_root.parent = nodes[0]
        # nodes.append(parsed_root)
        # for node in ast.walk(root):
        #     parsed_node = ast_node_to_node(node, km, abs_file)
        #     parsed_node.parent = parsed_root
        #     nodes.append(parsed_node)
        #     for child in ast.iter_child_nodes(node):
        #         parsed_child = ast_node_to_node(child, km, abs_file)
        #         parsed_child.parent = parsed_node
        #         nodes.append(parsed_child)

        return True


def main(argv):
    trunk_key = argv[1]
    base_dir = argv[2]
    changed_files = {}
    if len(argv) > 3:
        file_args = argv[3:]
        for file in file_args:
            if not file.startswith("./"):
                file = "./" + file
            changed_files[file] = True

    key_man = KeyManager(trunk_key)
    parser = Parser(base_dir, key_man, changed_files)

    project_node = Node(trunk_key, 'project', common_kind='project')
    print_node(project_node)

    parser.parse_dir(project_node.key, base_dir)


if __name__ == '__main__':
    main(sys.argv)
