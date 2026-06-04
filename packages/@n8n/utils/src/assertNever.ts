/**
 * Asserts that the passed-in type is `never`.
 *
 * Use this at the end of exhaustive `switch` / `if-else` chains so the
 * compiler errors when a new variant is added but not handled.
 */
export const assertNever = (_value: never): void => {};
