import { KeyManager } from "./KeyManager";
import { AstNode, makeProperty, Dictionary, Property } from "./AstNode";
import { KIND_NS, EmitterFn } from "./Parser";
import { File, Node } from "@babel/types";
import { EmitInstructions, chooseHowToEmit } from "./NodeEmitter";

type Loc = { line: number; column: number };
const makeCommonProperties = (filename: string, startNode: Node, endNode: Node = startNode): Dictionary<Property> => {
    const { start } = startNode.loc!;
    const { end } = endNode.loc!;

    return {
        filename: makeProperty("filename", filename),
        start_column: makeProperty("start_column", start.column),
        start_line: makeProperty("start_line", start.line),
        start_offset: makeProperty("start_offset", startNode.start),
        end_column: makeProperty("end_column", end.column),
        end_line: makeProperty("end_line", end.line),
        end_offset: makeProperty("end_offset", endNode.end),
    };
};

const makeProperties = (properties: Dictionary<string | number | boolean | null | undefined>): Dictionary<Property> => {
    const props: Dictionary<Property> = {};
    for (const key in properties) {
        props[key] = makeProperty(key, properties[key]);
    }
    return props;
};

export class AstNodeWalkerBabel {
    private readonly filename: string;
    private readonly keyMan: KeyManager;
    private readonly stack: AstNode[];
    private readonly emit: EmitterFn;

    constructor(filename: string, keyMan: KeyManager, emitter: EmitterFn) {
        this.filename = filename;
        this.keyMan = keyMan;
        this.stack = [];
        this.emit = emitter;
    }

    public walk(sourceFile: File, parentKey: string) {
        const emit = (node: Node, parentKey: string, { props, namedChildren, children, skipEmit }: EmitInstructions) => {
            if (!skipEmit) {
                const kind = node.type;
                const properties = props
                    ? {
                          ...makeCommonProperties(this.filename, node),
                          ...makeProperties(props),
                      }
                    : {
                          ...makeCommonProperties(this.filename, node),
                      };
                const astNode: AstNode = {
                    commonKind: kind,
                    kind: { kind, namespace: KIND_NS, orderable: true },
                    key: this.keyMan.getKey(),
                    parentKey: parentKey,
                    olderSiblings: [],
                    properties,
                };
                this.emit(astNode);

                parentKey = astNode.key;
            }

            if (namedChildren) {
                for (const name in namedChildren) {
                    const nodes: Node[] | null | undefined = namedChildren[name];
                    if (!nodes) {
                        continue;
                    }

                    if (nodes.length > 0) {
                        const containerKey = this.emitContainerNode(nodes, name, parentKey);
                        for (const node of nodes) {
                            walkRecursively(node, containerKey);
                        }
                    }
                }
            }

            if (children) {
                for (const childNode of children) {
                    if (childNode) {
                        walkRecursively(childNode, parentKey);
                    }
                }
            }
        };

        const walkRecursively = (node: Node, parentKey: string) => {
            const instructions = chooseHowToEmit(node);
            if (instructions !== undefined) {
                emit(node, parentKey, instructions);
            }
        };

        walkRecursively(sourceFile.program, parentKey);

        // sourceFile.forEachChild((node) => walkRecursively(node, parentKey));

        // var ns = node.Language == "C#" ? kindNs : node.Language;
        // var aNode = new AstNode("unknown", kind);

        // if (stack.Count == 0) {
        //     aNode.parentKey = parentKey;
        // } else {
        //     var parentNode = stack.Peek();
        //     aNode.olderSiblings = parentNode.childKeys.ToArray();
        //     parentNode.childKeys.Add(aNode.key);
        //     aNode.parentKey = parentNode.key;
        // }

        // foreach (var tok in node.ChildTokens()) {
        //     var kindStr = tok.Kind().ToString();
        //     var value = tok.Value;
        //     aNode.SetProperty(kindStr, value);
        // }

        // PrintNode(aNode);
        // stack.Push(aNode);

        // // Visit children
        // base.Visit(node);

        // if (stack.Count > 1) {
        //     stack.Pop();
        // }
    }

    private emitContainerNode(nodes: Node[], containerKind: string, parentKey: string): string {
        const first = nodes[0];
        const last = nodes[nodes.length - 1];

        const properties = {
            ...makeCommonProperties(this.filename, first, last),
            // child_count: makeProperty("child_count", nodes.length), // TODO: Is child_count automatic??
        };

        const containerNode: AstNode = {
            commonKind: containerKind,
            kind: { kind: containerKind, namespace: KIND_NS, orderable: true },
            key: this.keyMan.getKey(),
            parentKey: parentKey,
            properties,
            olderSiblings: [],
        };

        this.emit(containerNode);
        return containerNode.key;
    }
}
