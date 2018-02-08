import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { File } from '@ionic-native/file';
import { Effect, Actions } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { Platform } from 'ionic-angular';
import { Subject, Observable } from 'rxjs';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';

import { getDatabase, getAllDocumentsForPrefixFromDb } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import * as P from '../common-models';

import { mengeFormatFn, preisFormatFn, PefLanguageService, formatDate } from 'lik-shared';
import { PropertyTranslation } from 'lik-shared/common/models';

@Injectable()
export class CreatePdfEffects {
    onDestroy$ = new Subject();

    constructor(
        private actions$: Actions,
        private pefLanguageService: PefLanguageService,
        private translateService: TranslateService,
        private store: Store<fromRoot.AppState>,
        private file: File,
        private platform: Platform
    ) {}

    @Effect()
    pmsToPdf$ = this.actions$
        .ofType('CREATE_PMS_PDF')
        .flatMap(
            ({
                payload: { preismeldestelle, erhebungsmonat },
            }: {
                type: string;
                payload: { preismeldestelle: P.Models.Preismeldestelle; erhebungsmonat: string };
            }) =>
                Observable.of({ type: 'PDF_RESET_PMS' }).concat(
                    this.store
                        .select(fromRoot.getPreismeldungen)
                        .skip(1)
                        .filter(x => x.length > 0)
                        .take(1)
                        .map(preismeldungen => ({ preismeldestelle, erhebungsmonat, preismeldungen }))
                        .withLatestFrom(
                            this.store.select(fromRoot.getPriceCountStatuses),
                            this.store.select(fromRoot.getWarenkorb),
                            this.pefLanguageService.currentLanguage$,
                            (data, priceCountStatuses, warenkorb, currentLanguage) => ({
                                ...data,
                                priceCountStatuses,
                                warenkorb,
                                currentLanguage,
                            })
                        )
                        .flatMap(
                            ({
                                preismeldungen,
                                erhebungsmonat,
                                preismeldestelle,
                                priceCountStatuses,
                                warenkorb,
                                currentLanguage,
                            }) => {
                                const translateFn = key => this.translateService.instant(key);
                                const data = mapData(
                                    preismeldungen,
                                    priceCountStatuses,
                                    warenkorb,
                                    currentLanguage,
                                    translateFn
                                );
                                return toPdf(
                                    data,
                                    this.file,
                                    preismeldestelle,
                                    this.platform,
                                    erhebungsmonat,
                                    currentLanguage,
                                    translateFn
                                );
                            }
                        )
                        .map(savedTo => ({ type: 'PDF_CREATED_PMS', payload: savedTo }))
                )
        );
}

function parseCode(code: number) {
    const parsed = P.Models.bearbeitungscodeDescriptions[code];
    return parsed == null ? '' : parsed === '99' ? '–' : parsed;
}

function mapData(
    preismeldungen: P.PreismeldungBag[],
    priceCountStatuses: { [pmsNummer: string]: P.PriceCountStatus },
    warenkorb: P.WarenkorbInfo[],
    currentLanguage: string,
    translateFn: (key: string) => string
) {
    return preismeldungen.map(bag => [
        {
            col1: [
                translateFn('label_print_pos'),
                `${bag.warenkorbPosition.gliederungspositionsnummer}/${bag.preismeldung.laufnummer}`,
            ],
            col2: [
                translateFn('label_print_positionsbezeichnung'),
                bag.warenkorbPosition.positionsbezeichnung[currentLanguage],
            ],
            col5: [
                translateFn('label_print_preiszahl'),
                `${
                    (priceCountStatuses[bag.warenkorbPosition.gliederungspositionsnummer] || ({} as any))
                        .numActivePrices
                }/${
                    (priceCountStatuses[bag.warenkorbPosition.gliederungspositionsnummer] || ({} as any))
                        .anzahlPreiseProPMS
                }`,
            ],
        },
        {
            col1: [translateFn('label_print_artikelnummer'), bag.refPreismeldung.artikelnummer || '–'],
            col2: [translateFn('label_print_artikeltext'), bag.refPreismeldung.artikeltext],
            col5: [
                translateFn('label_print_stichtag'),
                `${
                    bag.refPreismeldung.erhebungsAnfangsDatum ? bag.refPreismeldung.erhebungsAnfangsDatum + ' ' : ''
                }[${bag.preismeldung.erhebungsZeitpunkt || '–'}]`,
            ],
        },
        {
            col1: translateFn('label_print_vorperiode'),
            col2: [translateFn('label_print_preis'), preisFormatFn(bag.refPreismeldung.preis)],
            col3: [translateFn('label_print_aktion'), bag.refPreismeldung.aktion ? 'Ja' : 'Nein'],
            col4: [
                translateFn('label_print_menge'),
                `${mengeFormatFn(bag.refPreismeldung.menge)} ${bag.warenkorbPosition.standardeinheit.de}`,
            ],
            col5: [translateFn('label_print_code'), parseCode(bag.preismeldung.bearbeitungscode)],
        },
        {
            col1: translateFn('label_print_aktuell'),
            col2: '',
            col3: '',
            col4: '',
            col5: '',
        },
        {
            col1: [
                translateFn('label_print_bemerkungen'),
                !!bag.refPreismeldung ? bag.refPreismeldung.bemerkungen : null || '–',
            ],
        },
        ...(bag.warenkorbPosition.productMerkmale.length > 0
            ? [
                  {
                      col1: [
                          bag.warenkorbPosition.productMerkmale.map(x => x[currentLanguage]).join('; '),
                          bag.preismeldung.productMerkmale.join('; '),
                      ],
                  },
              ]
            : []),
        {
            col1:
                `${translateFn('label_print_preis-vor-reduktion')}: ${preisFormatFn(
                    bag.refPreismeldung.basisPreis
                )} / ${translateFn('label_print_menge-vor-reduktion')}: ${mengeFormatFn(bag.refPreismeldung.menge)} ` +
                ` / ${translateFn('label_print_anzahl-code-r')}: ${
                    bag.refPreismeldung.fehlendePreiseR.length
                } / ${translateFn('label_print_standardmenge')}: ${mengeFormatFn(bag.warenkorbPosition.standardmenge)}`,
        },
    ]);
}

interface TableSettings {
    page: {
        margin: {
            left: number;
            right: number;
            top: number;
            bottom: number;
        };
        header: {
            fontSize: number;
            hr: number;
        };
    };
    table: {
        smallFontSize: number;
        fontSize: number;
        fillColor: number;
        lightFillColor: number;
        textColor: number;
        placeholderTextColor: number;
        startAt: number;
        marginBottom: number;
        border: {
            inner: number;
            outer: number;
        };
        padding: {
            bottom: number;
        };
    };
    colors: {
        black: number;
        white: number;
        innerBorder: number;
        tableBorder: number;
    };
    data: {
        spacingY: number;
    };
}

function createTable(doc: jsPDF, settings: TableSettings, rawData, lastPos: number, isPlaceholder: boolean = false) {
    var docA = doc as any;
    docA.autoTable(
        [
            { title: '', dataKey: 'col1' },
            { title: '', dataKey: 'col2' },
            { title: '', dataKey: 'col3' },
            { title: '', dataKey: 'col4' },
            { title: '', dataKey: 'col5' },
        ],
        rawData,
        {
            startY: lastPos == null ? settings.table.startAt : lastPos + settings.table.marginBottom,
            pageBreak: 'avoid',
            theme: 'plain',
            tableLineColor: settings.colors.black,
            tableLineWidth: settings.table.border.outer,
            tableWidth: doc.internal.pageSize.width - settings.page.margin.left - settings.page.margin.right,
            margin: {
                top: settings.table.startAt,
                right: settings.page.margin.right,
                bottom: settings.table.marginBottom,
                left: settings.page.margin.left,
            },
            styles: {
                cellPadding: { bottom: settings.table.padding.bottom },
                fontSize: settings.table.fontSize,
                lineColor: settings.colors.innerBorder,
                lineWidth: settings.table.border.inner,
            },
            columnStyles: {
                col1: { columnWidth: 38 },
                col2: { columnWidth: 38 },
                col3: { columnWidth: 38 },
                col4: { columnWidth: 38 },
                col5: { columnWidth: 38 },
            },
            showHeader: 'never',
            drawCell: function(cell, data) {
                doc.setLineWidth(settings.table.border.inner);
                if (data.row.index == 1 && data.column.index >= 1 && data.column.index < 4) {
                    doc.setDrawColor(settings.colors.innerBorder);
                    doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
                }
                if (data.row.index >= 4) {
                    doc.setDrawColor(settings.colors.innerBorder);
                    doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
                }
                if (Array.isArray(cell.raw)) {
                    docA.autoTableText(cell.raw[1], cell.textPos.x, cell.textPos.y + settings.data.spacingY, {
                        valign: 'middle',
                    });
                    doc.setFontSize(settings.table.smallFontSize);
                    doc.setTextColor(settings.table.placeholderTextColor);
                    docA.autoTableText(cell.raw[0], cell.textPos.x, cell.textPos.y, {
                        valign: 'top',
                    });
                    cell.text = [''];
                } else if (data.row.index < 4 && data.column.index == 0) {
                    doc.setFontSize(8);
                    doc.setTextColor(settings.table.placeholderTextColor);
                    docA.autoTableText(cell.raw, cell.textPos.x, cell.textPos.y + settings.data.spacingY, {
                        valign: 'middle',
                    });
                    cell.text = [''];
                }
                if (data.row.index >= rawData.length - 1 && data.column.dataKey === 'col1') {
                    var middlepoint = data.settings.margin.left + data.table.width / 2;
                    if (isPlaceholder) {
                        doc.setTextColor(settings.table.placeholderTextColor);
                    }
                    docA.autoTableText(cell.raw, middlepoint, cell.textPos.y, {
                        halign: 'center',
                        valign: 'center',
                    });
                    return false;
                }
            },
            drawRow: function(row, opts) {
                if (row.index == rawData.length - 1) {
                    row.height = 7;
                }
            },
            createdCell: function(cell, opts) {
                if (isPlaceholder && opts.row.index > rawData.length - 2) {
                    cell.styles.fontSize = settings.table.smallFontSize;
                }
                if (isPlaceholder || opts.row.index == rawData.length - 1) {
                    cell.styles.textColor = settings.table.placeholderTextColor;
                }
                if (
                    (opts.row.index == 0 && opts.column.index >= 1 && opts.column.index < 4) ||
                    (opts.row.index == 1 && opts.column.index >= 1 && opts.column.index < 4) ||
                    opts.row.index > 3
                ) {
                    cell.styles.lineWidth = 0;
                }
            },
        }
    );

    return docA.autoTableEndPosY();
}

function toPdf(
    data,
    file: File,
    preismeldestelle: P.Models.Preismeldestelle,
    platform: Platform,
    erhebungsmonat: string,
    currentLanguage: string,
    translateFn: (key: string) => string
) {
    const pmsNummer = preismeldestelle.pmsNummer;
    const doc = new jsPDF('p');
    const placeholderData = [
        {
            col1: [translateFn('label_print_pos'), ''],
            col2: [translateFn('label_print_positionsbezeichnung'), ''],
            col5: [translateFn('label_print_pm-id'), ''],
        },
        {
            col1: [translateFn('label_print_artikelnummer'), ''],
            col2: [translateFn('label_print_artikeltext'), ''],
            col5: [translateFn('label_print_stichtag'), ''],
        },
        {
            col1: translateFn('label_print_vorperiode'),
            col2: [translateFn('label_print_preis'), ''],
            col3: [translateFn('label_print_aktion'), ''],
            col4: [translateFn('label_print_menge'), ''],
            col5: [translateFn('label_print_code'), ''],
        },
        {
            col1: translateFn('label_print_aktuell'),
            col2: '',
            col3: '',
            col4: '',
            col5: '',
        },
        {
            col1: [translateFn('label_print_bemerkungen'), ''],
        },
        { col1: [translateFn('label_print_produktmale'), ''] },
        { col1: translateFn('label_print_information') },
    ];
    var settings: TableSettings = {
        page: {
            margin: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
            },
            header: {
                fontSize: 10,
                hr: 12,
            },
        },
        table: {
            smallFontSize: 8,
            fontSize: 10,
            fillColor: 200,
            lightFillColor: 100,
            textColor: 0,
            placeholderTextColor: 200,
            startAt: 14,
            marginBottom: 2,
            padding: {
                bottom: 5,
            },
            border: {
                inner: 0.02,
                outer: 0.1,
            },
        },
        colors: {
            black: 0,
            white: 255,
            innerBorder: 220,
            tableBorder: 0,
        },
        data: {
            spacingY: 6,
        },
    };

    var lastPos = null;
    for (let i = 0; i < data.length; i++) {
        var rawData = data[i];
        lastPos = createTable(doc, settings, data[i], lastPos);
    }
    doc.addPage();
    lastPos = null;
    for (let i = 0; i < 3; i++) {
        lastPos = createTable(doc, settings, placeholderData, lastPos, true);
    }

    var pageCount = parseInt((doc as any).internal.getNumberOfPages(), 10);
    for (let i = 1; i < pageCount + 1; i += 1) {
        doc.setPage(i);
        const currentPage = parseInt(doc.internal.getCurrentPageInfo().pageNumber, 10);
        doc.setFontSize(settings.page.header.fontSize);
        doc.text(
            settings.page.margin.left,
            settings.page.margin.top,
            `${preismeldestelle.pmsNummer} ${preismeldestelle.name}`
        );
        doc.text(
            doc.internal.pageSize.width / 2,
            settings.page.margin.top,
            formatDate(erhebungsmonat, 'MMMM YYYY', currentLanguage),
            null,
            null,
            'center'
        );
        doc.text(
            doc.internal.pageSize.width - 10,
            settings.page.margin.top,
            `${translateFn('label_print_seite')} ` + String(currentPage) + ' / ' + String(pageCount),
            null,
            null,
            'right'
        );
        doc.setDrawColor(settings.colors.tableBorder);
        doc.line(
            settings.page.margin.left,
            settings.page.header.hr,
            doc.internal.pageSize.width - settings.page.margin.right,
            settings.page.header.hr
        );
    }

    if (platform.is('mobile')) {
        let pdfOutput = doc.output();
        let buffer = new ArrayBuffer(pdfOutput.length);
        let array = new Uint8Array(buffer);
        for (var i = 0; i < pdfOutput.length; i++) {
            array[i] = pdfOutput.charCodeAt(i);
        }

        if (file.externalRootDirectory)
            return file
                .writeFile(file.externalRootDirectory, `PDF_${pmsNummer}_${+new Date()}.pdf`, buffer)
                .then(() => 'DOCUMENT_LOCATION')
                .catch(x =>
                    file
                        .writeFile(
                            file.externalApplicationStorageDirectory,
                            `PDF_${pmsNummer}_${+new Date()}.pdf`,
                            buffer
                        )
                        .then(() => 'APPLICATION_LOCATION')
                );

        return file
            .writeFile(file.externalApplicationStorageDirectory, `PDF_${pmsNummer}_${+new Date()}.pdf`, buffer)
            .then(() => 'APPLICATION_LOCATION');
    } else {
        doc.save(`PDF_${pmsNummer}_${+new Date()}.pdf`);
        return Promise.resolve(null);
    }
}
