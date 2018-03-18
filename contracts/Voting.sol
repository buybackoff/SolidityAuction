pragma solidity ^0.4.18;

import 'soltsice/contracts/BotManageable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract ERC20Basic {
    function totalSupply() public view returns (uint256);
    
}

contract VotingHub is BotManageable {
    using SafeMath for uint256;

    uint256 constant MASK32 = (2**32 - 1);
    uint256 constant ADDRESS_OFFSET = 96;

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
        string[] choices;
        uint256[] totalVotes;
        uint256 endSeconds;
        address lastVoter;
        uint32 choiceCount; // TODO check in CreateVoting
        bool cancelled;
        bool finalized;
    }

    TokenRate[] public tokenRates;
    
    mapping(address => VotingState) public votingStates;

    event TokenRateUpdate(address indexed token, uint256 rate);
    event Vote(address indexed voting, address voter, uint256 choice);

    function VotingHub 
        (address _wallet, address[] _tokens, uint256[] _rates, uint256[] _decimals, bool allowManagedVotes)
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
            tokenRates.push(TokenRate(token, _rates[i], _decimals[i]));
            TokenRateUpdate(token, _rates[i]);
        }
    }

    function voteForInternal(address _voting, address _voter, uint256 _choice)
        // onlyActive - inline check to reuse votingState variable
        private
        returns (bool status)
    {
        require(_voting != 0x0);

        VotingState storage votingState = votingStates[_voting];
        // same as onlyActive modifier, but we already have a variable here
        require (now < votingState.endSeconds && !votingState.cancelled);

        // choiceCount must be already checked to be a reasonable small number (or at least MASK32 - 1)
        require(_choice < votingState.choiceCount);

        uint256 vote = votingState.addressVotes[_voter];

        // a new vote
        if (vote == 0x0) {
            // increment stored choice by 1 to be able to detect empty mapping field later
            vote = (votingState.lastVoter << ADDRESS_OFFSET) | ((_choice + 1) & MASK32);
            votingState.lastVoter = _voter;
        } else {
            // clear last choice but keep previous voter unchanged
            vote = (vote & ~MASK32) | ((_choice + 1) & MASK32);
        }
        
        votingState.addressVotes[_voter] = vote;

        Vote(_voting, _voter, _choice);

        return true;
    }

    function voteFor(address _voting, address _voter, uint256 _choice)
        external
        onlyBot
        returns (bool status)
    {
        require(_voter != 0x0);
        return voteForInternal(_voting, _voter, _choice);
    }

    function vote(address _voting, uint256 _choice)
        // onlyActive - inline check to reuse votingState variable
        external
        returns (bool status)
    {
        return voteForInternal(_voting, msg.sender, _choice);
    }

    function getLastVoter(address _voting)
        public
        view
        returns (address lastVoter)
    {
        VotingState storage votingState = votingStates[_voting];
        return votingState.lastVoter;
    }


    function getVotes(address _voting)
        public
        view
        returns (uint256[] votes, address lastVoter)
    {
        VotingState storage votingState = votingStates[_voting];
        return getVotes(_voting, votingState.lastVoter);
    }

    function getVotes(address _voting, address _from)
        public
        view
        returns (uint256[] votes, address lastVoter)
    {
        require(_voting != 0x0);
        require(_from != 0x0);

        VotingState storage votingState = votingStates[_voting];

        address voter = _from; //  votingState.lastVoter;

        uint256[] memory totalVotes = new uint256[](votingState.choices.length);

        uint256 vote = votingState.addressVotes[voter];
        uint256 choice = vote & MASK32;
        
        // copy the array to memory for further multiple accesses
        TokenRate[] memory tokenRatesMem = tokenRates;

        // the very first vote should have choice > 0 (but prevVoter is zero)
        while (choice != 0) {
            // votes accumulator for this voter
            uint256 totalVote = 0;

            // iterate over all tokens that participate in the voting
            for (uint i = 0; i < tokenRatesMem.length; i++) {
                TokenRate memory tr = tokenRatesMem[i];
                totalVote = totalVote + (ERC20Basic(tr.token).totalSupply()).mul(tr.value).div(tr.decimals);
            }
            totalVotes[choice - 1].add(totalVote);

            // go to previous voter
            voter = address(vote >> ADDRESS_OFFSET);
            // if prevVoter is zero then we have reached the first voter
            if (voter == 0x0) {
                break;
            }

            vote = votingState.addressVotes[voter];
            choice = vote & MASK32;
        }

        return (totalVotes, voter);
    }
}