import * as fs from 'fs';
import * as path from 'path';

export interface Config {
    web3: string;
    privateKey: string;
    networkId: number;
    gasPrice: number
}

let configpath = path.join(__dirname, '../config/config.json');
export let config: Config = JSON.parse(fs.readFileSync(configpath, 'utf8'));