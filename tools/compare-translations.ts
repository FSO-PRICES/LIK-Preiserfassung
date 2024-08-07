/**
 * Language Keys Comparison Tool
 *
 * Description:
 * This script compares keys between a specified CSV file and a TypeScript file.
 * It generates summaries to show discrepancies between both files:
 * 1. Keys present in the CSV but not in the TypeScript file.
 * 2. Keys present in the TypeScript file but not in the CSV.
 *
 * Usage:
 * navigate into the the folder where the script is located and run the following command:
 * ts-node script.ts <path_to_csv_file> <path_to_ts_file>
 * ..\node_modules\.bin\ts-node compare-translations.ts LIK-Preiserfasser-and-Admin-Translations-Complete.csv ../libs/lik-shared/src/lib/translations.de.ts
 *
 * Example:
 * ts-node script.ts /path/to/your/csv/file.csv /path/to/your/typescript/file.ts
 *
 * Note:
 * Ensure that the provided TypeScript file exports an object named 'de'.
 * Adjust the script if the exported object name differs.
 */

import * as fs from 'fs';
import * as readline from 'readline';
import * as Papa from 'papaparse';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Check if paths are provided
if (process.argv.length < 4) {
    console.error('Usage: ts-node script.ts <path_to_csv_file> <path_to_ts_file>');
    process.exit(1);
}

const csvFilePath: string = process.argv[2];
const tsFilePath: string = process.argv[3];
let csvHeader: string[] = [];

// Read the TypeScript file to detect the exported object name
const tsContent: string = fs.readFileSync(tsFilePath, 'utf-8');

const objectNameMatch = tsContent.match(/export const (de|it|fr|en) =/);

if (!objectNameMatch) {
    console.error('No recognized exported object found in the TypeScript file.');
    process.exit(1);
}
const objectName = objectNameMatch[1];

// Dynamically import the TypeScript file
import(tsFilePath).then(async (obj) => {
    const tsObject: { [key: string]: string } = obj[objectName];

    //sanitize the object
    Object.keys(tsObject).forEach((key) => {
        if (key.includes('\n')) {
            const newKey = key.replace('\n', '');
            Object.assign(tsObject, { [newKey]: tsObject[key] });
            delete tsObject[key];
        }
        if (tsObject[key].includes('\n')) {
            const newValue = tsObject[key].replace('\n', '');
            Object.assign(tsObject, { [key]: newValue });
        }
    });

    const tsKeys: string[] = Object.keys(tsObject);

    const csvContent: string = fs.readFileSync(csvFilePath, 'utf-8');
    const csvArray = Papa.parse(csvContent, { delimiter: ',', header: false }).data as string[][];

    const csvObject: { [key: string]: string } = {};
    csvArray.forEach((line, index) => {
        if (index === 0) {
            csvHeader = line;
            return;
        }
        //sanitize the values
        let newLine = line;
        try {
            if (newLine[0].includes('\n')) {
                const newKey = line[0].replace('\n', '');
                newLine = [newKey, line[1]];
            }
            if (newLine[1].includes('\n')) {
                const newValue = line[1].replace('\n', '');
                newLine = [line[0], newValue];
            }
        } catch (error) {
            console.log('🚀 ~ error while replacing \\n', newLine, index);
        }
        Object.assign(csvObject, { [newLine[0]]: newLine[1] });
    });

    // Make Objects with missing translations
    const missingInTs: { [key: string]: string } = {};
    const missingInCsv: { [key: string]: string } = {};

    Object.keys(csvObject).forEach((csvKey) => {
        if (!tsKeys.includes(csvKey)) {
            Object.assign(missingInTs, { [csvKey]: csvObject[csvKey] });
        }
    });

    Object.keys(tsObject).forEach((tsKey) => {
        if (!Object.keys(csvObject).includes(tsKey)) {
            Object.assign(missingInCsv, { [tsKey]: tsObject[tsKey] });
        }
    });

    // Check if there are missing translations

    // Missing in TS
    if (Object.keys(missingInTs).length > 0) {
        console.log('Translations in the CSV that are not in the TS file:');
        Object.keys(missingInTs).forEach((key) => {
            console.log(`- ${key}: ${JSON.stringify(missingInTs[key])}`);
        });

        const answer = await askQuestion(
            'Do you want to add the missing translations to the TS-File? In case something goes wrong, BACKUP YOUR FILE BEFORE! (y/n) ',
        );

        if (answer.toLowerCase() === 'y') {
            addMissingKeysToTSFile(tsObject, missingInTs, tsFilePath);
        }
    } else {
        console.log('All translations in the CSV are present in the TypeScript file.');
    }

    // Missing in CSV
    if (Object.keys(missingInCsv).length > 0) {
        console.log('\nTranslations in the TS file that are not in the CSV:');
        Object.keys(missingInCsv).forEach((key) => {
            console.log(`- ${key}: ${JSON.stringify(missingInCsv[key])}`);
        });

        const answer = await askQuestion(
            'Do you want to add the missing translations to the CSV-File? In case something goes wrong, BACKUP YOUR FILE BEFORE! (y/n) ',
        );

        if (answer.toLowerCase() === 'y') {
            addMissingKeysToCSVFile(csvObject, missingInCsv, csvFilePath);
        }
    } else {
        console.log('All translations in the TypeScript file are present in the CSV.');
    }
    console.log('Comparison finished.');
    rl.close();
});

function askQuestion(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
}

function addMissingKeysToTSFile(
    object: { [key: string]: string },
    missingKeys: { [key: string]: string },
    filePath: string,
) {
    console.log('Adding missing keys to the TS file...');
    Object.assign(object, missingKeys);
    //Order the object alphabetically
    const orderedObj: { [key: string]: string } = {};
    Object.keys(object)
        .sort()
        .forEach((key) => {
            orderedObj[key] = object[key];
        });
    object = orderedObj;
    console.log('🚀 ~ orderedObj:', JSON.stringify(orderedObj, null, 2));

    // write the new object into the file
    fs.writeFileSync(filePath, `export const ${objectName} = ${JSON.stringify(object, null, 4)};`);
    console.log('Done.');
}

function addMissingKeysToCSVFile(
    object: { [key: string]: string },
    missingKeys: { [key: string]: string },
    filePath: string,
) {
    console.log('Adding missing keys to the CSV file...');
    Object.assign(object, missingKeys);
    //Order the object alphabetically
    const orderedObj: { [key: string]: string } = {};
    Object.keys(object)
        .sort()
        .forEach((key) => {
            orderedObj[key] = object[key];
        });
    const newObject: { [key: string]: string } = {};
    Object.assign(newObject, { [csvHeader[0]]: csvHeader[1] });
    Object.assign(newObject, orderedObj);

    const csvString = Object.keys(newObject)
        .map((key) => `${key},${newObject[key]}`)
        .join('\n');

    // write the new object into the file
    fs.writeFileSync(filePath, csvString, 'utf8');
    console.log('Done.');
}
