import { BlockConstructorService } from "../src/services/block.constructor.service";

const mockTransaction = {
    txid: "tx1",
    fee: 4,
    weight: 2,
    parentTxids: [],
};

describe("BlockConstructorService test", () => {
    it("should construct a block", async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([mockTransaction]);
        expect(block).toBeDefined();
        expect(block.length).toBe(1);
        expect(block[0].txid).toBe("tx1");
    });

    it("should not add duplicate transaction", async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            mockTransaction,
            mockTransaction,
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(1);
    });

    it("should not add transaction if it exceeds block weight", async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            { ...mockTransaction, weight: 4_000_001 },
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(0);
    });

    it("should not add transaction if it exceeds block weight with parents", async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            { ...mockTransaction, parentTxids: ["tx2"], weight: 4_000_000 },
            { ...mockTransaction, txid: "tx2", weight: 1 },
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(1);
    });

    it("should add transaction if it has profitable parents", async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            { ...mockTransaction, parentTxids: ["tx2"], fee: 10 },
            { ...mockTransaction, txid: "tx2", weight: 1 },
            { ...mockTransaction, txid: "tx3", weight: 124 },
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(3);
        expect(block[0].txid).toBe("tx2");
        expect(block[2].txid).toBe("tx3");
    });

    it("should not add transaction if it has unprofitable parents", async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            { ...mockTransaction, parentTxids: ["tx2"], fee: 1 },
            { ...mockTransaction, txid: "tx2", weight: 12 },
            { ...mockTransaction, txid: "tx3", fee: 24 },
            { ...mockTransaction, txid: "tx4", fee: 12 },
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(3);
    });

    it("should add transaction if it has profitable parents with parents", async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            { ...mockTransaction, parentTxids: ["tx2"], fee: 10 },
            { ...mockTransaction, txid: "tx2", parentTxids: ["tx3"], weight: 1 },
            { ...mockTransaction, txid: "tx3", weight: 124 },
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(3);
        expect(block[0].txid).toBe("tx3");
        expect(block[2].txid).toBe("tx1");
    });

    it("should not add transaction if it has unprofitable parents with parents", async () => {
        const blockConstructorService = new BlockConstructorService();
        const block = await blockConstructorService.constructBlock([
            { ...mockTransaction, parentTxids: ["tx2"], fee: 1 },
            { ...mockTransaction, txid: "tx2", parentTxids: ["tx3"], weight: 12 },
            { ...mockTransaction, txid: "tx3", fee: 240 },
            { ...mockTransaction, txid: "tx4", fee: 120 },
        ]);
        expect(block).toBeDefined();
        expect(block.length).toBe(2);
    });
});
