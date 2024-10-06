import { chain, configureChains } from 'wagmi';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

export const { chains, provider } = configureChains(
  [chain.mainnet, chain.goerli],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: `https://rpc.ankr.com/eth${chain.id === 5 ? '_goerli' : ''}`,
      }),
      priority: 0,
    }),
    jsonRpcProvider({
      rpc: (chain) => ({
        http: `https://rpc${chain.id === 5 ? '-goerli' : ''}.flashbots.net`,
      }),
      priority: 0,
    }),
    jsonRpcProvider({
      rpc: (chain) => ({
        http: `https://eth-${chain.id === 5 ? 'goerli' : 'mainnet'}.public.blastapi.io`,
        webSocket: `wss://eth-${chain.id === 5 ? 'goerli' : 'mainnet'}.public.blastapi.io`,
      }),
      priority: 0,
    }),
  ],
);
