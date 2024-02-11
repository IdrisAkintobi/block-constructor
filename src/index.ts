import { BlockConstructorService } from './services/block.constructor.service';
import { MempoolService } from './services/mempool.service';

(async function main() {
    const mempool = await MempoolService.readMempool('./mempool.csv');
    const blockConstructorService = new BlockConstructorService();
    const block = await blockConstructorService.constructBlock(mempool);
    // console.log(block);
    console.log(
        'Total fee in block:',
        block.reduce((acc, tx) => acc + tx.fee, 0),
    );
    console.log(
        'Total weight in block:',
        block.reduce((acc, tx) => acc + tx.weight, 0),
    );
    console.log('Total transactions in block:', block.length);

    for (let i = 0; i < mempool.length; i++) {
        if (mempool[i].fee === mempool[i + 1].fee) {
            console.log(mempool.slice(i, i + 3));
            break;
        }
    }
})();
