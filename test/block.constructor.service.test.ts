import { BlockConstructorService } from '../src/services/block.constructor.service';

const mockTransaction = {
    txid: 'tx1',
    fee: 4,
    weight: 2,
    parentTxids: [],
};

describe('BlockConstructorService test', () => {
    it('should construct a block', async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([mockTransaction]);
        expect(block).toBeDefined();
        expect(block.length).toBe(1);
        expect(block[0].txid).toBe('tx1');
    });

    it('should not add duplicate transaction', async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            mockTransaction,
            mockTransaction,
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(1);
    });

    it('should not add transaction if it exceeds block weight', async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            { ...mockTransaction, weight: 4_000_001 },
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(0);
    });

    it('should add transaction with parents, if parents are processable', async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            { ...mockTransaction, parentTxids: ['tx2'], weight: 2 },
            { ...mockTransaction, txid: 'tx2', weight: 1 },
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(2);
    });

    it('should not add transaction with parents, if they exceeds block weight', async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            { ...mockTransaction, parentTxids: ['tx2'], weight: 4_000_000 },
            { ...mockTransaction, txid: 'tx2', weight: 1 },
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(1);
    });

    it('should not add transaction with parents, if parents are not found in block (not processable)', async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            { ...mockTransaction, parentTxids: ['tx2'], weight: 2 },
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(0);
    });
});
