pragma solidity ^0.4.18;

import './Auction.sol';

contract TokenStarsAuctionHub is AuctionHub {
    address public ACE = 0x06147110022B768BA8F99A8f385df11a151A9cc8;
    address public TEAM = 0x1c79ab32C66aCAa1e9E81952B8AAa581B43e54E7;
    address public wallet = 0x963dF7904cF180aB2C033CEAD0be8687289f05EC;
    address[] public tokens = [ACE, TEAM];
    uint256[] public rates = [1210993886902860, 1210993886902860];
    uint256[] public decimals = [0, 4];

    function TokenStarsAuctionHub()
        public
        AuctionHub(wallet, tokens, rates, decimals)
    {
    }

    function createAuction(
        address _wallet,
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

        Auction auction = new TokenStarsAuction(this);

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
}

contract TokenStarsAuctionHubMock is AuctionHub {
    uint256[] public rates = [2400000000000000, 2400000000000000];
    uint256[] public decimals = [0, 4];

    function TokenStarsAuctionHubMock(address _wallet, address[] _tokens)
        public
        AuctionHub(_wallet, _tokens, rates, decimals)
    {
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

        Auction auction = new TokenStarsAuction(this);

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
}

contract TokenStarsAuction is Auction {
        
    function TokenStarsAuction(
        address _owner) 
        public
        Auction(_owner)
    {
        
    }

    function bidAce(uint256 _tokensNumber)
        payable
        public
        returns (bool isHighest)
    {
        return super.bid(TokenStarsAuctionHub(owner).ACE(), _tokensNumber);
    }

    function bidTeam(uint256 _tokensNumber)
        payable
        public
        returns (bool isHighest)
    {
        return super.bid(TokenStarsAuctionHub(owner).TEAM(), _tokensNumber);
    }
}
