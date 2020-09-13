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