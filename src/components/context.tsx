import { createContext, ComponentChildren, createElement } from "preact";
import { AppProps } from "../types";

export const PropContext = createContext<UpdateProp<AppProps>>(null as any as UpdateProp<AppProps>);

// Wrapper to fix JSX compatibility issue with Preact Provider return type
export function PropProvider(props: { value: UpdateProp<AppProps>; children?: ComponentChildren }) {
    return createElement(PropContext.Provider, { value: props.value }, props.children);
}

type UpdateProp<P> = {
    <K extends keyof P, T extends keyof P[K]>(parent: K, name: T, value: P[K][T]): void;
}
