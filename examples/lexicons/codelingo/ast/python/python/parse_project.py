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


class Node(ast.NodeVisitor):
    def __init__(self, key, common_kind=None, kind=None, parent=None, orderable=False):
        self.key = key
        self.common_kind = common_kind
        self.kind = kind
        self.parent = parent
        self.orderable = orderable
        self.namespace = NAMESPACE
        self.properties = {}
        self.siblings = []
        self.children = []

    def is_root(self):
        return self.parent is None

    def inject_filename(self, filename):
        self.properties['filename'] = {'type': 'string', 'value': filename}

    def visit_Module(self, node):
        self.inject_filename(node.filename)
        self.common_kind = 'file'
        self.kind = {'namespace': NAMESPACE, 'kind': 'file', 'orderable': True}


class NodeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Node):
            return {"commonKind": obj.common_kind, "key": obj.key,
                    "kind": {"namespace": obj.namespace, "kind": obj.kind, "orderable": obj.orderable},
                    "parentKey": obj.parent.key if obj.parent else "",
                    "properties": obj.properties,
                    "olderSiblings": obj.siblings}


def ast_node_to_node(ast_node, km=None):
    if km is None:
        km = KeyManager("0")
   
    node = Node(km.next_key)
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
                root.filename = abs_file
                parsed_root = ast_node_to_node(root, km)
                parsed_root.parent = nodes[0]
                nodes.append(parsed_root)
                for node in ast.walk(root):
                    node.filename = abs_file
                    parsed_node = ast_node_to_node(node, km)
                    parsed_node.parent = parsed_root
                    nodes.append(parsed_node)
                    for child in ast.iter_child_nodes(node):
                        child.filename = abs_file
                        parsed_child = ast_node_to_node(child, km)
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
