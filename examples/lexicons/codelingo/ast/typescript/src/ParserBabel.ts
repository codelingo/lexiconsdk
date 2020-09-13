import * as babelParser from "@babel/parser";
import { File, Node } from "@babel/types";
import path from "path";
import { KeyManager } from "./KeyManager";
import { AstNode, Dictionary, EmitterFn, NAMESPACE } from "./model";
import { EmitInstructions, shapeNodeForEmit } from "./NodeShaper";
import { makeCommonPropertiesBabel, makeProperties } from "./property";

const COMMON_PLUGINS: babelParser.ParserPlugin[] = [
    "decorators-legacy", // XXX: "decorators" plugin requires a "decoratorsBeforeExport" option -- which we don't know in advance
    "classProperties",
];

const EXT_PLUGINS: Dictionary<babelParser.ParserPlugin[]> = {
    ".js": [...COMMON_PLUGINS],
    ".jsx": ["jsx", ...COMMON_PLUGINS],
    ".ts": ["typescript", ...COMMON_PLUGINS],
    ".tsx": ["typescript", "jsx", ...COMMON_PLUGINS],
};

export function parseBabel(relativeFilePath: string, code: string, parentKey: string, keyMan: KeyManager, emitter: EmitterFn) {
    const ext = path.extname(relativeFilePath);

    let sourceFile: File;
    try {
        sourceFile = babelParser.parse(code, {
            sourceType: "unambiguous",
            plugins: EXT_PLUGINS[ext],
            // be _very_ permissive
            allowUndeclaredExports: true,
            allowAwaitOutsideFunction: true,
            allowImportExportEverywhere: true,
            allowReturnOutsideFunction: true,
            allowSuperOutsideMethod: true,
            strictMode: false,
        });
    } catch (e) {
        console.error(`Error parsing "${relativeFilePath}": ${e.message}`);
        return;
    }

    try {
        const nodeWalker = new ParserBabel(relativeFilePath, keyMan, emitter);
        nodeWalker.walk(sourceFile, parentKey);
    } catch (e) {
        console.error(`Error walking "${relativeFilePath}": ${e.message}`);
    }
}

export class ParserBabel {
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
        const emit = (node: Node, parentKey: string, { props, namedChildren, children, skipEmit, positional }: EmitInstructions) => {
            if (!skipEmit) {
                const kind = node.type;
                const properties = props ? { ...makeCommonPropertiesBabel(this.filename, node), ...makeProperties(props) } : { ...makeCommonPropertiesBabel(this.filename, node) };
                const astNode: AstNode = {
                    commonKind: kind,
                    kind: { kind, namespace: NAMESPACE, orderable: positional === true },
                    key: this.keyMan.getKey(),
                    parentKey: parentKey,
                    olderSiblings: [],
                    properties,
                };
                this.emit(astNode);

                parentKey = astNode.key;
            }

            if (children) {
                for (const childNode of children) {
                    if (childNode) {
                        walkRecursively(childNode, parentKey);
                    }
                }
            }

            if (namedChildren) {
                for (const name in namedChildren) {
                    const nodes: (Node | null)[] | null | undefined = namedChildren[name];
                    if (!nodes) {
                        continue;
                    }

                    const actualNodes: Node[] = nodes.filter((n) => !!n) as Node[];

                    if (actualNodes.length > 0) {
                        const containerKey = this.emitContainerNode(actualNodes, name, parentKey);
                        for (const node of actualNodes) {
                            walkRecursively(node, containerKey);
                        }
                    }
                }
            }
        };

        const walkRecursively = (node: Node, parentKey: string) => {
            const instructions = shapeNodeForEmit(node);
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
            ...makeCommonPropertiesBabel(this.filename, first, last),
            // child_count: makeProperty("child_count", nodes.length), // TODO: Is child_count automatic??
        };

        const containerNode: AstNode = {
            commonKind: containerKind,
            kind: { kind: containerKind, namespace: NAMESPACE, orderable: true }, // always positional
            key: this.keyMan.getKey(),
            parentKey: parentKey,
            properties,
            olderSiblings: [],
        };

        this.emit(containerNode);
        return containerNode.key;
    }
}
