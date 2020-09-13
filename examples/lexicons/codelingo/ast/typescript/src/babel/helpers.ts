

import { SourceLocation } from "@babel/types";
import { Dictionary, Property } from "../common/model";

interface BabelLikeNode {
    loc: SourceLocation | null;
    start: number | null;
    end: number | null;
}

export const makeCommonPropertiesBabel = (filename: string, startNode: BabelLikeNode, endNode: BabelLikeNode = startNode): Dictionary<Property> => {
    const { start } = startNode.loc!;
    const { end } = endNode.loc!;

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
