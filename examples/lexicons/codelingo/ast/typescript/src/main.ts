import { AstNode } from "./common/model";
import { parseProject } from "./common/project";

const emitNode = (node: AstNode) => console.log(JSON.stringify(node));

function main(args: string[]) {
    const [_, __, method, ...rest] = args;
    switch (method) {
        case "parse-project":
            const [trunkKey, baseDir, ...filepaths] = rest;
            parseProject(trunkKey, baseDir, filepaths, emitNode);
            break;
    }
}

main(process.argv);
