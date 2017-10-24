import json
import os
import sys


def parse_project(trunk_key, project_dir):
    project_abs_path = os.path.abspath(project_dir)

    result = []
    result.append({
        "commonKind": "project",
        "key": trunk_key,
        "kind": {
            "namespace": "python",
            "kind": "project",
            "orderable": False
        },
        "parentKey": "",
        "properties": {},
        "olderSiblings": []
    })

    return json.dumps(result)


def main(argv):
    trunk_key = argv[1]
    project_dir = argv[2]

    return parse_project(trunk_key, project_dir)


if __name__ == '__main__':
    print(main(sys.argv))
