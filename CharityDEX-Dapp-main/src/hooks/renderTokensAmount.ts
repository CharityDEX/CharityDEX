import { useEffect } from 'react';

import { useAccount, useContractRead } from 'wagmi';

import { CharityContractAbi, CharityContractAddress } from '../CharityContract';

declare global {
  interface Window {
    // From tilda page
    TOKENS_AMOUNT?: number;
    renderTokensBalances?: (tokensBalances: readonly number[]) => void;
  }
}

export const useRenderTokensAmount = () => {
  const { address } = useAccount();
  const ids = [...new Array(window.TOKENS_AMOUNT)].map((_, i) => i);

  const enabled = address != null && ids.length !== 0;
  useContractRead({
    addressOrName: CharityContractAddress,
    contractInterface: CharityContractAbi,
    functionName: 'balanceOfBatch',
    args: [ids.map(() => address), ids],
    watch: true,
    enabled,
    onSuccess: (data) => {
      const balances = [data[0] * 1e-18, ...data.slice(1)];
      window.renderTokensBalances?.(balances);
    },
  });

  useEffect(() => {
    if (!enabled) {
      window.renderTokensBalances?.(ids.map(() => 0));
    }
  }, [address, enabled, ids]);
};
