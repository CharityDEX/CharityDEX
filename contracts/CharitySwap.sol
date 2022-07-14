//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;
pragma abicoder v2;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/external/IWETH9.sol";
import "@uniswap/v3-periphery/contracts/libraries/Path.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ICharity.sol";

contract CharitySwap {
    using Path for bytes;

    uint constant public PRECISION = 1000000;
    uint24 constant public WETH_CONVERSION_FEE = 3000;

    ISwapRouter public swapRouter;
    IWETH9 public weth;
    ICharity public charity;
    uint public charityFee;

    constructor(ISwapRouter _swapRouter, IWETH9 _weth, ICharity _charity, uint _charityFee) {
        swapRouter = _swapRouter;
        charityFee = _charityFee;
        weth = _weth;
        charity = _charity;
    }

    /// @notice Swaps `amountIn` of one token for as much as possible of another token
    /// @param params The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata
    /// @return amountOut The amount of the received token
    function exactInputSingle(ISwapRouter.ExactInputSingleParams memory params)
        external
        payable
        returns (uint256 amountOut)
    {
        IERC20 tokenIn = IERC20(params.tokenIn);
        uint256 amountIn = params.amountIn;

        tokenIn.transferFrom(msg.sender, address(this), params.amountIn);
        tokenIn.approve(address(swapRouter), amountIn);

        uint256 amountToDonate = (params.amountIn * charityFee) / PRECISION;
        uint256 adjustedAmountIn = amountIn - amountToDonate;

        _donateToken(address(tokenIn), amountToDonate);

        params.amountIn = adjustedAmountIn;
        return swapRouter.exactInputSingle(params);
    }

    /// @notice Swaps `amountIn` of one token for as much as possible of another along the specified path
    /// @param params The parameters necessary for the multi-hop swap, encoded as `ExactInputParams` in calldata
    /// @return amountOut The amount of the received token
    function exactInput(ISwapRouter.ExactInputParams memory params)
        external
        payable
        returns (uint256 amountOut)
    {
        (address tokenInAddress,,) = params.path.decodeFirstPool();
        IERC20 tokenIn = IERC20(tokenInAddress);
        uint256 amountIn = params.amountIn;

        tokenIn.transferFrom(msg.sender, address(this), params.amountIn);
        tokenIn.approve(address(swapRouter), amountIn);

        uint256 amountToDonate = (params.amountIn * charityFee) / PRECISION;
        uint256 adjustedAmountIn = amountIn - amountToDonate;

        _donateToken(address(tokenIn), amountToDonate);

        params.amountIn = adjustedAmountIn;
        return swapRouter.exactInput(params);
    }

    /// @notice Swaps as little as possible of one token for `amountOut` of another token
    /// @param params The parameters necessary for the swap, encoded as `ExactOutputSingleParams` in calldata
    /// @return amountIn The amount of the input token
    function exactOutputSingle(ISwapRouter.ExactOutputSingleParams memory params)
        external
        payable
        returns (uint256 amountIn)
    {
        IERC20 tokenIn = IERC20(params.tokenIn);
        
        uint256 msgSenderBalance = tokenIn.balanceOf(msg.sender);
        tokenIn.transferFrom(msg.sender, address(this), msgSenderBalance);
        tokenIn.approve(address(swapRouter), msgSenderBalance);

        uint256 amountOut = params.amountOut;
        uint256 amountToDonate = (params.amountOut * charityFee) / PRECISION;
        uint256 adjustedAmountOut = amountOut + amountToDonate;

        address recipient = params.recipient;

        params.amountOut = adjustedAmountOut;
        params.recipient = address(this);
        swapRouter.exactOutputSingle(params);

        address tokenOut = params.tokenOut;
        _donateToken(tokenOut, amountToDonate);

        _returnTokens(tokenIn, msg.sender);
        _returnTokens(IERC20(tokenOut), recipient);

        return msgSenderBalance = tokenIn.balanceOf(msg.sender);
    }

    /// @notice Swaps as little as possible of one token for `amountOut` of another along the specified path (reversed)
    /// @param params The parameters necessary for the multi-hop swap, encoded as `ExactOutputParams` in calldata
    /// @return amountIn The amount of the input token
    function exactOutput(ISwapRouter.ExactOutputParams memory params)
        external
        payable
        returns (uint256 amountIn)
    {
        (address tokenInAddress,,) = params.path.decodeFirstPool();
        IERC20 tokenIn = IERC20(tokenInAddress);
        
        uint256 msgSenderBalance = tokenIn.balanceOf(msg.sender);
        tokenIn.transferFrom(msg.sender, address(this), msgSenderBalance);
        tokenIn.approve(address(swapRouter), msgSenderBalance);

        uint256 amountOut = params.amountOut;
        uint256 amountToDonate = (params.amountOut * charityFee) / PRECISION;
        uint256 adjustedAmountOut = amountOut + amountToDonate;

        address recipient = params.recipient;

        params.amountOut = adjustedAmountOut;
        params.recipient = address(this);
        swapRouter.exactOutput(params);

        address tokenOut = _getTokenOut(params.path);
        _donateToken(tokenOut, amountToDonate);

        _returnTokens(tokenIn, msg.sender);
        _returnTokens(IERC20(tokenOut), recipient);

        return msgSenderBalance = tokenIn.balanceOf(msg.sender);
    }

    function _donateToken(address token, uint amount) private {
        if (token == address(weth)) {
            weth.withdraw(amount);
        } else {
            _swapForWeth(token, amount);
            uint wethBalance = weth.balanceOf(address(this));
            weth.withdraw(wethBalance);
        }

        uint ethBalance = address(this).balance;
        charity.donate{value:ethBalance}();
    }

    function _swapForWeth(address token, uint amount) private {
        swapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams(
                token,
                address(weth),
                WETH_CONVERSION_FEE,
                address(this),
                block.timestamp,
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
