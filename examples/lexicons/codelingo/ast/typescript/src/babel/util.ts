import { Node } from "@babel/types";
import { Dictionary, Property } from "../common/model";

export const makeCommonPropertiesBabel = (
    filename: string,
    startNode: Node,
    endNode: Node = startNode
): Dictionary<Property> => {
    const start = startNode.loc?.start;
    const end = endNode.loc?.end;

    return {
        // filename: makeProperty("filename", filename),
        // start_column: makeProperty("start_column", start.column),
        // start_line: makeProperty("start_line", start.line),
        // start_offset: makeProperty("start_offset", startNode.start),
        // end_column: makeProperty("end_column", end.column),
        // end_line: makeProperty("end_line", end.line),
        // end_offset: makeProperty("end_offset", endNode.end),
    };
};

export const firstIfSame = (a: Node, b: Node): Node[] => (a.start === b.start && a.end === b.end ? [a] : [a, b]);
