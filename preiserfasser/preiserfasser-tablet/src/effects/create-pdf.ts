import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { File } from '@ionic-native/file';
import { Effect, Actions } from "@ngrx/effects";
import { Platform } from 'ionic-angular';
import { Subject, Observable } from 'rxjs';
import * as jsPDF from 'jspdf';
import 'jspdf-autotable';

import { getDatabase, getAllDocumentsForPrefixFromDb } from "./pouchdb-utils";
import * as fromRoot from '../reducers';
import * as P from "../common-models";

import { mengeFormatFn, preisFormatFn, PefLanguageService, formatDate } from 'lik-shared';

@Injectable()
export class CreatePdfEffects {
    onDestroy$ = new Subject();

    constructor(private actions$: Actions, private pefLanguageService: PefLanguageService, private store: Store<fromRoot.AppState>, private file: File, private platform: Platform) {
    }

    @Effect()
    pmsToPdf$ = this.actions$
        .ofType('CREATE_PMS_PDF')
        .flatMap(({ payload: { preismeldestelle, erhebungsmonat } }) =>
            Observable.of({ type: 'PDF_RESET_PMS' }).concat(
                this.store.select(fromRoot.getPreismeldungen).skip(1).filter(x => x.length > 0).take(1).map(preismeldungen => ({ preismeldestelle, erhebungsmonat, preismeldungen }))
                    .withLatestFrom(this.store.select(fromRoot.getPriceCountStatuses), this.pefLanguageService.currentLanguage$, (data, priceCountStatuses, currentLanguage) => ({ ...data, priceCountStatuses, currentLanguage }))
                    .flatMap(({ preismeldungen, erhebungsmonat, preismeldestelle, priceCountStatuses, currentLanguage }) => toPdf(mapData({ preismeldungen, priceCountStatuses }), this.file, preismeldestelle, this.platform, erhebungsmonat, currentLanguage))
                    .map(savedTo => ({ type: 'PDF_CREATED_PMS', payload: savedTo }))
            )
        );
}

const placeholderData = [
    {
        "col1": "Pos.:",
        "col2": "Bezeichnung",
        "col9": "",
        "col10": "ST"
    },
    {
        "col1": "Preis-ID: Neu*",
        "col2": "Artikeltext",
        "col9": "Artikelnummer"
    },
    {
        "col1": ["Preis", ""],
        "col2": ["Menge/Einheit", ""],
        "col3": ["Aktion", ""],
        "col4": ["Ausverkauf", ""],
        "col5": "",
        "col6": ["Preis", ""],
        "col7": ["Menge", ""],
        "col8": ["Aktion", ""],
        "col9": ["Ausverkauf", ""],
        "col10": ["Code", ""]
    },
    { "col1": "Meldung an das BFS" },
    { "col1": "Produkteigenschaft 1" },
    { "col1": "Produkteigenschaft 2" },
    { "col1": "Produkteigenschaft 3" },
    { "col1": "Produkteigenschaft 4" },
    { "col1": "Produkteigenschaft 5" },
    { "col1": "Information" }
];

function mapData(data: { preismeldungen: P.PreismeldungBag[], priceCountStatuses: { [pmsNummer: string]: P.PriceCountStatus } }) {
    return data.preismeldungen.map(bag => [
        {
            col1: `Pos.: ${bag.warenkorbPosition.gliederungspositionsnummer}`,
            col2: bag.warenkorbPosition.positionsbezeichnung.de,
            col9: `${(data.priceCountStatuses[bag.warenkorbPosition.gliederungspositionsnummer] || {} as any).numActivePrices}/${(data.priceCountStatuses[bag.warenkorbPosition.gliederungspositionsnummer] || {} as any).anzahlPreiseProPMS}`,
            col10: '–',
        },
        {
            col1: `PM-ID: ${bag.preismeldung.pmsNummer}`,
            col2: bag.refPreismeldung.artikeltext,
            col9: bag.preismeldung.artikelnummer || '–',
        },
        {
            col1: ['Preis', preisFormatFn(bag.refPreismeldung.preis)],
            col2: ['Menge/Einheit', `${mengeFormatFn(bag.refPreismeldung.menge)} ${bag.warenkorbPosition.standardeinheit.de}`],
            col3: ['Aktion', bag.refPreismeldung.aktion ? 'Ja' : 'Nein'],
            col4: ['Ausverkauf', '–'],
            col5: '',
            col6: ['Preis', ''],
            col7: ['Menge', ''],
            col8: ['Aktion', ''],
            col9: ['Ausverkauf', ''],
            col10: ['Code', ''],
        },
        ...(
            bag.warenkorbPosition.productMerkmale.length > 0 ?
                [
                    { col1: '-' },
                    ...bag.warenkorbPosition.productMerkmale.map((x, index) => ({
                        col1: [x.de, bag.preismeldung.productMerkmale[index]]
                    }))
                ]
                : []
        ),
        {
            col1: `Preis vor Reduktion: ${preisFormatFn(bag.refPreismeldung.basisPreis)} / Menge vor Reduktion: ${mengeFormatFn(bag.refPreismeldung.menge)} ` +
            ` / Anzahl Code R: ${bag.refPreismeldung.fehlendePreiseR.length} / Standardmenge: ${mengeFormatFn(bag.warenkorbPosition.standardmenge)}`,
        }
    ]);
}

interface TableSettings {
    page: {
        margin: {
            left: number;
            right: number;
            top: number;
            bottom: number
        };
        header: {
            fontSize: number;
            hr: number
        }
    };
    table: {
        fontSize: number;
        fillColor: number;
        lightFillColor: number;
        textColor: number;
        placeholderTextColor: number;
        startAt: number;
        marginBottom: number;
        border: {
            inner: number;
            outer: number
        };
    };
    colors: {
        black: number;
        white: number;
        innerBorder: number;
        tableBorder: number
    };
    data: {
        spacingY: number
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
            { title: '', dataKey: 'col6' },
            { title: '', dataKey: 'col7' },
            { title: '', dataKey: 'col8' },
            { title: '', dataKey: 'col9' },
            { title: '', dataKey: 'col10' }
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
                left: settings.page.margin.left
            },
            styles: {
                fontSize: settings.table.fontSize,
                lineColor: settings.colors.innerBorder,
                lineWidth: settings.table.border.inner,
            },
            columnStyles: {
                'col1': { columnWidth: 23 },
                'col2': { columnWidth: 23 },
                'col3': { columnWidth: 23 },
                'col4': { columnWidth: 23 },
                'col5': { columnWidth: 5.4 },
                'col6': { columnWidth: 18.5 },
                'col7': { columnWidth: 18.5 },
                'col8': { columnWidth: 18.5 },
                'col9': { columnWidth: 18.5 },
                'col10': { columnWidth: 18.5 },
            },
            showHeader: 'never',
            drawCell: function (cell, data) {
                doc.setLineWidth(settings.table.border.inner);
                if (data.row.index >= 2 && data.row.index < rawData.length - 1) {
                    if (data.column.index == 4 && data.row.index < rawData.length - 1) {
                        doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
                        doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
                    }
                    else {
                        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
                    }
                }
                if (data.column.index != 4 || data.row.index == rawData.length - 2 || data.row.index < 2) {
                    doc.setDrawColor(settings.colors.innerBorder);
                    doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
                }
                if (data.row.index == 1 && data.column.index >= 1 && data.column.index <= 7) {
                    doc.setDrawColor(settings.colors.innerBorder);
                    doc.line(cell.x, cell.y, cell.x + cell.width, cell.y);
                }
                if (data.row.index == 0 && data.column.index >= 1 && data.column.index < 8) {
                    if (data.column.index == 1) {
                        if (isPlaceholder) {
                            doc.setTextColor(settings.table.placeholderTextColor);
                        }
                        docA.autoTableText(cell.raw, cell.textPos.x, cell.textPos.y, {
                            valign: 'center'
                        });
                        return false;
                    }
                    cell.styles.fillColor = false;
                }
                if (Array.isArray(cell.raw) && data.row.index < 3) {
                    docA.autoTableText(cell.raw[1], cell.x + cell.width / 2, cell.textPos.y + settings.data.spacingY, {
                        halign: 'center',
                        valign: 'middle'
                    });
                    doc.setFontSize(6);
                    doc.setFontStyle('bold');
                    docA.autoTableText(cell.raw[0], cell.textPos.x - 1, cell.textPos.y - 1, {
                        valign: 'top'
                    });
                    doc.setDrawColor(settings.colors.innerBorder);
                    doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
                    return false;
                }
                if (data.row.index == 1 && data.column.index >= 1 && data.column.index < 8) {
                    if (data.column.index == 1) {
                        if (isPlaceholder) {
                            doc.setTextColor(settings.table.placeholderTextColor);
                        }
                        docA.autoTableText(cell.raw, cell.textPos.x, cell.textPos.y, {
                            valign: 'center'
                        });
                    }
                    return false;
                }
                if (data.row.index == 1) {
                    if (data.column.index == 8) {
                        if (isPlaceholder) {
                            doc.setTextColor(settings.table.placeholderTextColor);
                        }
                        docA.autoTableText(cell.raw, cell.x + cell.width, cell.textPos.y, {
                            halign: 'center'
                        });
                        doc.setDrawColor(settings.colors.innerBorder);
                        doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
                        return false;
                    }
                    if (data.column.index > 8) {
                        return false;
                    }
                }
                if (data.row.index >= rawData.length - 1 && data.column.dataKey === 'col1') {
                    var middlepoint = data.settings.margin.left + data.table.width / 2;
                    if (isPlaceholder) {
                        doc.setTextColor(settings.table.placeholderTextColor);
                    }
                    docA.autoTableText(cell.raw, middlepoint, cell.textPos.y, {
                        halign: 'center',
                        valign: 'center'
                    });
                    return false;
                }
                if (data.column.index == 0 && data.row.index > 2) {
                    if (isPlaceholder) {
                        doc.setTextColor(settings.table.placeholderTextColor);
                    }
                    if (!Array.isArray(cell.raw)) {
                        docA.autoTableText(cell.raw, cell.textPos.x, cell.textPos.y, {
                            valign: 'center'
                        });
                    }
                    else {
                        var typeText = cell.raw[0] + ': ';
                        docA.autoTableText(cell.raw[1], cell.textPos.x + (doc.getStringUnitWidth(typeText) * 8 * 1.1) / (72 / 25.6), cell.textPos.y, {
                            valign: 'center'
                        });
                        //doc.setFontSize(6);
                        doc.setFontStyle('bold');
                        docA.autoTableText(typeText, cell.textPos.x, cell.textPos.y, {
                            valign: 'center'
                        });
                    }
                    cell.styles.fillColor = false;
                    cell.text = [''];
                    return false;
                }
                if (data.row.index >= 3 && data.column.index > 0) {
                    return false;
                }
            },
            createdCell: (cell, opts) => {
                if (isPlaceholder && opts.row.index == 0 && opts.column.index == 9) {
                    cell.styles.textColor = settings.table.placeholderTextColor;
                }
                if (opts.row.index == 0 || opts.row.index == 1 && opts.column.index != 1) {
                    cell.styles.fontStyle = 'bold';
                }
                if (opts.row.index == 0 && opts.column.index >= 1 && opts.column.index < 8 ||
                    opts.row.index == 1 && opts.column.index >= 1 && opts.column.index < 8 ||
                    opts.row.index == 1 && opts.column.index >= 8 ||
                    opts.row.index >= 3 ||
                    opts.column.index == 4) {
                    cell.styles.lineWidth = 0;
                }
                if (opts.row.index < 2 && opts.column.index >= 8) {
                    cell.styles.halign = 'center'
                }
            }
        }
    );
    return docA.autoTableEndPosY();
}

function toPdf(data, file: File, preismeldestelle: P.Models.Preismeldestelle, platform: Platform, erhebungsmonat: string, currentLanguage: string) {
    const pmsNummer = preismeldestelle.pmsNummer;
    const doc = new jsPDF('p');
    var settings: TableSettings = {
        page: {
            margin: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            },
            header: {
                fontSize: 10,
                hr: 12
            }
        },
        table: {
            fontSize: 8,
            fillColor: 200,
            lightFillColor: 100,
            textColor: 0,
            placeholderTextColor: 240,
            startAt: 14,
            marginBottom: 2,
            border: {
                inner: 0.02,
                outer: 0.1
            },
        },
        colors: {
            black: 0,
            white: 255,
            innerBorder: 220,
            tableBorder: 0
        },
        data: {
            spacingY: 3.5
        }
    }

    var lastPos = null;
    for (let i = 0; i < data.length; i++) {
        var rawData = data[i];
        lastPos = createTable(doc, settings, data[i], lastPos);
    }
    doc.addPage();
    lastPos = null;
    for (let i = 0; i < 3; i++) {
        lastPos = createTable(doc, settings, placeholderData, lastPos, true)
    }

    var pageCount = parseInt((doc as any).internal.getNumberOfPages(), 10);
    for (let i = 1; i < (pageCount + 1); i += 1) {
        doc.setPage(i);
        const currentPage = parseInt(doc.internal.getCurrentPageInfo().pageNumber, 10);
        doc.setFontSize(settings.page.header.fontSize);
        doc.text(settings.page.margin.left, settings.page.margin.top, preismeldestelle.name);
        doc.text(doc.internal.pageSize.width / 2, settings.page.margin.top, formatDate(erhebungsmonat, 'MMMM YYYY', currentLanguage), null, null, 'center');
        doc.text(doc.internal.pageSize.width - 10, settings.page.margin.top, 'Seite ' + String(currentPage) + ' / ' + String(pageCount), null, null, 'right');
        doc.setDrawColor(settings.colors.tableBorder);
        doc.line(settings.page.margin.left, settings.page.header.hr, doc.internal.pageSize.width - settings.page.margin.right, settings.page.header.hr);
    }


    if (platform.is('cordova')) {
        let pdfOutput = doc.output();
        let buffer = new ArrayBuffer(pdfOutput.length);
        let array = new Uint8Array(buffer);
        for (var i = 0; i < pdfOutput.length; i++) {
            array[i] = pdfOutput.charCodeAt(i);
        }

        if (file.externalRootDirectory)
            return file.writeFile(file.externalRootDirectory, `PDF_${pmsNummer}_${+new Date()}.pdf`, buffer).then(() => 'DOCUMENT_LOCATION')
                .catch(x => file.writeFile(file.externalApplicationStorageDirectory, `PDF_${pmsNummer}_${+new Date()}.pdf`, buffer).then(() => 'APPLICATION_LOCATION'));

        return file.writeFile(file.externalApplicationStorageDirectory, `PDF_${pmsNummer}_${+new Date()}.pdf`, buffer).then(() => 'APPLICATION_LOCATION');
    }
    else {
        doc.save(`PDF_${pmsNummer}_${+new Date()}.pdf`)
        return Promise.resolve('DOCUMENT_LOCATION');
    }
}
