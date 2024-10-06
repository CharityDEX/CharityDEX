import { FC, useRef, useState } from 'react';

import { BigNumber, ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';

import { CharityContractAbi, CharityContractAddress } from '../CharityContract';

import { FOND_ADDRESSES, Fonds, FondsComponent } from './Fonds';
import { Spinner } from './Spinner';
import classes from './index.module.css';

export const DonationForm: FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isDisconnected } = useAccount();
  const [fond, setFond] = useState<Fonds>('Random');

  const [amount, setAmount] = useState('');
  let value = BigNumber.from(0);
  try {
    value = ethers.utils.parseEther(amount);
  } catch {}

  const { config, isSuccess, error } = usePrepareContractWrite({
    contractInterface: CharityContractAbi,
    addressOrName: CharityContractAddress,
    functionName: fond === 'Random' ? 'donate' : 'donateTo',
    args: fond === 'Random' ? [] : [FOND_ADDRESSES[fond]],
    overrides: { value },
    enabled: !value.isZero(),
  });
  const { isLoading, writeAsync: donate } = useContractWrite(config);

  const insufficientFunds = (error as any)?.code === ethers.errors.INSUFFICIENT_FUNDS;
  const walletShouldBeConnectedWarning = isDisconnected && !value.isZero();

  return (
    <div className={classes.card} ref={cardRef}>
      <h4 className={classes.header}>Charity List</h4>
      <FondsComponent
        fond={fond}
        onFondChange={(e) => {
          setTimeout(() => {
            cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }, 0);
          setFond(e);
        }}
      />
      <div className={classes.inputBlock}>
        <input
          className={classes.input}
          data-error={insufficientFunds}
          value={amount}
          inputMode='decimal'
          placeholder='Enter eth amount to donate'
          disabled={isLoading}
          onChange={(e) => setAmount(e.target.value.replaceAll(/[^\d.,]/g, '').replaceAll(',', '.'))}
        />

        <button
          className={classes.donateBtn}
          data-loading={isLoading}
          onClick={() => {
            donate &&
              toast.promise(donate, {
                pending: 'Donation is in progress',
                success: 'Donation has been made successfully',
                error: 'Donation has been canceled',
              });
          }}
          disabled={!isSuccess}
        >
          {isLoading ? <Spinner /> : 'Donate'}
        </button>
      </div>
      <div className={classes.error}>
        {insufficientFunds && 'Insufficient funds'}
        {walletShouldBeConnectedWarning && 'To donate connect wallet first'}
      </div>
    </div>
  );
};

export default DonationForm;
