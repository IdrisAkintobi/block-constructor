export interface TransactionInterface {
    txid: string;
    fee: number;
    weight: number;
    parentTxids: string[];
}
