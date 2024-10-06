import { FC, Suspense, lazy, useEffect, useState } from 'react';

import type { JsonRpcConnectionMap } from '@max2204/widget-with-charity';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { createPortal } from 'react-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAccount, useNetwork } from 'wagmi';

import { chains } from './chains';
import { useHydrateBuySFT } from './hooks/hydrateBuySFT';
import { useRenderTokensAmount } from './hooks/renderTokensAmount';

const donationFormDiv = document.getElementById('donationForm');
const swapWidgetDiv = document.getElementById('swapWidget');

const DonationForm = lazy(() => import('./DonationForm'));
const SwapWidget = lazy(() => import('@max2204/widget-with-charity').then((module) => ({ default: module.SwapWidget })));

const jsonRpcUrlMap = chains.reduce((acc, { id, rpcUrls }) => {
  acc[id] = rpcUrls.default;
  return acc;
}, {} as JsonRpcConnectionMap);

export const App: FC = () => {
  useRenderTokensAmount();
  useHydrateBuySFT();

  const { chain } = useNetwork();
  const { connector, isConnected } = useAccount();
  const [provider, setProvider] = useState();
  useEffect(() => {
    if (connector) {
      connector?.getProvider().then(setProvider);
    }
    if (!isConnected) {
      setProvider(undefined);
    }
  }, [connector, isConnected]);

  return (
    <>
      <ConnectButton
        chainStatus={chain?.unsupported ? 'icon' : 'none'}
        showBalance
        accountStatus={{
          smallScreen: 'avatar',
          largeScreen: 'full',
        }}
      />
      <ToastContainer position='bottom-left' toastStyle={{ borderRadius: '1rem' }} />
      <Suspense>
        {donationFormDiv != null && createPortal(<DonationForm />, donationFormDiv)}
        {swapWidgetDiv != null &&
          createPortal(
            <SwapWidget
              disableBranding
              hideConnectionUI
              provider={(provider as any) ?? null}
              jsonRpcUrlMap={jsonRpcUrlMap}
              width='min(100vw, 380px)'
              theme={{
                primary: '#000742',
                secondary: '#877F9D',
                interactive: '#FFF',
                container: '#FFF',
                module: '#f2edff',
                dialog: '#FFF',
                outline: '#7b5ec7',
                accent: '#ff795d',
                fontFamily: 'Hanson, Arial, sans-serif',
                borderRadius: 1,
              }}
            />,
            swapWidgetDiv,
          )}
      </Suspense>
    </>
  );
};
