
import { BigNumber } from 'bignumber.js';
import { W3, SoltsiceContract } from 'soltsice';

/**
 * AuctionFactory API
 */
export class AuctionFactory extends SoltsiceContract {
    static get Artifacts() { return require('../artifacts/AuctionFactory.json'); }

    static get BytecodeHash() {
        // we need this before ctor, but artifacts are static and we cannot pass it to the base class, so need to generate
        let artifacts = AuctionFactory.Artifacts;
        if (!artifacts || !artifacts.bytecode) {
            return undefined;
        }
        let hash = W3.sha3(JSON.stringify(artifacts.bytecode));
        return hash;
    }

    // tslint:disable-next-line:max-line-length
    static async New(deploymentParams: W3.TC.TxParams, ctorParams?: {}, w3?: W3, link?: SoltsiceContract[]): Promise<AuctionFactory> {
        let contract = new AuctionFactory(deploymentParams, ctorParams, w3, link);
        await contract._instancePromise;
        return contract;
    }

    static async At(address: string | object, w3?: W3): Promise<AuctionFactory> {
        let contract = new AuctionFactory(address, undefined, w3, undefined);
        await contract._instancePromise;
        return contract;
    }

    protected constructor(
        deploymentParams: string | W3.TC.TxParams | object,
        ctorParams?: {},
        w3?: W3,
        link?: SoltsiceContract[]
    ) {
        // tslint:disable-next-line:max-line-length
        super(
            w3,
            AuctionFactory.Artifacts,
            ctorParams ? [] : [],
            deploymentParams,
            link
        );
    }
    /*
        Contract methods
    */
    
    // tslint:disable-next-line:member-ordering
    public produceForOwnerCustomToken = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (_owner: string, _wallet: string, _token: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.produceForOwnerCustomToken(_owner, _wallet, _token, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids, txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_owner: string, _wallet: string, _token: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.produceForOwnerCustomToken.sendTransaction(_owner, _wallet, _token, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_owner: string, _wallet: string, _token: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(this._instance.produceForOwnerCustomToken.request(_owner, _wallet, _token, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids).params[0].data);
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_owner: string, _wallet: string, _token: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.produceForOwnerCustomToken.estimateGas(_owner, _wallet, _token, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids).then((g) => resolve(g));
                });
            }
        });
    
    // tslint:disable-next-line:member-ordering
    public produceForOwner = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (_owner: string, _wallet: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.produceForOwner(_owner, _wallet, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids, txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_owner: string, _wallet: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.produceForOwner.sendTransaction(_owner, _wallet, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_owner: string, _wallet: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(this._instance.produceForOwner.request(_owner, _wallet, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids).params[0].data);
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_owner: string, _wallet: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.produceForOwner.estimateGas(_owner, _wallet, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids).then((g) => resolve(g));
                });
            }
        });
    
    // tslint:disable-next-line:member-ordering
    public produce = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (_wallet: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.produce(_wallet, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids, txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_wallet: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.produce.sendTransaction(_wallet, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_wallet: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(this._instance.produce.request(_wallet, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids).params[0].data);
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_wallet: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.produce.estimateGas(_wallet, _endSeconds, _weiPerToken, _maxTokens, _item, _allowManagedBids).then((g) => resolve(g));
                });
            }
        });
    
}
