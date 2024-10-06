import React from 'react';
import ReactDOM from 'react-dom/client';

import { RainbowKitProvider, getDefaultWallets, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiConfig, chain, createClient } from 'wagmi';

import { App } from './App';
import { chains, provider } from './chains';
import './index.css';
import './polyfills';

export const main = (root: HTMLElement) => {
  const { connectors } = getDefaultWallets({
    appName: 'Charity',
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
  });

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains} initialChain={chain.mainnet} theme={lightTheme({ accentColor: '#ff795d' })}>
          <App />
        </RainbowKitProvider>
      </WagmiConfig>
    </React.StrictMode>,
  );
};
