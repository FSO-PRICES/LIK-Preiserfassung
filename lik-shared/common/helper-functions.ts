
const dateRegex = /(\d+)\.(\d+)\.(\d+)/;
export function parseDate(s: string) {
    const parsed = dateRegex.exec(s);
    if (!parsed) return null;
    return new Date(+parsed[3], +parsed[2] - 1, +parsed[1] - 1);
}

export function allPropertiesExeceptIdAndRev(doc) {
    const { _id, _rev, ...props } = doc;
    return props;
}
