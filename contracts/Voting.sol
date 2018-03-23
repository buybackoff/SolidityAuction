pragma solidity ^0.4.18;

import 'soltsice/contracts/BotManageable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract ERC20Basic {
    function balanceOf(address who) public view returns (uint256);
}

contract VotingHub is BotManageable {
    using SafeMath for uint256;

    uint256 constant MASK32 = (2**32 - 1);
    uint256 constant ADDRESS_OFFSET = 96;
    uint256 private votingsCount;

    struct TokenRate {
        address token;
        uint256 value;
        uint256 decimals;
    }

    // We cannot iterate over a mapping, but given that we need to store only a single number (usually a byte)
    // and the word size is 32 bytes, we have enough space to store previous voter address (20 bytes)
    // and form a linked list to iterate all votes backward. Will need a single SSTORE (5k)
    // This is a lyaout of uint256 storage for vote
    // struct VoteLayout {
    //     address prevVoter;
    //     uint32 padding1;
    //     uint32 padding2;
    //     uint32 choice;
    // }

    struct VotingState {
        // current vote by address, see VoteLayout above
        mapping(address => uint256) addressVotes;
        bytes32[] choices;
        // uint256[] totalVotes; // TODO delete, not needed if we could read at block
        uint256 choiceCount; // TODO check in CreateVoting
        uint256 endSeconds;
        uint256 minimumVotes;
        address lastVoter;
        // bool cancelled;
        // bool finalized;
        string description;
        
    }

    TokenRate[] public tokenRates;
    
    mapping(uint256 => VotingState) private votingStates;

    event TokenRateUpdate(address indexed token, uint256 rate);
    event Vote(uint256 indexed voting, address voter, uint256 choice);
    event NewVoting(uint256 indexed voting, string description);

    function VotingHub 
        (address _wallet, address[] _tokens, uint256[] _rates, uint256[] _decimals)
        public
        BotManageable(_wallet)
    {
        // make sender a bot to avoid an additional step, this depends on implementation detail of BotManageable
        botsStartEndTime[msg.sender] = uint128(now) << 64;

        require(_tokens.length == _rates.length);
        require(_tokens.length == _decimals.length);

        // save initial token list
        for (uint256 i = 0; i < _tokens.length; i++) {
            require(_tokens[i] != 0x0);
            require(_rates[i] > 0);
            ERC20Basic token = ERC20Basic(_tokens[i]);
            tokenRates.push(TokenRate(token, _rates[i], _decimals[i]));
            TokenRateUpdate(token, _rates[i]);
        }
    }

    function createVoting(
        uint256 _endSeconds, 
        string _description,
        bytes32[] _choices,
        uint256 _minimumVotes
    )
        onlyBot
        public
        returns (uint256)
    {
        require (_endSeconds > now);

        votingsCount += 1;

        VotingState storage votingState = votingStates[votingsCount];

        votingState.endSeconds = _endSeconds;
        votingState.description = _description;
        votingState.minimumVotes = _minimumVotes;
        votingState.choices = _choices;

        votingState.choiceCount = _choices.length;

        NewVoting(votingsCount, _description);
        return votingsCount;
    }

    function vote(uint256 _voting, uint256 _choice)
        external
        returns (bool status)
    {
        require(_voting != 0x0);

        VotingState storage votingState = votingStates[_voting];
        require (now < votingState.endSeconds);

        // choiceCount must be already checked to be a reasonable small number (or at least MASK32 - 1)
        require(_choice < votingState.choiceCount);

        uint256 vote = votingState.addressVotes[msg.sender];

        // a new vote
        if (vote == 0x0) {
            // increment stored choice by 1 to be able to detect empty mapping field later
            vote = (uint256(votingState.lastVoter) << ADDRESS_OFFSET) | ((_choice + 1) & MASK32);
            votingState.lastVoter = msg.sender;
        } else {
            // clear last choice but keep previous voter unchanged
            vote = (vote & ~MASK32) | ((_choice + 1) & MASK32);
        }
        
        votingState.addressVotes[msg.sender] = vote;

        Vote(_voting, msg.sender, _choice);

        return true;
    }

    function getVotingsCount()
        public
        view
        returns (uint256)
    {
        return votingsCount;
    }

    function getLastVoter(uint256 _voting)
        public
        view
        returns (address lastVoter)
    {
        VotingState storage votingState = votingStates[_voting];
        return votingState.lastVoter;
    }

    function getDescription(uint256 _voting)
        public
        view
        returns (string description)
    {
        VotingState storage votingState = votingStates[_voting];
        return votingState.description;
    }

    function getEndSeconds(uint256 _voting)
        public
        view
        returns (uint256 description)
    {
        VotingState storage votingState = votingStates[_voting];
        return votingState.endSeconds;
    }

    function getRemainingSeconds(uint256 _voting)
        public
        view
        returns (uint256 description)
    {
        VotingState storage votingState = votingStates[_voting];
        return now > votingState.endSeconds ? now - votingState.endSeconds : 0;
    }

    function getVote(uint256 _voting, address _voter)
        public
        view
        returns (uint256 choices)
    {
        VotingState storage votingState = votingStates[_voting];
        uint256 vote = votingState.addressVotes[_voter];
        return vote;
    }

    function getChoices(uint256 _voting)
        public
        view
        returns (bytes32[] choices)
    {
        VotingState storage votingState = votingStates[_voting];
        return votingState.choices;
    }

    function getMinimumVotes(uint256 _voting)
        public
        view
        returns (uint256 minimumVotes)
    {
        VotingState storage votingState = votingStates[_voting];
        return votingState.minimumVotes;
    }

    function getVotes(uint256 _voting)
        public
        view
        returns (uint256[] votes, address lastVoter, uint256 remainingGas)
    {
        return getVotesFrom(_voting, getLastVoter(_voting));
    }

    // NB Avoid overloads for easier typed access via Soltsice, use a different name
    function getVotesFrom(uint256 _voting, address _from)
        public
        view
        returns (uint256[] votes, address lastVoter, uint256 remainingGas)
    {
        // NB votingCount starts from 1
        require(_voting != 0x0);
        require(_from != 0x0);

        VotingState storage votingState = votingStates[_voting];

        uint256[] memory totalVotes = new uint256[](votingState.choiceCount);
        address voter = _from;

        // placing in memory save c.50% gas
        TokenRate[] memory tokenRatesMem = tokenRates;
        uint256 tokenCount = tokenRatesMem.length;

        uint256 vote = votingState.addressVotes[voter];
        uint256 choice = vote & MASK32;

        // TODO (review) if we cannot iterate at least once then output is meaningless
        // duplicate condition, review
        require(choice != 0 && msg.gas > 20000);

        // the very first vote should have choice > 0 (but prevVoter is zero)
        // remainig gas msut be enough for the next loop interation
        while (choice != 0 && msg.gas > 20000) {
            uint256 totalVote = 0;
            // iterate over all tokens that participate in the voting
            for (uint i = 0; i < tokenCount; i++) {
                // This line costs c.7k per iteration
                totalVote += (ERC20Basic(tokenRatesMem[i].token).balanceOf(voter)).mul(tokenRatesMem[i].value).div(10 ** tokenRatesMem[i].decimals);  
            }
            totalVotes[choice - 1] = totalVotes[choice - 1].add(totalVote);
            // go to previous voter
            voter = address(vote >> ADDRESS_OFFSET);
            // if prevVoter is zero then we have reached the first voter
            if (voter == 0x0) {
                // NB yes we could use break instead... and hope we know which loop we are exiting :)
                choice = 0;
            } else {
                vote = votingState.addressVotes[voter];
                choice = vote & MASK32;
            }
        }

        return (totalVotes, voter, msg.gas);
    }
}
