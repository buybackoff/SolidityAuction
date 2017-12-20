
import { BigNumber } from 'bignumber.js';
import { W3, SoltsiceContract } from 'soltsice';

/**
 * Auction API
 */
export class Auction extends SoltsiceContract {
    static get Artifacts() { return require('../artifacts/Auction.json'); }

    static get BytecodeHash() {
        // we need this before ctor, but artifacts are static and we cannot pass it to the base class, so need to generate
        let artifacts = Auction.Artifacts;
        if (!artifacts || !artifacts.bytecode) {
            return undefined;
        }
        let hash = W3.sha3(JSON.stringify(artifacts.bytecode));
        return hash;
    }

    // tslint:disable-next-line:max-line-length
    static async New(deploymentParams: W3.TC.TxParams, ctorParams?: {_owner: string, _wallet: string, _token: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _minPrice: BigNumber | number, _allowManagedBids: boolean}, w3?: W3, link?: SoltsiceContract[]): Promise<Auction> {
        let contract = new Auction(deploymentParams, ctorParams, w3, link);
        await contract._instancePromise;
        return contract;
    }

    static async At(address: string | object, w3?: W3): Promise<Auction> {
        let contract = new Auction(address, undefined, w3, undefined);
        await contract._instancePromise;
        return contract;
    }

    protected constructor(
        deploymentParams: string | W3.TC.TxParams | object,
        ctorParams?: {_owner: string, _wallet: string, _token: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _maxTokens: BigNumber | number, _item: string, _minPrice: BigNumber | number, _allowManagedBids: boolean},
        w3?: W3,
        link?: SoltsiceContract[]
    ) {
        // tslint:disable-next-line:max-line-length
        super(
            w3,
            Auction.Artifacts,
            ctorParams ? [ctorParams!._owner, ctorParams!._wallet, ctorParams!._token, ctorParams!._endSeconds, ctorParams!._weiPerToken, ctorParams!._maxTokens, ctorParams!._item, ctorParams!._minPrice, ctorParams!._allowManagedBids] : [],
            deploymentParams,
            link
        );
    }
    /*
        Contract methods
    */
    
    // tslint:disable-next-line:member-ordering
    public withdraw = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        ( txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.withdraw( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: ( txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.withdraw.sendTransaction( txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(this._instance.withdraw.request().params[0].data);
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.withdraw.estimateGas().then((g) => resolve(g));
                });
            }
        });
    
    // tslint:disable-next-line:member-ordering
    public bid = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (tokens: BigNumber | number, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.bid(tokens, txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (tokens: BigNumber | number, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.bid.sendTransaction(tokens, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (tokens: BigNumber | number): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(this._instance.bid.request(tokens).params[0].data);
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (tokens: BigNumber | number): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.bid.estimateGas(tokens).then((g) => resolve(g));
                });
            }
        });
    
    // tslint:disable-next-line:member-ordering
    public finalize = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        ( txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.finalize( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: ( txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.finalize.sendTransaction( txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(this._instance.finalize.request().params[0].data);
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.finalize.estimateGas().then((g) => resolve(g));
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public endSeconds( txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.endSeconds
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public wallet( txParams?: W3.TC.TxParams): Promise<string> {
        return new Promise((resolve, reject) => {
            this._instance.wallet
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public tokenBalances(_0: string, txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.tokenBalances
                .call(_0, txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:member-ordering
    public managedBid = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (_managedBidder: BigNumber | number, _managedBid: BigNumber | number, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.managedBid(_managedBidder, _managedBid, txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_managedBidder: BigNumber | number, _managedBid: BigNumber | number, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.managedBid.sendTransaction(_managedBidder, _managedBid, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_managedBidder: BigNumber | number, _managedBid: BigNumber | number): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(this._instance.managedBid.request(_managedBidder, _managedBid).params[0].data);
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_managedBidder: BigNumber | number, _managedBid: BigNumber | number): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.managedBid.estimateGas(_managedBidder, _managedBid).then((g) => resolve(g));
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public owner( txParams?: W3.TC.TxParams): Promise<string> {
        return new Promise((resolve, reject) => {
            this._instance.owner
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public totalDirectBid(_address: string, txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.totalDirectBid
                .call(_address, txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public highestBidder( txParams?: W3.TC.TxParams): Promise<string> {
        return new Promise((resolve, reject) => {
            this._instance.highestBidder
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public etherBalances(_0: string, txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.etherBalances
                .call(_0, txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:member-ordering
    public managedBid2 = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (_managedBidder: BigNumber | number, _managedBid: BigNumber | number, _knownManagedBidder: string, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.managedBid2(_managedBidder, _managedBid, _knownManagedBidder, txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_managedBidder: BigNumber | number, _managedBid: BigNumber | number, _knownManagedBidder: string, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.managedBid2.sendTransaction(_managedBidder, _managedBid, _knownManagedBidder, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_managedBidder: BigNumber | number, _managedBid: BigNumber | number, _knownManagedBidder: string): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(this._instance.managedBid2.request(_managedBidder, _managedBid, _knownManagedBidder).params[0].data);
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_managedBidder: BigNumber | number, _managedBid: BigNumber | number, _knownManagedBidder: string): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.managedBid2.estimateGas(_managedBidder, _managedBid, _knownManagedBidder).then((g) => resolve(g));
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public cancelled( txParams?: W3.TC.TxParams): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._instance.cancelled
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public highestManagedBidder( txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.highestManagedBidder
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:member-ordering
    public setWeiPerToken = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (_weiPerToken: BigNumber | number, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.setWeiPerToken(_weiPerToken, txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_weiPerToken: BigNumber | number, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.setWeiPerToken.sendTransaction(_weiPerToken, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_weiPerToken: BigNumber | number): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(this._instance.setWeiPerToken.request(_weiPerToken).params[0].data);
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_weiPerToken: BigNumber | number): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.setWeiPerToken.estimateGas(_weiPerToken).then((g) => resolve(g));
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public finalized( txParams?: W3.TC.TxParams): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._instance.finalized
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public highestBid( txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.highestBid
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public minPrice( txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.minPrice
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public managedBids(_0: string, txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.managedBids
                .call(_0, txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:member-ordering
    public cancel = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        ( txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.cancel( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: ( txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.cancel.sendTransaction( txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (): Promise<string> => {
                return new Promise((resolve, reject) => {
                    resolve(this._instance.cancel.request().params[0].data);
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.cancel.estimateGas().then((g) => resolve(g));
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public item( txParams?: W3.TC.TxParams): Promise<string> {
        return new Promise((resolve, reject) => {
            this._instance.item
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public tokenBalancesInEther(_0: string, txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.tokenBalancesInEther
                .call(_0, txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public token( txParams?: W3.TC.TxParams): Promise<string> {
        return new Promise((resolve, reject) => {
            this._instance.token
                .call( txParams || this._sendParams)
                .then((res) => resolve(res))
                .catch((err) => reject(err));
        });
    }
    
}
