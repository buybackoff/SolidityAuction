
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

    constructor(
        deploymentParams: string | W3.TC.TxParams | object,
        ctorParams?: {_owner: string, _wallet: string, _token: string, _endSeconds: BigNumber | number, _weiPerToken: BigNumber | number, _item: string, _allowManagedBids: boolean},
        w3?: W3,
        link?: SoltsiceContract[]
    ) {
        // tslint:disable-next-line:max-line-length
        super(
            w3,
            Auction.Artifacts,
            ctorParams ? [ctorParams!._owner, ctorParams!._wallet, ctorParams!._token, ctorParams!._endSeconds, ctorParams!._weiPerToken, ctorParams!._item, ctorParams!._allowManagedBids] : [],
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
                this._instance.then((inst) => {
                    inst.withdraw( txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: ( txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.withdraw.sendTransaction( txParams || this._sendParams)
                            .then((res) => resolve(res))
                            .catch((err) => reject(err));
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        resolve(inst.withdraw.request().params[0].data);
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.withdraw.estimateGas().then((g) => resolve(g));
                    });
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public canceled( txParams?: W3.TC.TxParams): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.canceled
                    .call( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:member-ordering
    public bid = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (tokens: BigNumber | number, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.then((inst) => {
                    inst.bid(tokens, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (tokens: BigNumber | number, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.bid.sendTransaction(tokens, txParams || this._sendParams)
                            .then((res) => resolve(res))
                            .catch((err) => reject(err));
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (tokens: BigNumber | number): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        resolve(inst.bid.request(tokens).params[0].data);
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (tokens: BigNumber | number): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.bid.estimateGas(tokens).then((g) => resolve(g));
                    });
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public endSeconds( txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.endSeconds
                    .call( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public wallet( txParams?: W3.TC.TxParams): Promise<string> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.wallet
                    .call( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public tokenBalances(_0: string, txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.tokenBalances
                    .call(_0, txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:member-ordering
    public managedBid = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (_managedBidder: BigNumber | number, _managedBid: BigNumber | number, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.then((inst) => {
                    inst.managedBid(_managedBidder, _managedBid, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_managedBidder: BigNumber | number, _managedBid: BigNumber | number, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.managedBid.sendTransaction(_managedBidder, _managedBid, txParams || this._sendParams)
                            .then((res) => resolve(res))
                            .catch((err) => reject(err));
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_managedBidder: BigNumber | number, _managedBid: BigNumber | number): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        resolve(inst.managedBid.request(_managedBidder, _managedBid).params[0].data);
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_managedBidder: BigNumber | number, _managedBid: BigNumber | number): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.managedBid.estimateGas(_managedBidder, _managedBid).then((g) => resolve(g));
                    });
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public owner( txParams?: W3.TC.TxParams): Promise<string> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.owner
                    .call( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:member-ordering
    public cancelAuction = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        ( txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.then((inst) => {
                    inst.cancelAuction( txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: ( txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.cancelAuction.sendTransaction( txParams || this._sendParams)
                            .then((res) => resolve(res))
                            .catch((err) => reject(err));
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        resolve(inst.cancelAuction.request().params[0].data);
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.cancelAuction.estimateGas().then((g) => resolve(g));
                    });
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public highestBidder( txParams?: W3.TC.TxParams): Promise<string> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.highestBidder
                    .call( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public etherBalances(_0: string, txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.etherBalances
                    .call(_0, txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public highestManagedBidder( txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.highestManagedBidder
                    .call( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:member-ordering
    public setWeiPerToken = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        (_weiPerToken: BigNumber | number, txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.then((inst) => {
                    inst.setWeiPerToken(_weiPerToken, txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: (_weiPerToken: BigNumber | number, txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.setWeiPerToken.sendTransaction(_weiPerToken, txParams || this._sendParams)
                            .then((res) => resolve(res))
                            .catch((err) => reject(err));
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (_weiPerToken: BigNumber | number): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        resolve(inst.setWeiPerToken.request(_weiPerToken).params[0].data);
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (_weiPerToken: BigNumber | number): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.setWeiPerToken.estimateGas(_weiPerToken).then((g) => resolve(g));
                    });
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public finalized( txParams?: W3.TC.TxParams): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.finalized
                    .call( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public highestBid( txParams?: W3.TC.TxParams): Promise<BigNumber> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.highestBid
                    .call( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public item( txParams?: W3.TC.TxParams): Promise<string> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.item
                    .call( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
    // tslint:disable-next-line:member-ordering
    public finalizeAuction = Object.assign(
        // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:variable-name
        ( txParams?: W3.TC.TxParams): Promise<W3.TC.TransactionResult> => {
            return new Promise((resolve, reject) => {
                this._instance.then((inst) => {
                    inst.finalizeAuction( txParams || this._sendParams)
                        .then((res) => resolve(res))
                        .catch((err) => reject(err));
                });
            });
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            sendTransaction: ( txParams?: W3.TC.TxParams): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.finalizeAuction.sendTransaction( txParams || this._sendParams)
                            .then((res) => resolve(res))
                            .catch((err) => reject(err));
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            data: (): Promise<string> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        resolve(inst.finalizeAuction.request().params[0].data);
                    });
                });
            }
        },
        {
            // tslint:disable-next-line:max-line-length
            // tslint:disable-next-line:variable-name
            estimateGas: (): Promise<number> => {
                return new Promise((resolve, reject) => {
                    this._instance.then((inst) => {
                        inst.finalizeAuction.estimateGas().then((g) => resolve(g));
                    });
                });
            }
        });
    
    // tslint:disable-next-line:max-line-length
    // tslint:disable-next-line:variable-name
    public token( txParams?: W3.TC.TxParams): Promise<string> {
        return new Promise((resolve, reject) => {
            this._instance.then((inst) => {
                inst.token
                    .call( txParams || this._sendParams)
                    .then((res) => resolve(res))
                    .catch((err) => reject(err));
            });
        });
    }
    
}
