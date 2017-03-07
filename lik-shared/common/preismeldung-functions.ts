type PreismeldungSortShape = { sortierungsnummer: number, epNummer: string, laufnummer: string };

export function preismeldungCompareFn(a: PreismeldungSortShape, b: PreismeldungSortShape) {
    if (a.sortierungsnummer == null) return 1;
    if (b.sortierungsnummer == null) return -1;
    return a.sortierungsnummer - b.sortierungsnummer || parseInt(a.epNummer) - parseInt(b.epNummer) || parseInt(a.laufnummer) - parseInt(b.laufnummer);
}
