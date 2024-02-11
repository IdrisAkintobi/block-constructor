import { join } from 'node:path';
import { MempoolService } from '../src/services/mempool.service';

describe('MempoolService test', () => {
    const testMempool = MempoolService.readMempool(join(__dirname, 'test.csv'));
    it('should read mempool', async () => {
        const mempool = await testMempool;
        expect(mempool).toBeDefined();
        expect(mempool.length).toBe(2);
    });

    it('should be sorted by fee', async () => {
        const mempool = await testMempool;
        expect(mempool[0].fee).toBe(20);
        expect(mempool[1].fee).toBe(10);
    });
});
