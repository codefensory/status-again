export type Immutable<T> = {
  readonly [K in keyof T]: Immutable<T[K]>;
};

export type Values<T> = T[keyof T];

export type ToCreate<T> = Omit<
  T,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;
