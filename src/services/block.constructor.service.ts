import { TransactionInterface } from "../types/interfaces";

export class BlockConstructorService {
    private readonly MAX_BLOCK_WEIGHT = 4_000_000;
    private processedTransactions: Set<string> = new Set();
    private block: TransactionInterface[] = [];
    private currentBlockWeight = 0;

    public async constructBlock(mempool: TransactionInterface[]): Promise<TransactionInterface[]> {
        for (const transaction of mempool) {
            if (this.processedTransactions.has(transaction.txid)) continue;
            if (this.currentBlockWeight + transaction.weight > this.MAX_BLOCK_WEIGHT) continue;

            if (transaction.parentTxids.length > 0) {
                // Check if the transaction is profitable with its parents
                const { isProfitable, parents } = await this.isProfitableTransactionWithParents(
                    transaction,
                    mempool
                );
                if (!isProfitable) continue;

                // Check if the parents can fit in the block
                const parentTxWeight = parents.reduce((acc, tx) => acc + tx.weight, 0);
                if (this.currentBlockWeight + parentTxWeight > this.MAX_BLOCK_WEIGHT) continue;

                // Add the parents to the block first
                for (const parent of parents) {
                    await this.addTransactionToBlock(parent);
                }
            }
            // Add the transaction to the block
            this.addTransactionToBlock(transaction);
        }

        return this.block;
    }

    private async addTransactionToBlock(transaction: TransactionInterface): Promise<void> {
        this.block.push(transaction);
        this.currentBlockWeight += transaction.weight;
        this.processedTransactions.add(transaction.txid);
    }

    private async isProfitableTransactionWithParents(
        transaction: TransactionInterface,
        mempool: TransactionInterface[]
    ): Promise<{ isProfitable: boolean; parents: TransactionInterface[] }> {
        let totalFee = transaction.fee;
        const unprocessedParents: TransactionInterface[] = [];

        // Recursively map the parent txids to their transactions
        let successfullyMappedParents = true;
        const mapParentTxidToTransaction = (transaction: TransactionInterface) => {
            for (const parentTxid of transaction.parentTxids) {
                if (this.processedTransactions.has(parentTxid)) continue;
                const parentTransaction = mempool.find((tx) => tx.txid === parentTxid);
                if (!parentTransaction) {
                    successfullyMappedParents = false;
                    break;
                }
                if (parentTransaction.parentTxids.length > 0) {
                    mapParentTxidToTransaction(parentTransaction);
                }
                unprocessedParents.push(parentTransaction);
                totalFee += parentTransaction.fee;
            }
        };

        mapParentTxidToTransaction(transaction);
        if (!successfullyMappedParents) return { isProfitable: false, parents: [] };

        // Check if the total fee/weight of the transaction and its parents is greater than the next n transactions in the mempool
        const totalTransactionsToProcess = unprocessedParents.length + 1;
        const totalWeight = unprocessedParents.reduce(
            (acc, tx) => acc + tx.weight,
            transaction.weight
        );

        // Get the fee and weight of the next n transactions to process in the mempool
        const nextTransactionIndex = mempool.indexOf(transaction) + 1;
        const nextTransactions = mempool.slice(
            nextTransactionIndex,
            nextTransactionIndex + totalTransactionsToProcess
        );
        const nextTransactionsFee = nextTransactions.reduce((acc, tx) => acc + tx.fee, 0);
        const nextTransactionsWeight = nextTransactions.reduce((acc, tx) => acc + tx.weight, 0);

        const isProfitable = totalFee / totalWeight > nextTransactionsFee / nextTransactionsWeight;
        return { isProfitable, parents: unprocessedParents };
    }
}
