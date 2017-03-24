export function pefSearch<T>(searchString: string, collection: T[], propertiesToSearch: ((item: T) => string)[]): T[] {
    const lowered = searchString.toLocaleLowerCase();
    const tokens = lowered.split(' ').filter(x => !x.match(/^\s*$/));
    return collection.filter(item =>
        tokens.reduce((agg, token) => {
            const s = propertiesToSearch.map(fn => fn(item)).join(' ');
            return agg && s.toLocaleLowerCase().includes(token);
        } , true));
}

export function pefContains<T>(searchString: string, item: T, propertiesToSearch: ((item: T) => string)[]): boolean {
    const lowered = searchString.toLocaleLowerCase();
    const tokens = lowered.split(' ').filter(x => !x.match(/^\s*$/));
    return tokens.reduce((agg, token) => {
        const s = propertiesToSearch.map(fn => fn(item)).join(' ');
        return agg && s.toLocaleLowerCase().includes(token);
    }, true);
}
