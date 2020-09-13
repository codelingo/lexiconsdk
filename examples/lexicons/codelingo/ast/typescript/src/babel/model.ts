import { Node } from "@babel/types";
import { Dictionary } from "../common/model";

type Primitive = string | number | boolean | null | undefined;

export interface EmitInstructions {
    skipEmit?: boolean;
    children?: Array<Node | null | undefined>;
    namedChildren?: Dictionary<(Node | null)[] | null | undefined>;
    props?: Dictionary<Primitive>;
    positional?: true | undefined;
}
