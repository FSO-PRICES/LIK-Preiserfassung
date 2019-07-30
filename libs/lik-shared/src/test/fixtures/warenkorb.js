var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
export var warenkorbBranch = function (override) {
    if (override === void 0) { override = {}; }
    return (__assign({
        _id: '3020',
        type: 'BRANCH',
        erhebungsschemaperiode: '01.04.2018',
        gliederungspositionsnummer: '3020',
        parentGliederungspositionsnummer: null,
        produktecode: null,
        gliederungspositionstyp: 4,
        tiefencode: 1,
        positionsbezeichnung: {
            de: 'sgsg, easg',
            fr: 'fasgas fasg asgs',
            it: 'gsga wgasg asdgwg',
            en: null,
        },
        periodizitaetscode: { de: 'M', fr: 'M', it: 'M', en: null },
        beispiele: null,
        info: null,
        periodizitaetMonat: 4095,
        abweichungPmUG2: -70,
        abweichungPmOG2: 99,
        negativeLimite: null,
        positiveLimite: null,
        negativeLimite_1: null,
        positiveLimite_1: null,
        negativeLimite_7: null,
        positiveLimite_7: null,
        nichtEmpfohleneBc: [],
        erhebungszeitpunkte: 0,
        productMerkmale: [],
    }, override));
};
export var warenkorbLeaf = function (override) {
    if (override === void 0) { override = {}; }
    return (__assign({
        _id: '3020/3024',
        abweichungPmOG2: 99,
        abweichungPmUG2: -70,
        anzahlPreiseProPMS: 3,
        beispiele: {
            de: 'wgasg, wga, sgas',
            en: null,
            fr: 'lain, asgasg, sgw',
            it: 'lsgasgino, asgasg, gw',
        },
        erhebungsschemaperiode: '01.04.2018',
        erhebungstyp: 'z_d',
        erhebungszeitpunkte: 0,
        gliederungspositionsnummer: '3024',
        gliederungspositionstyp: 6,
        info: null,
        negativeLimite: -10,
        negativeLimite_1: -80,
        negativeLimite_7: -80,
        nichtEmpfohleneBc: [101, 44, 0, 2, 7],
        parentGliederungspositionsnummer: '3020',
        periodizitaetMonat: 120,
        periodizitaetscode: { de: 'M', en: null, fr: 'M', it: 'M' },
        positionsbezeichnung: {
            de: 'asg asg asg asgwagws',
            en: null,
            fr: 'wagawsgasga s',
            it: 'wag asg asgasgw',
        },
        positiveLimite: 10,
        positiveLimite_1: 1000,
        positiveLimite_7: 1000,
        productMerkmale: [
            { de: 'asfasg', fr: 'wagsgsa', it: 'asgasf', en: null },
            { de: 'asgwgasg 1 (%)', fr: 'afsgas 1 (%)', it: 'agsag 1 (%)', en: null },
            { de: 'asgwgasg 2 (%)', fr: 'afsgas 2 (%)', it: 'agsag 2 (%)', en: null },
            {
                de: 'asg awga sg (gwwg, agsgs, wgw, usw.)',
                fr: 'asg asg w (gw, rrw, gs)',
                it: 'as gwagasg (agasgs, asgasg, wagsga, ecc.)',
                en: null,
            },
        ],
        produktecode: null,
        standardeinheit: { de: 'Stk', en: null, fr: 'pce', it: 'pz' },
        standardmenge: 1,
        tiefencode: 2,
        type: 'LEAF',
    }, override));
};
export var warenkorbInfo = function (override) {
    if (override === void 0) { override = {}; }
    return [
        {
            warenkorbItem: warenkorbBranch(override.branch),
            hasChildren: true,
            leafCount: 1,
        },
        {
            warenkorbItem: warenkorbLeaf(override.leaf),
            hasChildren: false,
            leafCount: 0,
        },
    ];
};
//# sourceMappingURL=warenkorb.js.map