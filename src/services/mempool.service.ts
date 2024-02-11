import { parse } from 'csv-parse';
import { createReadStream } from 'node:fs';
import { TransactionInterface } from '../types/interfaces';

export class MempoolService {
    public static async readMempool(filePath: string): Promise<TransactionInterface[]> {
        const fileStream = createReadStream(filePath);
        const transactions: TransactionInterface[] = [];

        const parser = parse({
            delimiter: ',',
            trim: true,
            skipEmptyLines: true,
            quote: '',
            // remove quotes from fields
            onRecord: record => record.map((field: string) => field.replace(/"/g, '')),
        });

        parser.on('readable', () => {
            let record;
            while ((record = parser.read())) {
                const [txid, fee, weight, parentTxids] = record;
                transactions.push({
                    txid,
                    fee: parseInt(fee, 10),
                    weight: parseInt(weight, 10),
                    parentTxids: parentTxids ? parentTxids.split(';') : [],
                });
            }
        });

        parser.on('error', err => {
            console.error(`Error parsing file ${filePath}`, err);
        });

        fileStream.pipe(parser);

        // wait for the parser to finish
        await new Promise(resolve => {
            parser.on('end', resolve);
        });

        const sortedTransactions = this.sortTransactionsByFee(transactions);

        return sortedTransactions;
    }

    private static sortTransactionsByFee(
        transactions: TransactionInterface[],
    ): TransactionInterface[] {
        // Remove duplicate transactions, favoring the one with the higher fee
        const uniqueTransactions = new Map<string, TransactionInterface>();
        for (const transaction of transactions) {
            if (!uniqueTransactions.has(transaction.txid)) {
                uniqueTransactions.set(transaction.txid, transaction);
            } else {
                const existingTransaction = uniqueTransactions.get(transaction.txid);
                const existingFeeByWeight = existingTransaction!.fee / existingTransaction!.weight;
                const newFeeByWeight = transaction.fee / transaction.weight;

                if (newFeeByWeight > existingFeeByWeight) {
                    uniqueTransactions.set(transaction.txid, transaction);
                } else if (
                    // If the fee per weight is the same, favor the transaction with the higher fee
                    newFeeByWeight === existingFeeByWeight &&
                    transaction.fee > existingTransaction!.fee
                ) {
                    uniqueTransactions.set(transaction.txid, transaction);
                }
            }
        }

        transactions = Array.from(uniqueTransactions.values());
        // Sort transactions by fee in descending order
        // If two transactions have the same fee, the transaction with the lower weight should come first
        return transactions.sort((a, b) => {
            return a.fee - b.fee === 0 ? a.weight - b.weight : b.fee - a.fee;
        });
    }
}
