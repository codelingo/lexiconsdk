import { Node } from "@babel/types";
import { Dictionary } from "../common/model";

type Primitive = string | number | boolean | null | undefined;

export interface EmitInstructions {
    skipEmit?: boolean;
    children?: Array<Node | Nesting | null | undefined>;
    props?: Dictionary<Primitive>;
    positional?: true;
}

export interface Nesting {
    kind: string;
    nodes: Array<Node | null | undefined> | null | undefined;
    keepWhenEmpty?: true;
}

export function isNesting(item: Node | Nesting): item is Nesting {
    return "kind" in item;
}