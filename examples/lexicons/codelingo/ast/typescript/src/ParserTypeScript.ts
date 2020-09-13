import { KeyManager } from "./KeyManager";
import ts from "typescript";
import { AstNode, EmitterFn, NAMESPACE } from "./Model";
import { makeProperty } from "./property";

export class AstNodeWalkerTypeScript {
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

    public walk(sourceFile: ts.SourceFile, parentKey: string) {
        const walkRecursively = (node: ts.Node, parentKey: string) => {
            const nodeStart = node.getStart(sourceFile);
            const nodeEnd = node.getEnd();
            const start = sourceFile.getLineAndCharacterOfPosition(nodeStart);
            const end = sourceFile.getLineAndCharacterOfPosition(nodeEnd);
            const kind = ts.SyntaxKind[node.kind];
            const astNode: AstNode = {
                commonKind: kind,
                kind: { kind, namespace: NAMESPACE, orderable: true },
                key: this.keyMan.getKey(),
                parentKey: parentKey,
                olderSiblings: [],
                properties: {
                    filename: makeProperty("filename", this.filename),
                    start_column: makeProperty("start_column", start.character),
                    start_line: makeProperty("start_line", start.line),
                    start_offset: makeProperty("start_offset", nodeStart),
                    end_column: makeProperty("end_column", end.character),
                    end_line: makeProperty("end_line", end.line),
                    end_offset: makeProperty("end_offset", nodeEnd),
                },
            };
            this.emit(astNode);
            node.forEachChild((node) => walkRecursively(node, astNode.key));
        };

        sourceFile.forEachChild((node) => walkRecursively(node, parentKey));

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
}
