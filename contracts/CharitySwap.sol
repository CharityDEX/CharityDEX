//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;
pragma abicoder v2;

import "./swaprouter/SwapRouter02.sol";
import "@uniswap/v3-periphery/contracts/interfaces/external/IWETH9.sol";
import "@uniswap/v3-periphery/contracts/libraries/Path.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ICharity.sol";

contract CharitySwap is V3SwapRouter, SwapRouter02 {
    using Path for bytes;

    uint constant public PRECISION = 1000000;
    uint24 constant public WETH_CONVERSION_FEE = 3000;

    ICharity public charity;
    uint public charityFee;

    constructor(
        address _factoryV2,
        address factoryV3,
        address _positionManager,
        address _WETH9,
        ICharity _charity,
        uint _charityFee
    ) SwapRouter02(_factoryV2, factoryV3, _positionManager, _WETH9) {
        charity = _charity;
        charityFee = _charityFee;
    }

    /// @notice Swaps `amountIn` of one token for as much as possible of another token
    /// @param params The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata
    /// @return amountOut The amount of the received token
    function _exactInputSingle(ExactInputSingleParams memory params)
        internal
        override
        returns (uint256 amountOut)
    {
        IERC20 tokenIn = IERC20(params.tokenIn);
        uint256 amountIn = params.amountIn;

        tokenIn.transferFrom(msg.sender, address(this), params.amountIn);

        uint256 amountToDonate = (params.amountIn * charityFee) / PRECISION;
        uint256 adjustedAmountIn = amountIn - amountToDonate;

        _donateToken(address(tokenIn), amountToDonate);

        params.amountIn = adjustedAmountIn;
        return super._exactInputSingle(params);
    }

    /// @notice Swaps `amountIn` of one token for as much as possible of another along the specified path
    /// @param params The parameters necessary for the multi-hop swap, encoded as `ExactInputParams` in calldata
    /// @return amountOut The amount of the received token
    function _exactInput(ExactInputParams memory params)
        internal
        override
        returns (uint256 amountOut)
    {
        (address tokenInAddress,,) = params.path.decodeFirstPool();
        IERC20 tokenIn = IERC20(tokenInAddress);
        uint256 amountIn = params.amountIn;

        tokenIn.transferFrom(msg.sender, address(this), params.amountIn);

        uint256 amountToDonate = (params.amountIn * charityFee) / PRECISION;
        uint256 adjustedAmountIn = amountIn - amountToDonate;

        _donateToken(address(tokenIn), amountToDonate);

        params.amountIn = adjustedAmountIn;
        return super._exactInput(params);
    }

    /// @notice Swaps as little as possible of one token for `amountOut` of another token
    /// @param params The parameters necessary for the swap, encoded as `ExactOutputSingleParams` in calldata
    /// @return amountIn The amount of the input token
    function _exactOutputSingle(ExactOutputSingleParams memory params)
        internal
        override
        returns (uint256 amountIn)
    {
        IERC20 tokenIn = IERC20(params.tokenIn);
        
        uint256 msgSenderBalance = tokenIn.balanceOf(msg.sender);
        tokenIn.transferFrom(msg.sender, address(this), msgSenderBalance);

        uint256 amountOut = params.amountOut;
        uint256 amountToDonate = (params.amountOut * charityFee) / PRECISION;
        uint256 adjustedAmountOut = amountOut + amountToDonate;

        address recipient = params.recipient;

        params.amountOut = adjustedAmountOut;
        params.recipient = address(this);
        super._exactOutputSingle(params);

        address tokenOut = params.tokenOut;
        _donateToken(tokenOut, amountToDonate);

        _returnTokens(tokenIn, msg.sender);
        _returnTokens(IERC20(tokenOut), recipient);

        return msgSenderBalance = tokenIn.balanceOf(msg.sender);
    }

    /// @notice Swaps as little as possible of one token for `amountOut` of another along the specified path (reversed)
    /// @param params The parameters necessary for the multi-hop swap, encoded as `ExactOutputParams` in calldata
    /// @return amountIn The amount of the input token
    function _exactOutput(ExactOutputParams memory params)
        internal
        override
        returns (uint256 amountIn)
    {
        (address tokenInAddress,,) = params.path.decodeFirstPool();
        IERC20 tokenIn = IERC20(tokenInAddress);
        
        uint256 msgSenderBalance = tokenIn.balanceOf(msg.sender);
        tokenIn.transferFrom(msg.sender, address(this), msgSenderBalance);

        uint256 amountOut = params.amountOut;
        uint256 amountToDonate = (params.amountOut * charityFee) / PRECISION;
        uint256 adjustedAmountOut = amountOut + amountToDonate;

        address recipient = params.recipient;

        params.amountOut = adjustedAmountOut;
        params.recipient = address(this);
        super._exactOutput(params);

        address tokenOut = _getTokenOut(params.path);
        _donateToken(tokenOut, amountToDonate);

        _returnTokens(tokenIn, msg.sender);
        _returnTokens(IERC20(tokenOut), recipient);

        return msgSenderBalance = tokenIn.balanceOf(msg.sender);
    }

    function _donateToken(address token, uint amount) private {
        if (token == WETH9) {
            IWETH9(WETH9).withdraw(amount);
        } else {
            _swapForWeth(token, amount);
            uint wethBalance = IWETH9(WETH9).balanceOf(address(this));
            IWETH9(WETH9).withdraw(wethBalance);
        }

        uint ethBalance = address(this).balance;
        charity.donate{value:ethBalance}();
    }

    function _swapForWeth(address token, uint amount) private {
        super._exactInputSingle(
            ExactInputSingleParams(
                token,
                WETH9,
                WETH_CONVERSION_FEE,
                address(this),
                amount,
                0,
                0
            )
        );
    }

    function _returnTokens(IERC20 token, address to) private {
        uint balance = token.balanceOf(address(this));
        token.transfer(to, balance);
    }

    function _getTokenOut(bytes memory path) private returns (address tokenOut) {
        if (path.hasMultiplePools()) {
            return _getTokenOut(path.skipToken());
        } else {
            (, tokenOut,) = path.decodeFirstPool();
            return tokenOut;
        }
    }
}
