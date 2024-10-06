import { BaseQueryFn, createApi, SkipToken, skipToken } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import { Fraction, TradeType } from '@uniswap/sdk-core'
import { DONATION_FEE_PERCENT, ONE_HUNDRED_PERCENT } from 'constants/misc'
import ms from 'ms.macro'
import qs from 'qs'
import { isExactInput } from 'utils/tradeType'

import { serializeGetQuoteArgs } from './args'
import { GetQuoteArgs, GetQuoteResult, NO_ROUTE } from './types'

const protocols: Protocol[] = [Protocol.V2, Protocol.V3]

// routing API quote query params: https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/schema/quote-schema.ts
const DEFAULT_QUERY_PARAMS = {
  protocols: protocols.map((p) => p.toLowerCase()).join(','),
}

const baseQuery: BaseQueryFn<GetQuoteArgs, GetQuoteResult> = () => {
  return { error: { reason: 'Unimplemented baseQuery' } }
}

const addFeeToQuote = (args: GetQuoteArgs, quote: GetQuoteResult): GetQuoteResult => {
  if (typeof quote === 'string') {
    return quote
  }
  if (args.tradeType === TradeType.EXACT_INPUT) {
    quote.route = quote.route.map((route) => {
      const step = route.at(-1)
      if (step && step.amountOut) {
        const amount = new Fraction(step.amountOut)
        step.amountOut = amount.multiply(ONE_HUNDRED_PERCENT.subtract(DONATION_FEE_PERCENT)).toFixed(0)
      }
      return route
    })
  } else {
    quote.route = quote.route.map((route) => {
      const step = route.at(0)
      if (step && step.amountIn) {
        const amount = new Fraction(step.amountIn)
        step.amountIn = amount.divide(ONE_HUNDRED_PERCENT.subtract(DONATION_FEE_PERCENT)).toFixed(0)
      }
      return route
    })
  }
  return quote
}

export const routing = createApi({
  reducerPath: 'routing',
  baseQuery,
  serializeQueryArgs: serializeGetQuoteArgs,
  endpoints: (build) => ({
    getQuote: build.query({
      async queryFn(args: GetQuoteArgs | SkipToken) {
        if (args === skipToken) return { error: { status: 'CUSTOM_ERROR', error: 'Skipped' } }

        // If enabled, try routing API, falling back to client-side SOR.
        if (Boolean(args.routerUrl)) {
          // amount may be null to initialize the client-side SOR. This should be skipped for the server.
          if (args.amount === undefined) return { error: { status: 'CUSTOM_ERROR', error: 'Skipped' } }

          try {
            const { tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, tradeType } = args
            const type = isExactInput(tradeType) ? 'exactIn' : 'exactOut'
            const query = qs.stringify({
              ...DEFAULT_QUERY_PARAMS,
              tokenInAddress,
              tokenInChainId,
              tokenOutAddress,
              tokenOutChainId,
              amount,
              type,
            })
            const response = await global.fetch(`${args.routerUrl}quote?${query}`)
            if (!response.ok) {
              let data: string | Record<string, unknown> = await response.text()
              try {
                data = JSON.parse(data)
              } catch {}

              // NO_ROUTE should be treated as a valid response to prevent retries.
              if (typeof data === 'object' && data.errorCode === 'NO_ROUTE') {
                return { data: NO_ROUTE as GetQuoteResult }
              }

              throw data
            }

            const quote: GetQuoteResult = await response.json()
            return { data: addFeeToQuote(args, quote) }
          } catch (error) {
            console.warn(`GetQuote failed on routing API, falling back to client: ${error}`)
          }
        }

        // If integrator did not provide a routing API URL param, use clientside SOR
        try {
          // Lazy-load the client-side router to improve initial pageload times.
          const clientSideSmartOrderRouter = await import('../../hooks/routing/clientSideSmartOrderRouter')
          const quote = await clientSideSmartOrderRouter.getClientSideQuote(args, { protocols })
          return { data: addFeeToQuote(args, quote) }
        } catch (error) {
          console.warn(`GetQuote failed on client: ${error}`)
          return { error: { status: 'CUSTOM_ERROR', error: error.message } }
        }
      },
      keepUnusedDataFor: ms`10s`,
    }),
  }),
})

export const { useLazyGetQuoteQuery } = routing
export const useGetQuoteQueryState = routing.endpoints.getQuote.useQueryState
