export function filterValues(searchString: string, values: string[]) {
    if (!searchString) return true;
    const tokens = searchString.toLocaleLowerCase().split(/\s+/);
    const text = values.join(' ').toLocaleLowerCase();
    return tokens.reduce((agg, t) => agg && text.includes(t), true);
}
