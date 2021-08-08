export type Writeable<T> = {-readonly [P in keyof T]: T[P]};
export type DeepWriteable<T> = {-readonly [P in keyof T]: DeepWriteable<T[P]>};
export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
