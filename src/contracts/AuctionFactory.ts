
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

    constructor(
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
        (_owner: string, _wallet: string, _token: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.then((inst) => {
                    inst.produceForOwnerCustomToken(_owner, _wallet, _token, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_owner: string, _wallet: string, _token: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.produceForOwnerCustomToken.sendTransaction(_owner, _wallet, _token, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids, txParams || this._sendParams)
                            .then((res) => resolve(res))
                            .catch((err) => reject(err));
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_owner: string, _wallet: string, _token: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        resolve(inst.produceForOwnerCustomToken.request(_owner, _wallet, _token, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids).params[0].data);
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_owner: string, _wallet: string, _token: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.produceForOwnerCustomToken.estimateGas(_owner, _wallet, _token, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids).then((g) => resolve(g));
                    });
                });
            }
        });
    
    // tslint:disable-next-line:member-ordering
    public produceForOwner = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (_owner: string, _wallet: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.then((inst) => {
                    inst.produceForOwner(_owner, _wallet, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_owner: string, _wallet: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.produceForOwner.sendTransaction(_owner, _wallet, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids, txParams || this._sendParams)
                            .then((res) => resolve(res))
                            .catch((err) => reject(err));
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_owner: string, _wallet: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        resolve(inst.produceForOwner.request(_owner, _wallet, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids).params[0].data);
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_owner: string, _wallet: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.produceForOwner.estimateGas(_owner, _wallet, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids).then((g) => resolve(g));
                    });
                });
            }
        });
    
    // tslint:disable-next-line:member-ordering
    public produce = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (_wallet: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.then((inst) => {
                    inst.produce(_wallet, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_wallet: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.produce.sendTransaction(_wallet, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids, txParams || this._sendParams)
                            .then((res) => resolve(res))
                            .catch((err) => reject(err));
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_wallet: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        resolve(inst.produce.request(_wallet, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids).params[0].data);
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_wallet: string, _startSeconds: BigNumber | number, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.produce.estimateGas(_wallet, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids).then((g) => resolve(g));
                    });
                });
            }
        });
    
}
