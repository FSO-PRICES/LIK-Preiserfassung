import { readFile } from './promisified';

doIt();

async function doIt() {
    const data = await readFile('./tsconfig.json');
    console.log(data.toString());
}
