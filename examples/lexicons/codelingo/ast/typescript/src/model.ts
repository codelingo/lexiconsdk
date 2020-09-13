import { SourceLocation } from "@babel/types";

export const NAMESPACE = "ts";

export type Loc = { line: number; column: number };
export type EmitterFn = (node: AstNode) => void;

export interface AstNode {
    commonKind: string;
    kind: Kind;
    key: string;
    olderSiblings: string[];
    parentKey: string;
    properties: Dictionary<Property>;
}

export interface Kind {
    kind: string;
    namespace: string;
    orderable: boolean;
}

export interface Dictionary<T> {
    [key: string]: T;
}

export interface Property {
    type: string;
    value: string;
}

export interface BabelLikeNode {
    loc: SourceLocation | null;
    start: number | null;
    end: number | null;
}

export function makeProperty(key: string, value: null | undefined | number | string | boolean): Property {
    if (value === null || value === undefined) {
        return { type: "null", value: "" };
    }

    return {
        type: typeof value,
        value: value.toString(),
    };
}

export const makeProperties = (properties: Dictionary<string | number | boolean | null | undefined>): Dictionary<Property> => {
    const props: Dictionary<Property> = {};
    for (const key in properties) {
        props[key] = makeProperty(key, properties[key]);
    }
    return props;
};

export const makeCommonPropertiesBabel = (filename: string, startNode: BabelLikeNode, endNode: BabelLikeNode = startNode): Dictionary<Property> => {
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
