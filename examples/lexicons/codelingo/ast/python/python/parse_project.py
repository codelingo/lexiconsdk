import ast
import json
import os
import sys
from pathlib import PurePath

NAMESPACE = "python"
ALLOWED_EXTENSIONS = (".py",)


class KeyManager(object):
    def __init__(self, trunk_key):
        self.trunk_key = trunk_key
        self._next_key = None

    @property
    def next_key(self):
        if self._next_key is None:
            self._next_key = 0
            return "{0}".format(self.trunk_key)
        self._next_key += 1
        return "{0}_{1}".format(self.trunk_key, self._next_key)


def stmt(visit_func):
    def wrapper(node, ast_node):
        node.common_kind = 'stmt'
        node.properties['start_offset'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['start_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        visit_func(node, ast_node)
    return wrapper


def expr(visit_func):
    def wrapper(node, ast_node):
        node.common_kind = 'expr'
        node.properties['start_offset'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'col_offset', 0))}
        node.properties['start_line'] = {'type': 'string', 'value': '{0}'.format(getattr(ast_node, 'lineno', 0))}
        visit_func(node, ast_node)
    return wrapper


class Node(ast.NodeVisitor):
    def __init__(self, key, filename, common_kind=None, kind=None, parent=None, orderable=False):
        self.key = key
        self.common_kind = common_kind
        self.kind = kind
        self.parent = parent
        self.orderable = orderable
        self.namespace = NAMESPACE
        self.properties = {'filename': {'type': 'string', 'value': filename}}
        self.siblings = []
        self.children = []

    def is_root(self):
        return self.parent is None

    def visit_Module(self, node):
        self.common_kind = 'file'
        self.kind = {'namespace': NAMESPACE, 'kind': 'file', 'orderable': True}

    # Statements
    @stmt
    def visit_FunctionDef(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_function', 'orderable': True}
        self.properties['name'] = {'type': 'string', 'value': node.name}

    @stmt
    def visit_AsyncFunctionDef(self, node):
        self.visit_FunctionDef(node)

    @stmt
    def visit_ClassDef(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_class', 'orderable': True}
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
        self.visit_Assign(node)

    @stmt
    def visit_AnnAssign(self, node):
        self.visit_AnnAssign(node)

    @stmt
    def visit_For(self, node):
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_for', 'orderable': True}
       
    @stmt
    def visit_AsyncFor(self, node):
        self.visit_For(node)

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
        self.visit_With(node)

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
        self.kind = {'namespace': NAMESPACE, 'kind': 'stmt_importfrom', 'orderable': True}

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
        pass

    @expr
    def visit_BinOp(self, node):
        pass

    @expr
    def visit_UnaryOp(self, node):
        pass

    @expr
    def visit_Lambda(self, node):
        pass

    @expr
    def visit_IfExp(self, node):
        pass

    @expr
    def visit_Dict(self, node):
        pass

    @expr
    def visit_Set(self, node):
        pass


class NodeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Node):
            return {"commonKind": obj.common_kind, "key": obj.key,
                    "kind": {"namespace": obj.namespace, "kind": obj.kind, "orderable": obj.orderable},
                    "parentKey": obj.parent.key if obj.parent else "",
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


def parse_project(trunk_key, project_dir):
    project_abs_path = os.path.abspath(project_dir)
    results = build_graph(trunk_key, project_abs_path)
    return json.dumps(results, cls=NodeEncoder)


def main(argv):
    trunk_key = argv[1]
    project_dir = argv[2]
    return parse_project(trunk_key, project_dir)


if __name__ == '__main__':
    print(main(sys.argv))
