export function createMapOf<T>(list: T[]): { [id: string]: T };
export function createMapOf<T>(list: T[], idSelector: (item: T) => string): { [id: string]: T };
export function createMapOf<T, R>(list: T[], mapTo: R): { [id: string]: R };
export function createMapOf<T, R>(
    list: T[],
    idSelector: (item: T) => string,
    valueSelector: (item: T, acc: { [id: string]: R }, id: string) => R
): { [id: string]: R };
export function createMapOf<T, R>(
    list: T[],
    selectorOrMapTo: (item: T) => string | R = null,
    valueSelector: (item: T, acc: { [id: string]: R }, id: string) => R = null
) {
    const isIdSelector = (param): param is (item: T) => string =>
        !!selectorOrMapTo && typeof selectorOrMapTo === 'function';
    const isMapTo = (param): param is R => typeof param !== 'function';
    const idSelector: (item: T) => string = isIdSelector(selectorOrMapTo) ? selectorOrMapTo : x => x as any;
    return list.reduce(
        (acc, item) => {
            const id = idSelector(item);
            acc[id] = isMapTo(selectorOrMapTo)
                ? selectorOrMapTo
                : !valueSelector
                    ? item
                    : valueSelector(item, acc as { [id: string]: R }, id);
            return acc;
        },
        {} as { [id: string]: T | R }
    );
}

export function createCountMapOf<T, R>(list: T[], idSelector: (item: T) => string): { [id: string]: number } {
    return list.reduce(
        (acc, item) => {
            const id = idSelector(item);
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        },
        {} as { [id: string]: number }
    );
}
