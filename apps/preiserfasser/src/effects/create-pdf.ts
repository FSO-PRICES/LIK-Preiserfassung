/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file/ngx';
import { Platform } from '@ionic/angular';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';
import { of, Subject, partition, defer, merge } from 'rxjs';
import { catchError, concat, flatMap, map, skip, take, withLatestFrom } from 'rxjs/operators';

import * as P from '../common-models';
import * as fromRoot from '../reducers';
import { Action as pdfActions } from '../actions/pdf';

import { formatDate, mengeFormatFn, PefLanguageService, preisFormatFn, priceCountId } from '@lik-shared';

@Injectable()
export class CreatePdfEffects {
    onDestroy$ = new Subject();

    constructor(
        private actions$: Actions,
        private pefLanguageService: PefLanguageService,
        private translateService: TranslateService,
        private store: Store<fromRoot.AppState>,
        private file: File,
        private platform: Platform,
    ) {}

    @Effect()
    pmsToPdf$ = this.actions$.pipe(
        ofType('CREATE_PMS_PDF'),
        flatMap(
            ({
                payload: { preismeldestelle, erhebungsmonat },
            }: {
                type: string;
                payload: { preismeldestelle: P.Models.Preismeldestelle; erhebungsmonat: string };
            }) =>
                of({ type: 'PDF_RESET_PMS' }).pipe(
                    concat(
                        defer(() => {
                            const [noPdfPossible$, preismeldungen$] = partition(
                                this.store.select(fromRoot.getPreismeldungen).pipe(
                                    skip(1),
                                    take(1),
                                ),
                                preismeldungen => preismeldungen.length === 0,
                            );
                            return merge(
                                preismeldungen$.pipe(
                                    withLatestFrom(
                                        this.store.select(fromRoot.getPriceCountStatuses),
                                        this.pefLanguageService.currentLanguage$,
                                    ),
                                    flatMap(([preismeldungen, priceCountStatuses, currentLanguage]) => {
                                        const translateFn = (key: string) => this.translateService.instant(key);
                                        const data = mapData(
                                            preismeldestelle,
                                            preismeldungen,
                                            priceCountStatuses,
                                            currentLanguage,
                                            translateFn,
                                        );
                                        return toPdf(
                                            data,
                                            this.file,
                                            preismeldestelle,
                                            this.platform,
                                            erhebungsmonat,
                                            currentLanguage,
                                            translateFn,
                                        );
                                    }),
                                    map(savedTo => ({ type: 'PDF_CREATED_PMS', payload: savedTo })),
                                ),
                                noPdfPossible$.pipe(
                                    map(
                                        () =>
                                            ({
                                                type: 'PDF_CREATION_FAILED',
                                                payload: {
                                                    error: 'No entries',
                                                    messageKey: 'label_no_preismeldung-available',
                                                },
                                            } as pdfActions),
                                    ),
                                ),
                            );
                        }),
                    ),

                    catchError(error => {
                        console.log('PDF CREATION ERROR', error);
                        return of({ type: 'PDF_CREATION_FAILED', payload: { error } } as pdfActions);
                    }),
                ),
        ),
    );
}

function parseCode(code: number) {
    const parsed = P.Models.bearbeitungscodeDescriptions[code];
    return parsed == null ? '' : parsed === '99' ? '–' : parsed;
}

function trunc(doc: jsPDF, text: string, maxLength: number, fontSize = 10) {
    const truncated = doc.splitTextToSize(text, maxLength - doc.getStringUnitWidth('…', { fontSize }) - 5, {
        fontSize,
    }) as string[];
    return truncated[0] !== text ? truncated[0].concat('…') : text;
}

function mapData(
    preismeldestelle: P.Models.Preismeldestelle,
    preismeldungen: P.PreismeldungBag[],
    priceCountStatuses: { [pmsNummer: string]: P.PriceCountStatus },
    currentLanguage: string,
    translateFn: (key: string) => string,
) {
    return preismeldungen.map(bag => [
        {
            col1: [
                translateFn('label_print_pos'),
                `${bag.warenkorbPosition.gliederungspositionsnummer}/${bag.preismeldung.laufnummer}`,
            ],
            col2: [
                translateFn('label_print_positionsbezeichnung'),
                translateProperty(bag.warenkorbPosition.positionsbezeichnung, currentLanguage),
            ],
            col5: [
                translateFn('label_print_preiszahl'),
                `${(
                    priceCountStatuses[
                        priceCountId(preismeldestelle.pmsNummer, bag.warenkorbPosition.gliederungspositionsnummer)
                    ] || ({} as any)
                ).numActivePrices || 0}/${(
                    priceCountStatuses[
                        priceCountId(preismeldestelle.pmsNummer, bag.warenkorbPosition.gliederungspositionsnummer)
                    ] || ({} as any)
                ).anzahlPreiseProPMS || 0}`,
            ],
        },
        {
            col1: [translateFn('label_print_artikelnummer'), bag.refPreismeldung.artikelnummer || '–'],
            col2: [translateFn('label_print_artikeltext'), bag.refPreismeldung.artikeltext],
            col5: [
                translateFn('label_print_stichtag'),
                `${
                    bag.refPreismeldung.erhebungsAnfangsDatum ? bag.refPreismeldung.erhebungsAnfangsDatum + ' ' : ''
                }[${bag.refPreismeldung.erhebungsZeitpunkt || '–'}]`,
            ],
        },
        {
            col1: [`${translateFn('label_print_vorperiode')} / ${translateFn('label_print_aktuell')}`, ''],
            col2: [translateFn('label_print_preis'), formatPrice(bag.refPreismeldung.preis)],
            col3: [translateFn('label_print_aktion'), bag.refPreismeldung.aktion ? 'Ja' : 'Nein'],
            col4: [
                translateFn('label_print_menge'),
                `${mengeFormatFn(bag.refPreismeldung.menge)} ${bag.warenkorbPosition.standardeinheit.de}`,
            ],
            col5: [translateFn('label_print_code'), parseCode(bag.preismeldung.bearbeitungscode)],
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
                          bag.warenkorbPosition.productMerkmale
                              .map(x => translateProperty(x, currentLanguage))
                              .join('; '),
                          bag.preismeldung.productMerkmale.join('; '),
                      ],
                  },
              ]
            : []),
        {
            col1:
                `${translateFn('label_print_preis-vor-reduktion')}: ${preisFormatFn(
                    formatPrice(bag.refPreismeldung.preisVorReduktion),
                )} / ${translateFn('label_print_menge-vor-reduktion')}: ${mengeFormatFn(
                    bag.refPreismeldung.mengeVorReduktion,
                )} ` +
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
        commentRowIndex: number;
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

function formatPrice(price: number) {
    return price.toLocaleString('de-CH', {
        minimumIntegerDigits: 1,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function createTable(doc: jsPDF, settings: TableSettings, rawData, lastPos: number, isPlaceholder: boolean = false) {
    const docA = doc as jsPDF & { autoTable: Function; autoTableText: Function; autoTableEndPosY: Function };
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
                if (data.row.index === 1 && data.column.index >= 1 && data.column.index < 4) {
                    doc.setDrawColor(settings.colors.innerBorder);
                    doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
                }
                if (data.row.index >= settings.table.commentRowIndex) {
                    doc.setDrawColor(settings.colors.innerBorder);
                    doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
                }
                if (data.row.index === 1 && data.column.index === 1) {
                    docA.autoTableText(
                        trunc(doc, cell.raw[1], cell.width * 3),
                        cell.textPos.x,
                        cell.textPos.y + settings.data.spacingY,
                        {
                            valign: 'middle',
                        },
                    );
                    doc.setFontSize(8);
                    doc.setTextColor(settings.table.placeholderTextColor);
                    docA.autoTableText(cell.raw[0], cell.textPos.x, cell.textPos.y, {
                        valign: 'top',
                    });
                    return false;
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
                } else if (data.row.index < settings.table.commentRowIndex && data.column.index === 0) {
                    doc.setFontSize(8);
                    doc.setTextColor(settings.table.placeholderTextColor);
                    docA.autoTableText(cell.raw, cell.textPos.x, cell.textPos.y + settings.data.spacingY, {
                        valign: 'middle',
                    });
                    cell.text = [''];
                }
                if (data.row.index >= rawData.length - 1 && data.column.dataKey === 'col1') {
                    const middlepoint = data.settings.margin.left + data.table.width / 2;
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
            drawRow: function(row, _opts) {
                if (row.index === rawData.length - 1) {
                    row.height = 7;
                }
            },
            createdCell: function(cell, opts) {
                if (isPlaceholder && opts.row.index > rawData.length - 2) {
                    cell.styles.fontSize = settings.table.smallFontSize;
                }
                if (isPlaceholder || opts.row.index === rawData.length - 1) {
                    cell.styles.textColor = settings.table.placeholderTextColor;
                }
                if (
                    (opts.row.index === 0 && opts.column.index >= 1 && opts.column.index < 4) ||
                    (opts.row.index === 1 && opts.column.index >= 1 && opts.column.index < 4) ||
                    opts.row.index > settings.table.commentRowIndex - 1
                ) {
                    cell.styles.lineWidth = 0;
                }
            },
        },
    );

    return docA.autoTableEndPosY();
}

async function toPdf(
    data: any,
    file: File,
    preismeldestelle: P.Models.Preismeldestelle,
    platform: Platform,
    erhebungsmonat: string,
    currentLanguage: string,
    translateFn: (key: string) => string,
) {
    const pmsNummer = preismeldestelle.pmsNummer;
    const doc = new jsPDF('p');
    const placeholderData = [
        {
            col1: [translateFn('label_print_pos'), ''],
            col2: [translateFn('label_print_positionsbezeichnung'), ''],
            col5: [translateFn('label_print_preiszahl'), ''],
        },
        {
            col1: [translateFn('label_print_artikelnummer'), ''],
            col2: [translateFn('label_print_artikeltext'), ''],
            col5: [translateFn('label_print_stichtag'), ''],
        },
        {
            col1: [`${translateFn('label_print_vorperiode')} / ${translateFn('label_print_aktuell')}`, ''],
            col2: [translateFn('label_print_preis'), ''],
            col3: [translateFn('label_print_aktion'), ''],
            col4: [translateFn('label_print_menge'), ''],
            col5: [translateFn('label_print_code'), ''],
        },
        {
            col1: [translateFn('label_print_bemerkungen'), ''],
        },
        { col1: [translateFn('label_print_produktmale'), ''] },
        { col1: translateFn('label_print_information') },
    ];
    const settings: TableSettings = {
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
            placeholderTextColor: 140,
            startAt: 14,
            marginBottom: 2,
            commentRowIndex: 3,
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

    let lastPos = null;
    for (let i = 0; i < data.length; i++) {
        lastPos = createTable(doc, settings, data[i], lastPos);
    }
    doc.addPage();
    lastPos = null;
    for (let i = 0; i < 4; i++) {
        lastPos = createTable(doc, settings, placeholderData, lastPos, true);
    }

    const pageCount = parseInt((doc as any).internal.getNumberOfPages(), 10);
    for (let i = 1; i < pageCount + 1; i += 1) {
        doc.setPage(i);
        const currentPage = parseInt(doc.internal.getCurrentPageInfo().pageNumber, 10);
        doc.setFontSize(settings.page.header.fontSize);
        doc.text(
            settings.page.margin.left,
            settings.page.margin.top,
            `${preismeldestelle.pmsNummer} ${preismeldestelle.name}`,
        );
        doc.text(
            doc.internal.pageSize.width / 2,
            settings.page.margin.top,
            formatDate(erhebungsmonat, 'MMMM YYYY', currentLanguage),
            null,
            null,
            'center',
        );
        doc.text(
            doc.internal.pageSize.width - 10,
            settings.page.margin.top,
            `${translateFn('label_print_seite')} ` + String(currentPage) + ' / ' + String(pageCount),
            null,
            null,
            'right',
        );
        doc.setDrawColor(settings.colors.tableBorder);
        doc.line(
            settings.page.margin.left,
            settings.page.header.hr,
            doc.internal.pageSize.width - settings.page.margin.right,
            settings.page.header.hr,
        );
    }

    if (platform.is('mobile')) {
        const pdfOutput = doc.output();
        const buffer = new ArrayBuffer(pdfOutput.length);
        const array = new Uint8Array(buffer);
        for (let i = 0; i < pdfOutput.length; i++) {
            array[i] = pdfOutput.charCodeAt(i);
        }

        if (file.externalRootDirectory) {
            try {
                await file.writeFile(file.externalRootDirectory, `PDF_${pmsNummer}_${+new Date()}.pdf`, buffer);
                return 'DOCUMENT_LOCATION';
            } catch (x) {
                await file.writeFile(
                    file.externalApplicationStorageDirectory,
                    `PDF_${pmsNummer}_${+new Date()}.pdf`,
                    buffer,
                );
                return 'APPLICATION_LOCATION';
            }
        }

        await file.writeFile(file.externalApplicationStorageDirectory, `PDF_${pmsNummer}_${+new Date()}.pdf`, buffer);
        return 'APPLICATION_LOCATION';
    } else {
        doc.save(`PDF_${pmsNummer}_${+new Date()}.pdf`);
        return Promise.resolve(null);
    }
}

function translateProperty(property: P.Models.PropertyTranslation, lang: string) {
    return property[lang] != null ? property[lang] : property[P.Models.Languages.Deutsch.languageCode];
}
