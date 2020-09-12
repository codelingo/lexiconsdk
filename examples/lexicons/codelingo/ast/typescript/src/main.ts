import { AstNode } from "./AstNode";
import { parseProject } from "./Parser";

const printNode = (node: AstNode) => {}; //console.log(JSON.stringify(node));

function main(args: string[]) {
    const [_, __, method, ...rest] = args;
    switch (method) {
        case "parse-project":
            const [trunkKey, baseDir, ...filepaths] = rest;
            parseProject(trunkKey, baseDir, filepaths, printNode);
            break;
    }
}

main(process.argv);
