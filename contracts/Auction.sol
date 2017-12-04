pragma solidity ^0.4.18;

contract ERC20Basic {
    function transferFrom(address from, address to, uint256 value) public returns (bool);
    function transfer(address to, uint256 value) public returns (bool);
}

contract Auction {

    ERC20Basic public token;
    uint256 weiPerToken;

    address public owner;
    address public wallet;

    uint256 public startSeconds;
    uint256 public endSeconds;

    string public item;

    bool public canceled;
    bool public finalized;

    uint256 public highestBid;
    address public highestBidder;
    uint64 public highestManagedBidder;

    mapping(address => uint256) public etherBalances;
    mapping(address => uint256) public tokenBalances;
    
    bool allowManagedBids;

    // bool ownerHasWithdrawn;

    event Bid(address bidder, uint256 bid);
    event ManagedBid(uint64 bidder, uint256 bid);
    event Withdrawal(address withdrawer, uint256 etherAmount, uint256 tokensAmount);
    event Finalized(address bidder, uint64 managedBidder, uint256 amount);
    event Canceled();

    modifier onlyOwner {
        require (msg.sender == owner);
        _;
    }

    modifier onlyNotOwner {
        require (msg.sender != owner);
        _;
    }

    modifier onlyAfterStart {
        require (now >= startSeconds);
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

    modifier onlyNotCanceled {
        require (!canceled);
        _;
    }

    modifier onlyAllowedManagedBids {
        require (allowManagedBids);
        _;
    }


    function Auction(address _owner, address _wallet, address _token,
        uint _startSeconds, uint _endSeconds, 
        uint256 _weiPerToken, string _item, bool _allowManagedBids) 
        public 
    {
        require(_owner != address(0x0));
        require(_wallet != address(0x0));
        require(_token != address(0x0));
        require (_startSeconds < _endSeconds);
        require (_startSeconds >= now);
        require (_weiPerToken > (1e15) && _weiPerToken < 5 * (1e15));
        
        owner = _owner;
        wallet = _wallet;
        token = ERC20Basic(_token);
        startSeconds = _startSeconds;
        endSeconds = _endSeconds;
        weiPerToken = _weiPerToken;
        item = _item;
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
        onlyAfterStart
        onlyBeforeEnd
        onlyNotCanceled
        onlyNotOwner
        public
        returns (bool success)
    {
        uint256 totalBid;

        if (tokens > 0) {
            require(token.transferFrom(msg.sender, this, tokens));
            // safe math is already in transferFrom
            uint256 tokenBid = tokenBalances[msg.sender] + tokens;
            totalBid = tokenBid * weiPerToken;
            tokenBalances[msg.sender] = tokenBid;
        } else {
            require(msg.value > 0);
        }

        uint256 etherBid = etherBalances[msg.sender] + msg.value;
        etherBalances[msg.sender] = etherBid;
        totalBid = totalBid + etherBid;

        // revert if this bid won't become the highest one
        require(totalBid > highestBid);

        highestBid = totalBid;
        highestBidder = msg.sender;
        highestManagedBidder = 0;

        Bid(msg.sender, highestBid);
        return true;
    }


    function managedBid(uint64 managedBidder, uint256 managedBid)
        onlyAfterStart
        onlyBeforeEnd
        onlyNotCanceled
        onlyOwner
        onlyAllowedManagedBids
        public
        returns (bool success)
    {
        require(managedBid > highestBid);

        highestBid = managedBid;
        highestBidder = address(0);
        highestManagedBidder = managedBidder;

        ManagedBid(managedBidder, highestBid);
        return true;
    }

    function setWeiPerToken(uint256 _weiPerToken)
        onlyAfterStart
        onlyBeforeEnd
        onlyNotCanceled
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
        require(msg.sender != highestBidder || canceled);

        uint256 tokenBid = tokenBalances[msg.sender];
        if (tokenBid > 0) {
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


    function finalizeAuction()
        onlyOwner
        onlyNotCanceled
        onlyAfterEnd
        public
        returns (bool)
    {
        require(!finalized);

        if (highestBidder != address(0)) {
            uint256 tokenBid = tokenBalances[highestBidder];
            if (tokenBid > 0) {
                require(token.transfer(wallet, tokenBid));
            }

            uint256 etherBid = etherBalances[highestBidder];
            if (etherBid > 0) {
                etherBalances[highestBidder] = 0;
                require(wallet.send(etherBid));
            }

            require(tokenBid > 0 || etherBid > 0);

            require(tokenBid * weiPerToken + etherBid == highestBid);
        }

        finalized = true;
        Finalized(highestBidder, highestManagedBidder, highestBid);

        return true;
        
    }


    function cancelAuction()
        onlyOwner
        onlyBeforeEnd
        onlyNotCanceled
        public
        returns (bool success)
    {
        canceled = true;
        Canceled();
        return true;
    }
}


library AuctionFactory {

    event AuctionProduced(address indexed addr, string _item);

    function produce(address _wallet, 
        uint _startSeconds, uint _endSeconds, 
        uint256 _weiPerToken, string _item, bool _allowManagedBids)
        public
        returns (address)
    {
        address addr = new Auction(msg.sender, _wallet, 0x06147110022B768BA8F99A8f385df11a151A9cc8, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids);
        AuctionProduced(addr, _item);
        return addr;
    }

    function produceForOwner(address _owner, address _wallet, 
        uint _startSeconds, uint _endSeconds, 
        uint256 _weiPerToken, string _item, bool _allowManagedBids)
        public
        returns (address)
    {
        address addr = new Auction(_owner, _wallet, 0x06147110022B768BA8F99A8f385df11a151A9cc8, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids);
        AuctionProduced(addr, _item);
        return addr;
    }

    // token for testing
    function produceForOwnerCustomToken(address _owner, address _wallet, address _token,
        uint _startSeconds, uint _endSeconds, 
        uint256 _weiPerToken, string _item, bool _allowManagedBids)
        public
        returns (address)
    {
        address addr = new Auction(_owner, _wallet, _token, _startSeconds, _endSeconds, _weiPerToken, _item, _allowManagedBids);
        AuctionProduced(addr, _item);
        return addr;
    }
}
