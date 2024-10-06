import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { DONATION_FEE_PERCENT } from 'constants/misc'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { currencyId } from 'utils/currencyId'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

export const useFormattedDonationFeeAmount = (amount: CurrencyAmount<Currency>): string | undefined => {
  const currency = amount.currency
  const fee = amount.multiply(DONATION_FEE_PERCENT)
  const feeUSD = useUSDCValue(fee)

  if (fee.greaterThan(0)) {
    let amount: string
    if (feeUSD != null) {
      const parsedFeeUSD = formatCurrencyAmount({ amount: feeUSD, isUsdPrice: true })
      amount = `~${parsedFeeUSD}`
    } else {
      const parsedFee = formatCurrencyAmount({ amount: fee })
      amount = `${parsedFee} ${currency.symbol || currencyId(currency)}`
    }
    return amount
  }

  return undefined
}
