import type { SwapKitCore } from '@coinmasters/core';

let skClient: SwapKitCore | undefined;

export const clearSwapkitClient = () => (skClient = undefined);

export const getSwapKitClient = async ({
  ethplorerApiKey = 'freekey',
  covalentApiKey = '',
  utxoApiKey = '',
  walletConnectProjectId = '',
  stagenet,
}: {
  ethplorerApiKey?: string;
  covalentApiKey?: string;
  utxoApiKey?: string;
  walletConnectProjectId?: string;
  stagenet?: boolean;
} = {}) => {
  if (skClient) return skClient;

  const { evmWallet } = await import('@coinmasters/wallet-evm-extensions');
  const { keplrWallet } = await import('@coinmasters/wallet-keplr');
  const { keystoreWallet } = await import('@coinmasters/wallet-keystore');
  const { keepkeyWallet } = await import('@coinmasters/wallet-keepkey');
  const { ledgerWallet } = await import('@coinmasters/wallet-ledger');
  const { okxWallet } = await import('@coinmasters/wallet-okx');
  const { SwapKitCore } = await import('@coinmasters/core');
  const { trezorWallet } = await import('@coinmasters/wallet-trezor');
  const { walletconnectWallet } = await import('@coinmasters/wallet-wc');
  const { xdefiWallet } = await import('@coinmasters/wallet-xdefi');

  const client = new SwapKitCore({ stagenet });

  client.extend({
    config: {
      ethplorerApiKey,
      covalentApiKey,
      utxoApiKey,
      walletConnectProjectId,
      stagenet,
    },
    wallets: [
      xdefiWallet,
      okxWallet,
      ledgerWallet,
      keystoreWallet,
      keepkeyWallet,
      trezorWallet,
      keplrWallet,
      evmWallet,
      walletconnectWallet,
    ],
  });

  skClient = client;

  return client;
};
