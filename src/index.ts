import { createWriteStream } from 'node:fs';
import { BlockConstructorService } from './services/block.constructor.service';
import { MempoolService } from './services/mempool.service';

(async function main() {
    const mempool = await MempoolService.readMempool('./mempool.csv');
    const blockConstructorService = new BlockConstructorService();
    const block = await blockConstructorService.constructBlock(mempool);

    console.log('Total transactions in block:', block.length);
    console.log(
        'Total weight in block:',
        block.reduce((acc, tx) => acc + tx.weight, 0),
    );
    console.log(
        'Total fee in block:',
        block.reduce((acc, tx) => acc + tx.fee, 0),
    );

    // Write the block to a file, only transaction ids per line
    const fileStream = createWriteStream('./output.txt', { flags: 'w' });
    block.forEach(tx => fileStream.write(`${tx.txid}\n`));
    fileStream.end();

    console.log('Block written to output.txt');
})();
