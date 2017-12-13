// ACE Token is a first token of TokenStars platform
// Copyright (c) 2017 TokenStars
// Made by Aler Denisov
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/token/MintableToken.sol';

contract AceToken is MintableToken {
    using SafeMath for uint256;
    
    // ERC20 constants
    string public constant name = "ACE Token";
    string public constant symbol = "ACE";
    uint public constant decimals = 0;

    // Minting constants
    uint256 public constant MAXSOLD_SUPPLY = 99000000;
    uint256 public constant HARDCAPPED_SUPPLY = 165000000;

    uint256 public investorSupply = 0;
    uint256 public extraSupply = 0;
    uint256 public freeToExtraMinting = 0;

    uint256 public constant DISTRIBUTION_INVESTORS = 60;
    uint256 public constant DISTRIBUTION_TEAM      = 20;
    uint256 public constant DISTRIBUTION_COMMUNITY = 20;

    address public teamTokensHolder;
    address public communityTokensHolder;

    // Transfer rules
    bool public transferAllowed = true;
    mapping (address=>bool) public specialAllowed;

    // Transfer rules events
    event ToggleTransferAllowance(bool state);
    event ToggleTransferAllowanceFor(address indexed who, bool state);

    // Holders events
    event ChangeCommunityHolder(address indexed from, address indexed to);
    event ChangeTeamHolder(address indexed from, address indexed to);

    /**
    * @dev check transfer is allowed
    */
    modifier allowTransfer() {
        require(transferAllowed || specialAllowed[msg.sender]);
        _;
    }

    function AceToken() {
      teamTokensHolder = msg.sender;
      communityTokensHolder = msg.sender;

      ChangeTeamHolder(0x0, teamTokensHolder);
      ChangeCommunityHolder(0x0, communityTokensHolder);
    }

    /**
    * @dev change team tokens holder
    * @param _tokenHolder The address of next team tokens holder
    */
    function setTeamTokensHolder(address _tokenHolder) onlyOwner returns (bool) {
      require(_tokenHolder != 0);
      address temporaryEventAddress = teamTokensHolder;
      teamTokensHolder = _tokenHolder;
      ChangeTeamHolder(temporaryEventAddress, teamTokensHolder);
      return true;
    }

    /**
    * @dev change community tokens holder
    * @param _tokenHolder The address of next community tokens holder
    */
    function setCommunityTokensHolder(address _tokenHolder) onlyOwner returns (bool) {
      require(_tokenHolder != 0);
      address temporaryEventAddress = communityTokensHolder;
      communityTokensHolder = _tokenHolder;
      ChangeCommunityHolder(temporaryEventAddress, communityTokensHolder);
      return true;
    }

    /**
    * @dev Doesn't allow to send funds on contract!
    */
    function () payable {
        require(false);
    }

    function currentOwner() constant public returns (address) {
      return owner;
    }

    /**
    * @dev transfer token for a specified address if transfer is open
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function transfer(address _to, uint256 _value) allowTransfer returns (bool) {
        return super.transfer(_to, _value);
    }

    
    /**
    * @dev Transfer tokens from one address to another if transfer is open
    * @param _from address The address which you want to send tokens from
    * @param _to address The address which you want to transfer to
    * @param _value uint256 the amount of tokens to be transferred
     */
    function transferFrom(address _from, address _to, uint256 _value) allowTransfer returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    /**
    * @dev Change current state of transfer allowence to opposite
     */
    function toggleTransfer() onlyOwner returns (bool) {
        transferAllowed = !transferAllowed;
        ToggleTransferAllowance(transferAllowed);
        return transferAllowed;
    }

    /**
    * @dev allow transfer for the given address against global rules
    * @param _for addres The address of special allowed transfer (required for smart contracts)
     */
    function toggleTransferFor(address _for) onlyOwner returns (bool) {
        specialAllowed[_for] = !specialAllowed[_for];
        ToggleTransferAllowanceFor(_for, specialAllowed[_for]);
        return specialAllowed[_for];
    }

    /**
    * @dev Function to mint tokens for investor
    * @param _to The address that will receive the minted tokens.
    * @param _amount The amount of tokens to emit.
    * @return A boolean that indicates if the operation was successful.
    */
    function mint(address _to, uint256 _amount) onlyOwner canMint returns (bool) {
        require(_amount > 0);
        totalSupply = totalSupply.add(_amount);
        investorSupply = investorSupply.add(_amount);
        freeToExtraMinting = freeToExtraMinting.add(_amount);

        // Prevent to emit more than sale hardcap!
        assert(investorSupply <= MAXSOLD_SUPPLY);
        assert(totalSupply <= HARDCAPPED_SUPPLY);

        balances[_to] = balances[_to].add(_amount);
        Mint(_to, _amount);
        Transfer(address(this), _to, _amount);
        return true;
    }

    function extraMint() onlyOwner canMint returns (bool) {
      require(freeToExtraMinting > 0);

      uint256 onePercent = freeToExtraMinting / DISTRIBUTION_INVESTORS;
      uint256 teamPart = onePercent * DISTRIBUTION_TEAM;
      uint256 communityPart = onePercent * DISTRIBUTION_COMMUNITY;
      uint256 extraTokens = teamPart.add(communityPart);

      totalSupply = totalSupply.add(extraTokens);
      extraSupply = extraSupply.add(extraTokens);

      uint256 leftToNextMinting = freeToExtraMinting % DISTRIBUTION_INVESTORS;
      freeToExtraMinting = leftToNextMinting;

      assert(totalSupply <= HARDCAPPED_SUPPLY);
      assert(extraSupply <= HARDCAPPED_SUPPLY.sub(MAXSOLD_SUPPLY));

      balances[teamTokensHolder] = balances[teamTokensHolder].add(teamPart);
      balances[communityTokensHolder] = balances[communityTokensHolder].add(communityPart);

      Mint(teamTokensHolder, teamPart);
      Transfer(address(this), teamTokensHolder, teamPart);
      Mint(communityTokensHolder, communityPart);
      Transfer(address(this), communityTokensHolder, communityPart);

      return true;
    }

    /**
    * @dev Increase approved amount to spend 
    * @param _spender The address which will spend the funds.
    * @param _addedValue The amount of tokens to increase already approved amount. 
     */
    function increaseApproval (address _spender, uint _addedValue) returns (bool success) {
        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
        Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }

    /**
    * @dev Decrease approved amount to spend 
    * @param _spender The address which will spend the funds.
    * @param _subtractedValue The amount of tokens to decrease already approved amount. 
     */
    function decreaseApproval (address _spender, uint _subtractedValue) returns (bool success) {
        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;
    }
}