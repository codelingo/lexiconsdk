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

export interface Property {
    type: string;
    value: string;
}

export interface Dictionary<T> {
    [key: string]: T;
}

export function makeProperty(key: string, value: null | number | string | boolean): Property {
    if (value === null) {
        return { type: "null", value: "" };
    }

    return {
        type: typeof value,
        value: value.toString(),
    };
}
