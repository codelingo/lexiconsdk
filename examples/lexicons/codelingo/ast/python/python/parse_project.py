import ast
import json
import os
import sys
from pathlib import PurePath

NAMESPACE = "python"
ALLOWED_EXTENSIONS = (".py",)


class Node(object):
    def __init__(self, key, common_kind, kind, parent, orderable=False):
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


class NodeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Node):
            return {"commonKind": obj.common_kind, "key": obj.key,
                    "kind": {"namespace": obj.namespace, "kind": obj.kind, "orderable": obj.orderable},
                    "parentKey": obj.parent.key if obj.parent else "",
                    "properties": obj.properties,
                    "olderSiblings": obj.siblings}


def build_graph(trunk_key, path):
    node = Node(trunk_key, "project", "project", None)
    for roots, dirs, files in os.walk(path):
        for f in files:
            suffix = PurePath(f).suffix
            if suffix in ALLOWED_EXTENSIONS:
                abs_file = os.path.join(roots, f)
                ast_node = ast.parse(open(abs_file, 'r').read())
                print(ast_node)
    return node


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
