export type ReturnOf<T> = T extends (...args: any[]) => infer U ? U : never;
