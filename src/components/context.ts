import { createContext, ComponentChildren, h } from "preact";
import { AppProps } from "../types";

type UpdateProp<P> = {
    <K extends keyof P, T extends keyof P[K]>(parent: K, name: T, value: P[K][T]): void;
}

// Using a stub function as default to satisfy TypeScript
const defaultUpdateProp: UpdateProp<AppProps> = () => {};
export const PropContext = createContext<UpdateProp<AppProps>>(defaultUpdateProp);

// Wrapper component to avoid JSX type issues with Context.Provider
export function PropContextProvider(props: { value: UpdateProp<AppProps>, children: ComponentChildren }) {
    return h(PropContext.Provider, { value: props.value }, props.children);
}
