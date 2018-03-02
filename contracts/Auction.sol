pragma solidity ^0.4.18;

import 'soltsice/contracts/BotManageable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract ERC20Basic {
    function totalSupply() public view returns (uint256);
    function transferFrom(address from, address to, uint256 value) public returns (bool);
    function transfer(address to, uint256 value) public returns (bool);
}

contract AuctionHub is BotManageable {
    using SafeMath for uint256;

    /*
     *  Data structures
     */
    
    struct TokenBalance {
        address token;
        uint256 value;
    }

    struct TokenRate {
        uint256 value;
        uint256 decimals;
    }

    struct BidderState {
        uint256 etherBalance;
        uint256 tokensBalanceInEther;
        uint256 managedBid;
        TokenBalance[] tokenBalances;
    }

    struct ActionState {
        uint256 endSeconds;
        uint256 maxTokenBidInEther;
        uint256 minPrice;
        
        uint256 highestBid;
        
        // next 5 fields should be packed into one 32-bytes slot
        address highestBidder;
        uint64 highestManagedBidder;
        bool allowManagedBids;
        bool cancelled;
        bool finalized;

        mapping(address => BidderState) bidderStates;

        bytes32 item;
    }

    /*
     *  Storage
     */
    mapping(address => ActionState) public auctionStates;
    mapping(address => TokenRate) public tokenRates;

    /*
     *  Events
     */

    event NewAction(address indexed auction, string item);
    event Bid(address indexed auction, address bidder, uint256 totalBidInEther, uint256 indexed tokensBidInEther);
    event TokenBid(address indexed auction, address bidder, address token, uint256 numberOfTokens);
    event ManagedBid(address indexed auction, uint64 bidder, uint256 bid, address knownManagedBidder);
    event NewHighestBidder(address indexed auction, address bidder, uint64 managedBidder, uint256 totalBid);
    event TokenRateUpdate(address indexed token, uint256 rate);
    event Withdrawal(address indexed auction, address bidder, uint256 etherAmount, uint256 tokensBidInEther);
    event Charity(address indexed auction, address bidder, uint256 etherAmount, uint256 tokensAmount);
    event Finalized(address indexed auction, address highestBidder, uint64 highestManagedBidder, uint256 amount);
    event FinalizedTokenTransfer(address indexed auction, address token, uint256 tokensBidInEther);
    event FinalizedEtherTransfer(address indexed auction, uint256 etherAmount);
    event ExtendedEndTime(address indexed auction, uint256 newEndtime);
    event Cancelled(address indexed auction);

    /*
     *  Modifiers
     */

    modifier onlyActive {
        // NB this modifier also serves as check that an auction exists (otherwise endSeconds == 0)
        ActionState storage auctionState = auctionStates[msg.sender];
        require (now < auctionState.endSeconds && !auctionState.cancelled);
        _;
    }

    modifier onlyBeforeEnd {
        // NB this modifier also serves as check that an auction exists (otherwise endSeconds == 0)
        ActionState storage auctionState = auctionStates[msg.sender];
        require (now < auctionState.endSeconds);
        _;
    }

    modifier onlyAfterEnd {
        ActionState storage auctionState = auctionStates[msg.sender];
        require (now > auctionState.endSeconds && auctionState.endSeconds > 0);
        _;
    }

    modifier onlyNotCancelled {
        ActionState storage auctionState = auctionStates[msg.sender];
        require (!auctionState.cancelled);
        _;
    }

    modifier onlyAllowedManagedBids {
        ActionState storage auctionState = auctionStates[msg.sender];
        require (auctionState.allowManagedBids);
        _;
    }

    /*
     * _rates are per big token (e.g. Ether vs. wei), i.e. number of wei per [number of tokens]*[10 ** decimals]
     */
    function AuctionHub 
        (address _wallet, address[] _tokens, uint256[] _rates, uint256[] _decimals)
        public
        BotManageable(_wallet)
    {
        // make sender a bot to avoid an additional step
        botsStartEndTime[msg.sender] = uint128(now) << 64;

        require(_tokens.length == _rates.length);
        require(_tokens.length == _decimals.length);

        // save initial token list
        for (uint i = 0; i < _tokens.length; i++) {
            require(_tokens[i] != 0x0);
            require(_rates[i] > 0);
            ERC20Basic token = ERC20Basic(_tokens[i]);
            tokenRates[token] = TokenRate(_rates[i], _decimals[i]);
            TokenRateUpdate(token, _rates[i]);
        }
    }

    function stringToBytes32(string memory source) returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }

    function createAuction(
        uint _endSeconds, 
        uint256 _maxTokenBidInEther,
        uint256 _minPrice,
        string _item,
        bool _allowManagedBids
    )
        onlyBot
        public
        returns (address)
    {
        require (_endSeconds > now);
        require(_maxTokenBidInEther <= 1000 ether);
        require(_minPrice > 0);

        Auction auction = new Auction(this);

        ActionState storage auctionState = auctionStates[auction];

        auctionState.endSeconds = _endSeconds;
        auctionState.maxTokenBidInEther = _maxTokenBidInEther;
        auctionState.minPrice = _minPrice;
        auctionState.allowManagedBids = _allowManagedBids;
        string memory item = _item;
        auctionState.item = stringToBytes32(item);

        NewAction(auction, _item);
        return address(auction);
    }

    function () 
        payable
        public
    {
        throw;
        // It's charity!
        // require(wallet.send(msg.value));
        // Charity(0x0, msg.sender, msg.value, 0);
    }

    function bid(address _bidder, uint256 _value, address _token, uint256 _tokensNumber)
        // onlyActive - inline check to reuse auctionState variable
        public
        returns (bool isHighest)
    {
        ActionState storage auctionState = auctionStates[msg.sender];
        // same as onlyActive modifier, but we already have a variable here
        require (now < auctionState.endSeconds && !auctionState.cancelled);

        BidderState storage bidderState = auctionState.bidderStates[_bidder];
        
        uint256 totalBid;
        if (_tokensNumber > 0) {
            totalBid = tokenBid(msg.sender, _bidder,  _token, _tokensNumber);
        }else {
            require(_value > 0);

            // NB if current token bid == 0 we still could have previous token bids
            totalBid = bidderState.tokensBalanceInEther;
        }

        uint256 etherBid = bidderState.etherBalance + _value;
        bidderState.etherBalance = etherBid;
        totalBid = totalBid + etherBid + bidderState.managedBid;

        if (totalBid > auctionState.highestBid && totalBid >= auctionState.minPrice) {
            auctionState.highestBid = totalBid;
            auctionState.highestBidder = _bidder;
            auctionState.highestManagedBidder = 0;
            NewHighestBidder(msg.sender, _bidder, 0, totalBid);
            if ((auctionState.endSeconds - now) < 1800) {
                uint256 newEnd = now + 1800;
                auctionState.endSeconds = newEnd;
                ExtendedEndTime(msg.sender, newEnd);
            }
            isHighest = true;
        }

        Bid(msg.sender, _bidder, totalBid, totalBid - etherBid);

        return isHighest;
    }

    function tokenBid(address _auction, address _bidder, address _token, uint256 _tokensNumber)
        internal
        returns (uint256 tokenBid)
    {
        // NB actual token transfer happens in auction contracts, which owns both ether and tokens
        // This Hub contract is for accounting

        ActionState storage auctionState = auctionStates[_auction];
        BidderState storage bidderState = auctionState.bidderStates[_bidder];
        
        uint256 totalBid = bidderState.tokensBalanceInEther;

        TokenRate storage tokenRate = tokenRates[_token];
        require(tokenRate.value > 0);

        // find token index
        uint256 index = bidderState.tokenBalances.length;
        for (uint i = 0; i < index; i++) {
            if (bidderState.tokenBalances[i].token == _token) {
                index = i;
                break;
            }
        }

        // array was empty/token not found - push empty to the end
        if (index == bidderState.tokenBalances.length) {
            bidderState.tokenBalances.push(TokenBalance(_token, _tokensNumber));
        } else {
            // safe math is already in transferFrom
            bidderState.tokenBalances[index].value += _tokensNumber;
        }

        // tokenRate.value is for a whole/big token (e.g. ether vs. wei) but _tokensNumber is in small/wei tokens, need to divide by decimals
        totalBid = totalBid + _tokensNumber.mul(tokenRate.value).div(10 ** tokenRate.decimals);
        require(totalBid <= auctionState.maxTokenBidInEther);

        bidderState.tokensBalanceInEther = totalBid;

        TokenBid(_auction, _bidder, _token, _tokensNumber);

        return totalBid;
    }

    function managedBid(uint64 _managedBidder, uint256 _managedBid, address _knownManagedBidder)
        // onlyActive - inline check to reuse auctionState variable
        // onlyAllowedManagedBids - inline check to reuse auctionState variable
        // onlyBot - done in Auction that is msg.sender, only bot could create auctions and set endSeconds to non-zero
        public
        returns (bool isHighest)
    {
        require(_managedBidder != 0);

        ActionState storage auctionState = auctionStates[msg.sender];
        // same as onlyActive+onlyAllowedManagedBids modifiers, but we already have a variable here
        require (now < auctionState.endSeconds && !auctionState.cancelled && auctionState.allowManagedBids);

        
        // sum with direct bid if any
        uint256 directBid = 0;
        if (_knownManagedBidder != 0x0) {
            BidderState storage bidderState = auctionState.bidderStates[_knownManagedBidder];
            require(_managedBid > bidderState.managedBid);
            bidderState.managedBid = _managedBid;
            directBid = bidderState.tokensBalanceInEther + bidderState.etherBalance;
        }

        // NB: _managedBid is the total amount of all bids from backend
        // calculated without any direct bid. It is important to calculate direct bids
        // inside this transaction and make the _knownManagedBidder the highest
        // to prevent this wallet to withdraw money and remain the highest

        uint256 totalBid = directBid + _managedBid;

        if (totalBid > auctionState.highestBid && totalBid >= auctionState.minPrice) {
            auctionState.highestBid = totalBid;
            auctionState.highestBidder = _knownManagedBidder;
            auctionState.highestManagedBidder = _managedBidder;
            
            NewHighestBidder(msg.sender, _knownManagedBidder, _managedBidder, totalBid);

            if ((auctionState.endSeconds - now) < 1800) {
                uint256 newEnd = now + 1800;
                auctionState.endSeconds = newEnd;
                ExtendedEndTime(msg.sender, newEnd);
            }
            isHighest = true;
        }
        // event ManagedBid(address indexed auction, uint64 bidder, uint256 bid, address knownManagedBidder);
        ManagedBid(msg.sender, _managedBidder, _managedBid, _knownManagedBidder);
        return isHighest;
    }

    function totalDirectBid(address _auction, address _bidder)
        view
        public
        returns (uint256 _totalBid)
    {
        ActionState storage auctionState = auctionStates[_auction];
        BidderState storage bidderState = auctionState.bidderStates[_bidder];
        return bidderState.tokensBalanceInEther + bidderState.etherBalance;
    }

    function setTokenRate(address _token, uint256 _tokenRate)
        onlyBot
        public
    {
        TokenRate storage tokenRate = tokenRates[_token];
        require(tokenRate.value > 0);
        tokenRate.value = _tokenRate;
        TokenRateUpdate(_token, _tokenRate);
    }

    function withdraw(address _bidder)
        public
        returns (bool success)
    {
        ActionState storage auctionState = auctionStates[msg.sender];
        BidderState storage bidderState = auctionState.bidderStates[_bidder];

        bool sent; 

        // anyone could withdraw at any time except the highest bidder
        // if cancelled, the highest bidder could withdraw as well
        require((_bidder != auctionState.highestBidder) || auctionState.cancelled);
        uint256 tokensBalanceInEther = bidderState.tokensBalanceInEther;
        if (bidderState.tokenBalances.length > 0) {
            for (uint i = 0; i < bidderState.tokenBalances.length; i++) {
                uint256 tokenBidValue = bidderState.tokenBalances[i].value;
                if (tokenBidValue > 0) {
                    bidderState.tokenBalances[i].value = 0;
                    sent = Auction(msg.sender).sendTokens(bidderState.tokenBalances[i].token, _bidder, tokenBidValue);
                    require(sent);
                }
            }
            bidderState.tokensBalanceInEther = 0;
        } else {
            require(tokensBalanceInEther == 0);
        }

        uint256 etherBid = bidderState.etherBalance;
        if (etherBid > 0) {
            bidderState.etherBalance = 0;
            sent = Auction(msg.sender).sendEther(_bidder, etherBid);
            require(sent);
        }

        Withdrawal(msg.sender, _bidder, etherBid, tokensBalanceInEther);
        
        return true;
    }

    function finalize()
        // onlyNotCancelled - inline check to reuse auctionState variable
        // onlyAfterEnd - inline check to reuse auctionState variable
        public
        returns (bool)
    {
        ActionState storage auctionState = auctionStates[msg.sender];
        // same as onlyNotCancelled+onlyAfterEnd modifiers, but we already have a variable here
        require (!auctionState.finalized && now > auctionState.endSeconds && auctionState.endSeconds > 0 && !auctionState.cancelled);

        if (auctionState.highestBidder != address(0)) {
            bool sent; 
            BidderState storage bidderState = auctionState.bidderStates[auctionState.highestBidder];
            uint256 tokensBalanceInEther = bidderState.tokensBalanceInEther;
            if (bidderState.tokenBalances.length > 0) {
                for (uint i = 0; i < bidderState.tokenBalances.length; i++) {
                    uint256 tokenBid = bidderState.tokenBalances[i].value;
                    if (tokenBid > 0) {
                        bidderState.tokenBalances[i].value = 0;
                        sent = Auction(msg.sender).sendTokens(bidderState.tokenBalances[i].token, wallet, tokenBid);
                        require(sent);
                        FinalizedTokenTransfer(msg.sender, bidderState.tokenBalances[i].token, tokenBid);
                    }
                }
                bidderState.tokensBalanceInEther = 0;
            } else {
                require(tokensBalanceInEther == 0);
            }
            
            uint256 etherBid = bidderState.etherBalance;
            if (etherBid > 0) {
                bidderState.etherBalance = 0;
                sent = Auction(msg.sender).sendEther(wallet, etherBid);
                require(sent);
                FinalizedEtherTransfer(msg.sender, etherBid);
            }
        }

        auctionState.finalized = true;
        Finalized(msg.sender, auctionState.highestBidder, auctionState.highestManagedBidder, auctionState.highestBid);
        return true;
    }

    function cancel()
        // onlyActive - inline check to reuse auctionState variable
        public
        returns (bool success)
    {
        ActionState storage auctionState = auctionStates[msg.sender];
        // same as onlyActive modifier, but we already have a variable here
        require (now < auctionState.endSeconds && !auctionState.cancelled);

        auctionState.cancelled = true;
        Cancelled(msg.sender);
        return true;
    }

}


contract Auction {

    AuctionHub public owner;

    modifier onlyOwner {
        require(owner == msg.sender);
        _;
    }

    modifier onlyBot {
        require(owner.isBot(msg.sender));
        _;
    }

    modifier onlyNotBot {
        require(!owner.isBot(msg.sender));
        _;
    }

    function Auction(
        address _owner
    ) 
        public 
    {
        require(_owner != address(0x0));
        owner = AuctionHub(_owner);
    }

    function () 
        payable
        public
    {
        owner.bid(msg.sender, msg.value, 0x0, 0);
    }

    function bid(address _token, uint256 _tokensNumber)
        payable
        public
        returns (bool isHighest)
    {
        if (_token != 0x0 && _tokensNumber > 0) {
            require(ERC20Basic(_token).transferFrom(msg.sender, this, _tokensNumber));
        }
        return owner.bid(msg.sender, msg.value, _token, _tokensNumber);
    }

    function managedBid(uint64 _managedBidder, uint256 _managedBid)
        onlyBot
        public
        returns (bool isHighest)
    {
        return owner.managedBid(_managedBidder, _managedBid, 0x0);
    }

    function managedBid2(uint64 _managedBidder, uint256 _managedBid, address _knownManagedBidder)
        onlyBot
        public
        returns (bool isHighest)
    {
        return owner.managedBid(_managedBidder, _managedBid, _knownManagedBidder);
    }

    function sendTokens(address _token, address _to, uint256 _amount)
        onlyOwner
        public
        returns (bool)
    {
        return ERC20Basic(_token).transfer(_to, _amount);
    }

    function sendEther(address _to, uint256 _amount)
        onlyOwner
        public
        returns (bool)
    {
        return _to.send(_amount);
    }

    function withdraw()
        public
        returns (bool success)
    {
        return owner.withdraw(msg.sender);
    }

    function finalize()
        onlyBot
        public
        returns (bool)
    {
        return owner.finalize();
    }

    function cancel()
        onlyBot
        public
        returns (bool success)
    {
        return  owner.cancel();
    }

    function totalDirectBid(address _bidder)
        public
        view
        returns (uint256)
    {
        return owner.totalDirectBid(this, _bidder);
    }

    function maxTokenBidInEther()
        public
        view
        returns (uint256)
    {
        var (,maxTokenBidInEther,,,,,,,,) = owner.auctionStates(this);
        return maxTokenBidInEther;
    }

    function endSeconds()
        public
        view
        returns (uint256)
    {
        var (endSeconds,,,,,,,,,) = owner.auctionStates(this);
        return endSeconds;
    }

    function item()
        public
        view
        returns (string)
    {
        var (,,,,,,,,,item) = owner.auctionStates(this);
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = item[i];
            }
        return string(bytesArray);
    }

    function minPrice()
        public
        view
        returns (uint256)
    {
        var (,,minPrice,,,,,,,) = owner.auctionStates(this);
        return minPrice;
    }

    function cancelled()
        public
        view
        returns (bool)
    {
        var (,,,,,,cancelled,,,) = owner.auctionStates(this);
        return cancelled;
    }

    function finalized()
        public
        view
        returns (bool)
    {
        var (,,,,,,,finalized,,) = owner.auctionStates(this);
        return finalized;
    }

    function highestBid()
        public
        view
        returns (uint256)
    {
        var (,,,highestBid,,,,,,) = owner.auctionStates(this);
        return highestBid;
    }

    function highestBidder()
        public
        view
        returns (address)
    {
        var (,,,,highestBidder,,,,,) = owner.auctionStates(this);
        return highestBidder;
    }

    function highestManagedBidder()
        public
        view
        returns (uint64)
    {
        var (,,,,,highestManagedBidder,,,,) = owner.auctionStates(this);
        return highestManagedBidder;
    }

    function allowManagedBids()
        public
        view
        returns (bool)
    {
        var (,,,,,,allowManagedBids,,,) = owner.auctionStates(this);
        return allowManagedBids;
    }


    // mapping(address => uint256) public etherBalances;
    // mapping(address => uint256) public tokenBalances;
    // mapping(address => uint256) public tokenBalancesInEther;
    // mapping(address => uint256) public managedBids;
    
    // bool allowManagedBids;
}
