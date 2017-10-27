import ast
import json
import os
import re
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


class Node(ast.NodeVisitor):
    def __init__(self, key, kind=None, common_kind=None, parent_key=None, orderable=False):
        self.key = key
        self.common_kind = common_kind
        self.kind = {'namespace': NAMESPACE, 'kind': kind, 'orderable': orderable}
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


def mod(visit_func):
    def wrapper(visitor, ast_node, node):
        node.common_kind = 'mod'
        node.properties['start_column'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['start_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        node.properties['end_column'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['end_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        visit_func(visitor, ast_node, node)

    return wrapper


def stmt(visit_func):
    def wrapper(visitor, ast_node, node):
        node.common_kind = 'stmt'
        node.properties['start_column'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['start_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        node.properties['end_column'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['end_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        visit_func(visitor, ast_node, node)

    return wrapper


def expr(visit_func):
    def wrapper(visitor, ast_node, node):
        node.common_kind = 'expr'
        node.properties['start_column'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['start_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        node.properties['end_column'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['end_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        visit_func(visitor, ast_node, node)

    return wrapper


def convert(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


class NodeVisitor(ast.NodeVisitor):
    def __init__(self, parent_key, key_man, filename):
        self.parent_key = parent_key
        self.key_man = key_man
        self.filename = filename
        self.stack = []

    def visit(self, ast_node):
        method = 'visit_' + ast_node.__class__.__name__
        visitor = getattr(self, method, self.generic_visit)

        node = Node(self.key_man.next_key)
        node.kind = {'namespace': NAMESPACE, 'kind': convert(method), 'orderable': True}
        node.set_prop("filename", self.filename)

        stack_length = len(self.stack)
        if len(self.stack) > 0:
            node.parent_key = self.stack[stack_length-1].key
        else:
            node.parent_key = self.parent_key

        visitor(ast_node, node)
        print_node(node)
        self.stack.append(node)

        self.generic_visit(ast_node, node)

        if len(self.stack) != 0:
            self.stack.pop()

    def generic_visit(self, ast_node, node):
        ast.NodeVisitor.generic_visit(self, ast_node)

    # Modules
    @mod
    def visit_Module(self, ast_node, node):
        pass

    @mod
    def visit_Interactive(self, ast_node, node):
        pass

    @mod
    def visit_Expression(self, ast_node, node):
        pass

    @mod
    def visit_Suite(self, ast_node, node):
        pass

    # Statements
    @stmt
    def visit_FunctionDef(self, ast_node, node):
        node.set_prop("name", ast_node.name)
        pass

    @stmt
    def visit_AsyncFunctionDef(self, ast_node, node):
        pass

    @stmt
    def visit_ClassDef(self, ast_node, node):
        node.set_prop("name", ast_node.name)
        pass

    @stmt
    def visit_Return(self, ast_node, node):
        pass

    @stmt
    def visit_Delete(self, ast_node, node):
        pass

    @stmt
    def visit_Assign(self, ast_node, node):
        pass

    @stmt
    def visit_AugAssign(self, ast_node, node):
        pass

    @stmt
    def visit_AnnAssign(self, ast_node, node):
        pass

    @stmt
    def visit_For(self, ast_node, node):
        pass

    @stmt
    def visit_AsyncFor(self, ast_node, node):
        pass

    @stmt
    def visit_While(self, ast_node, node):
        pass

    @stmt
    def visit_If(self, ast_node, node):
        pass

    @stmt
    def visit_With(self, ast_node, node):
        pass

    @stmt
    def visit_AsyncWith(self, ast_node, node):
        pass

    @stmt
    def visit_Raise(self, ast_node, node):
        pass

    @stmt
    def visit_Try(self, ast_node, node):
        pass

    @stmt
    def visit_Assert(self, ast_node, node):
        pass

    @stmt
    def visit_Import(self, ast_node, node):
        pass

    @stmt
    def visit_ImportFrom(self, ast_node, node):
        pass

    @stmt
    def visit_Global(self, ast_node, node):
        pass

    @stmt
    def visit_Nonlocal(self, ast_node, node):
        pass

    @stmt
    def visit_Expr(self, ast_node, node):
        pass

    @stmt
    def visit_Pass(self, ast_node, node):
        pass

    @stmt
    def visit_Break(self, ast_node, node):
        pass

    @stmt
    def visit_Continue(self, ast_node, node):
        pass

    # Expressions
    @expr
    def visit_BoolOp(self, ast_node, node):
        pass

    @expr
    def visit_BinOp(self, ast_node, node):
        pass

    @expr
    def visit_UnaryOp(self, ast_node, node):
        pass

    @expr
    def visit_Lambda(self, ast_node, node):
        pass

    @expr
    def visit_IfExp(self, ast_node, node):
        pass

    @expr
    def visit_Dict(self, ast_node, node):
        pass

    @expr
    def visit_Set(self, ast_node, node):
        pass

    @expr
    def visit_ListComp(self, ast_node, node):
        pass

    @expr
    def visit_SetComp(self, ast_node, node):
        pass

    @expr
    def visit_DictComp(self, ast_node, node):
        pass

    @expr
    def visit_GeneratorExp(self, ast_node, node):
        pass

    @expr
    def visit_Await(self, ast_node, node):
        pass

    @expr
    def visit_Yield(self, ast_node, node):
        pass

    @expr
    def visit_YieldFrom(self, ast_node, node):
        pass

    @expr
    def visit_Compare(self, ast_node, node):
        pass

    @expr
    def visit_Call(self, ast_node, node):
        pass

    @expr
    def visit_Num(self, ast_node, node):
        pass

    @expr
    def visit_Str(self, ast_node, node):
        pass

    @expr
    def visit_FormattedValue(self, ast_node, node):
        pass

    @expr
    def visit_JoinedStr(self, ast_node, node):
        pass

    @expr
    def visit_Bytes(self, ast_node, node):
        pass

    @expr
    def visit_NameConstant(self, ast_node, node):
        pass

    @expr
    def visit_Ellipsis(self, ast_node, node):
        pass

    @expr
    def visit_Constant(self, ast_node, node):
        pass

    @expr
    def visit_Attribute(self, ast_node, node):
        pass

    @expr
    def visit_Subscript(self, ast_node, node):
        pass

    @expr
    def visit_Starred(self, ast_node, node):
        pass

    @expr
    def visit_Name(self, ast_node, node):
        pass

    @expr
    def visit_List(self, ast_node, node):
        pass

    @expr
    def visit_Tuple(self, ast_node, node):
        pass


class NodeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Node):
            return {"commonKind": obj.common_kind, "key": obj.key,
                    "kind": {"namespace": obj.namespace, "kind": obj.kind, "orderable": obj.orderable},
                    "parentKey": obj.parent_key,
                    "properties": obj.properties,
                    "olderSiblings": obj.siblings}


def ast_node_to_node(ast_node, parent_key, key_man, filename):
    node = Node(key_man.next_key, ast_node.__class__.__name__, parent_key=parent_key)
    node.set_prop("filename", filename)

    node.visit(ast_node)
    return node


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

        nv = NodeVisitor(file_node.key, self.key_man, rel_file_path)
        root = ast.parse(open(abs_file_path, 'r').read())
        nv.visit(root)

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
