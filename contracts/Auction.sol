pragma solidity ^0.4.18;

contract ERC20Basic {
    function transferFrom(address from, address to, uint256 value) public returns (bool);
    function transfer(address to, uint256 value) public returns (bool);
}

contract Auction {

    ERC20Basic public token;
    uint256 weiPerToken;
    uint256 maxTokens;

    address public owner;
    address public wallet;

    uint256 public endSeconds;

    string public item;
    uint256 public minPrice;

    bool public cancelled;
    bool public finalized;

    uint256 public highestBid;
    address public highestBidder;
    uint64 public highestManagedBidder;

    mapping(address => uint256) public etherBalances;
    mapping(address => uint256) public tokenBalances;
    mapping(address => uint256) public tokenBalancesInEther;
    mapping(address => uint256) public managedBids;
    
    bool allowManagedBids;

    // bool ownerHasWithdrawn;

    event Bid(address indexed bidder, uint256 indexed totalBidInEther, uint256 indexed tokensBid);
    event ManagedBid(uint64 indexed bidder, uint256 indexed bid);
    event ManagedBid2(uint64 indexed bidder, uint256 indexed bid, address indexed knownManagedBidder);
    event NewHighestBidder(address indexed bidder, uint64 indexed managedBidder, uint256 indexed bid);
    event NewHighestBidder2(address indexed bidder, uint256 indexed bid, uint256 indexed managedBid);
    event Withdrawal(address indexed withdrawer, uint256 indexed etherAmount, uint256 indexed tokensAmount);
    event Finalized(address indexed bidder, uint64 indexed managedBidder, uint256 indexed amount);
    event FinalizedTokenTransfer(uint256 indexed tokensAmount);
    event FinalizedEtherTransfer(uint256 indexed etherAmount);

    event ExtendedEndTime(uint256 indexed newEndtime);
    event Cancelled();

    modifier onlyOwner {
        require (msg.sender == owner);
        _;
    }

    modifier onlyNotOwner {
        require (msg.sender != owner);
        _;
    }

    modifier onlyBeforeEnd {
        require (now < endSeconds);
        _;
    }

    modifier onlyAfterEnd {
        require (now > endSeconds);
        _;
    }

    modifier onlyNotCancelled {
        require (!cancelled);
        _;
    }

    modifier onlyAllowedManagedBids {
        require (allowManagedBids);
        _;
    }


    function Auction(
        address _owner, 
        address _wallet, 
        address _token,
        uint _endSeconds, 
        uint256 _weiPerToken, 
        uint256 _maxTokens,
        string _item,
        uint256 _minPrice,
        bool _allowManagedBids
    ) 
        public 
    {
        require(_owner != address(0x0));
        require(_wallet != address(0x0));
        require(_token != address(0x0));
        require (_endSeconds > now);
        require (_weiPerToken > (1e15) && _weiPerToken < (1e16));
        require(_maxTokens <= 1000);
        require(_minPrice > 0);
        
        owner = _owner;
        wallet = _wallet;
        token = ERC20Basic(_token);
        endSeconds = _endSeconds;
        weiPerToken = _weiPerToken;
        maxTokens = _maxTokens;
        item = _item;
        minPrice = _minPrice;
        allowManagedBids = _allowManagedBids;
    }


    function () 
        payable
        public
    {
        bid(0);
    }


    function bid(uint256 tokens)
        payable
        onlyBeforeEnd
        onlyNotCancelled
        onlyNotOwner
        public
        returns (bool success)
    {
        uint256 totalBid = tokenBalancesInEther[msg.sender];

        if (tokens > 0) {
            // sender must approve transfer before calling this function
            require(token.transferFrom(msg.sender, this, tokens));
            // safe math is already in transferFrom
            uint256 tokenBid = tokenBalances[msg.sender] + tokens;
            totalBid = totalBid + tokens * weiPerToken;
            require(tokenBid <= maxTokens);
            
            tokenBalances[msg.sender] = tokenBid;
            tokenBalancesInEther[msg.sender] = totalBid;
        } else {
            require(msg.value > 0);
        }

        uint256 etherBid = etherBalances[msg.sender] + msg.value;
        etherBalances[msg.sender] = etherBid;
        totalBid = totalBid + etherBid + managedBids[msg.sender];

        if (totalBid > highestBid && totalBid >= minPrice) {
            highestBid = totalBid;
            highestBidder = msg.sender;
            highestManagedBidder = 0;
            NewHighestBidder(highestBidder, highestManagedBidder, highestBid);
            if ((endSeconds - now) < 1800) {
                endSeconds = now + 1800;
                ExtendedEndTime(endSeconds);
            }
        }
        Bid(msg.sender, totalBid, tokens);
        return true;
    }

    function managedBid(uint64 _managedBidder, uint256 _managedBid)
        onlyBeforeEnd
        onlyNotCancelled
        onlyOwner
        onlyAllowedManagedBids
        public
        returns (bool success)
    {
        if (_managedBid > highestBid && _managedBid >= minPrice) {
            highestBid = _managedBid;
            highestBidder = address(0);
            highestManagedBidder = _managedBidder;
            NewHighestBidder(highestBidder, highestManagedBidder, highestBid);
            if ((endSeconds - now) < 1800) {
                endSeconds = now + 1800;
                ExtendedEndTime(endSeconds);
            }
        }
        ManagedBid(_managedBidder, _managedBid);
        return true;
    }

    function managedBid2(uint64 _managedBidder, uint256 _managedBid, address _knownManagedBidder)
        onlyBeforeEnd
        onlyNotCancelled
        onlyOwner
        onlyAllowedManagedBids
        public
        returns (bool success)
    {
        // NB: _managedBid is the total amount of all bids from backend
        // calculated without any direct bid. It is important to calculate direct bids
        // inside this transaction and make the _knownManagedBidder the highest
        // to prevent this wallet to withdraw money and remain the highest

        require(_knownManagedBidder != address(0));

        require(_managedBid > managedBids[_knownManagedBidder]);
        managedBids[_knownManagedBidder] = _managedBid;

        uint256 direct = totalDirectBid(_knownManagedBidder);
        uint256 totalBid = direct + _managedBid;
        if (totalBid > highestBid && totalBid >= minPrice) {
            highestBid = totalBid;
            highestBidder = _knownManagedBidder;
            highestManagedBidder = 0;
            NewHighestBidder2(highestBidder, highestBid, _managedBid);
            if ((endSeconds - now) < 1800) {
                endSeconds = now + 1800;
                ExtendedEndTime(endSeconds);
            }
        }
        ManagedBid2(_managedBidder, _managedBid, _knownManagedBidder);
        return true;
    }

    function totalDirectBid(address _address)
        constant
        public
        returns (uint256 _totalBid)
    {
        return tokenBalancesInEther[_address] + etherBalances[_address];
    }


    function setWeiPerToken(uint256 _weiPerToken)
        onlyBeforeEnd
        onlyNotCancelled
        onlyOwner
        public
    {
        require (_weiPerToken > (1e15) && _weiPerToken < 5 * (1e15));
        weiPerToken = _weiPerToken;
    }

    function withdraw()
        public
        returns (bool success)
    {
        // anyone could withdraw at any time except the highest bidder
        // if canceled, the highest bidder could withdraw as well
        require((msg.sender != highestBidder) || cancelled);

        uint256 tokenBid = tokenBalances[msg.sender];
        if (tokenBid > 0) {
            tokenBalances[msg.sender] = 0;
            require(token.transfer(msg.sender, tokenBid));
        }

        uint256 etherBid = etherBalances[msg.sender];
        if (etherBid > 0) {
            etherBalances[msg.sender] = 0;
            require(msg.sender.send(etherBid));
        }

        require(tokenBid > 0 || etherBid > 0);

        Withdrawal(msg.sender, etherBid, tokenBid);

        return true;
    }

    function finalize()
        onlyOwner
        onlyNotCancelled
        onlyAfterEnd
        public
        returns (bool)
    {
        require(!finalized);

        if (highestBidder != address(0)) {
            uint256 tokenBid = tokenBalances[highestBidder];
            if (tokenBid > 0) {
                tokenBalances[highestBidder] = 0;
                require(token.transfer(wallet, tokenBid));
                FinalizedTokenTransfer(tokenBid);
            }

            uint256 etherBid = etherBalances[highestBidder];
            if (etherBid > 0) {
                etherBalances[highestBidder] = 0;
                require(wallet.send(etherBid));
                FinalizedEtherTransfer(etherBid);
            }

            require(tokenBid > 0 || etherBid > 0);

            // this condition could break after we have added ability to change the rate after ctor
            // and it won't be possible to set weiPerToken due to onlyAfterEnd/onlyBeforeEnd different modifiers
            // ... require(tokenBid * weiPerToken + etherBid == highestBid);
        }

        finalized = true;
        Finalized(highestBidder, highestManagedBidder, highestBid);
        return true;
    }

    function cancel()
        onlyOwner
        onlyBeforeEnd
        onlyNotCancelled
        public
        returns (bool success)
    {
        cancelled = true;
        Cancelled();
        return true;
    }
}


library AuctionFactory {

    event AuctionProduced(address indexed addr, string _item);

    function produce(
        address _wallet, 
        uint _endSeconds, 
        uint256 _weiPerToken, 
        uint256 _maxTokens, 
        string _item, 
        uint256 _minPrice, 
        bool _allowManagedBids
    )
        public
        returns (address)
    {
        address addr = new Auction(msg.sender, _wallet, 0x06147110022B768BA8F99A8f385df11a151A9cc8, _endSeconds, _weiPerToken, _maxTokens, _item, _minPrice, _allowManagedBids);
        AuctionProduced(addr, _item);
        return addr;
    }

    function produceForOwner(
        address _owner, 
        address _wallet, 
        uint _endSeconds, 
        uint256 _weiPerToken, 
        uint256 _maxTokens, 
        string _item, 
        uint256 _minPrice, 
        bool _allowManagedBids
    )
        public
        returns (address)
    {
        address addr = new Auction(_owner, _wallet, 0x06147110022B768BA8F99A8f385df11a151A9cc8, _endSeconds, _weiPerToken, _maxTokens, _item, _minPrice, _allowManagedBids);
        AuctionProduced(addr, _item);
        return addr;
    }

    // token for testing
    function produceForOwnerCustomToken(
        address _owner, 
        address _wallet, 
        address _token,
        uint _endSeconds, 
        uint256 _weiPerToken, 
        uint256 _maxTokens, 
        string _item, 
        uint256 _minPrice, 
        bool _allowManagedBids
    )
        public
        returns (address)
    {
        address addr = new Auction(_owner, _wallet, _token, _endSeconds, _weiPerToken, _maxTokens, _item, _minPrice, _allowManagedBids);
        AuctionProduced(addr, _item);
        return addr;
    }
}
