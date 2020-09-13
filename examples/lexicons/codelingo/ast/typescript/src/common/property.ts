import { Dictionary, Property } from "./model";

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