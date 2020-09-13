import { Node } from "@babel/types";
import { Dictionary } from "../common/model";

type Primitive = string | number | boolean | null | undefined;

export interface EmitInstructions {
    skipEmit?: boolean;
    children?: Array<Node | null | undefined>;
    namedChildren?: Dictionary<Array<Node | null> | null | undefined>;
    props?: Dictionary<Primitive>;
    positional?: true | undefined;
}

export interface ChildSpec {
    kind: string;
    nodes: Array<Node | null | undefined> | Node | null | undefined;
    keepWhenEmpty?: true;
}

export interface EmitInstructions_v2 {
    skipEmit?: boolean;
    children?: Array<Node | ChildSpec | null | undefined>;
    props?: Dictionary<Primitive>;
    positional?: true;
}
