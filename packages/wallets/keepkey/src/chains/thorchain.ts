import type { DepositParam, TransferParams } from '@coinmasters/toolbox-cosmos';
import { ThorchainToolboxPioneer } from '@coinmasters/toolbox-cosmos';
import { Chain, ChainId, DerivationPath, RPCUrl } from '@coinmasters/types';
import { StargateClient } from '@cosmjs/stargate';
import type { KeepKeySdk } from '@keepkey/keepkey-sdk';

import { bip32ToAddressNList } from '../helpers/coins.ts';

type SignTransactionTransferParams = {
  asset: string;
  amount: any;
  to: string;
  from: string;
  memo: string | undefined;
};

type SignTransactionDepositParams = {
  asset: string;
  amount: any;
  from: string;
  memo: string | undefined;
};

export const thorchainWalletMethods: any = async ({ sdk }: { sdk: KeepKeySdk }) => {
  try {
    const toolbox = ThorchainToolboxPioneer();
    const { address: fromAddress } = (await sdk.address.thorchainGetAddress({
      address_n: bip32ToAddressNList(DerivationPath[Chain.THORChain]),
    })) as { address: string };

    const signTransactionTransfer = async ({
      amount,
      asset,
      to,
      from,
      memo,
    }: SignTransactionTransferParams) => {
      try {
        const accountInfo = await toolbox.getAccount(from);
        //console.log('accountInfo: ', accountInfo);
        let account_number = accountInfo.result.value.account_number || '0';
        let sequence = accountInfo.result.value.sequence || '0';
        const keepKeyResponse = await sdk.thorchain.thorchainSignAminoTransfer({
          signDoc: {
            account_number,
            chain_id: ChainId.THORChain,
            fee: { gas: '500000000', amount: [] },
            msgs: [
              {
                value: {
                  amount: [{ denom: asset.split('.')[0].toLowerCase(), amount: amount.toString() }],
                  to_address: to,
                  from_address: from,
                },
                type: 'thorchain/MsgSend' as const,
              },
            ],
            memo: memo || '',
            sequence,
          },
          signerAddress: from,
        });

        let txid = await toolbox.sendRawTransaction(keepKeyResponse.serialized);
        return txid.txid
      } catch (e) {
        console.error(e);
        throw e;
      }
    };

    const transfer = async ({ assetValue, recipient, memo }: TransferParams) =>
      signTransactionTransfer({
        from: fromAddress,
        to: recipient,
        asset: assetValue.symbol,
        amount: assetValue.getBaseValue('string'),
        memo,
      });

    const signTransactionDeposit = async ({
      amount,
      asset,
      memo = '',
    }: SignTransactionDepositParams) => {
      try {
        const accountInfo = await toolbox.getAccount(fromAddress);
        //console.log('accountInfo: ', accountInfo);
        let account_number = accountInfo.result.value.account_number || '0';
        let sequence = accountInfo.result.value.sequence || '0';
        let signPayload: any = {
          signerAddress: fromAddress,
          signDoc: {
            sequence,
            source: '0',
            memo: memo || '',
            account_number,
            chain_id: ChainId.THORChain,
            fee: { gas: '500000000', amount: [      {
                "amount": "0",
                "denom": "rune"
              }] },
            msgs: [
              {
                value: {
                  coins: [{ asset: 'THOR.RUNE', amount: amount.toString() }],
                  memo: memo || '',
                  signer: fromAddress,
                },
                type: 'thorchain/MsgDeposit',
              },
            ],
          },
        };
        // console.log('signPayload: ', signPayload);
        //console.log('signPayload: ', JSON.stringify(signPayload));
        const keepKeyResponse = await sdk.thorchain.thorchainSignAminoDeposit(signPayload);
        //console.log('keepKeyResponse: ', keepKeyResponse);
        //console.log('URL: ', RPCUrl.THORChain);
        let txid = await toolbox.sendRawTransaction(keepKeyResponse.serialized);
        return txid.txid
      } catch (e) {
        console.error(e);
        throw e;
      }
    };

    const deposit = async ({ assetValue, memo }: DepositParam) =>
      signTransactionDeposit({
        memo,
        asset: assetValue.symbol,
        amount: assetValue.getBaseValue('string'),
        from: fromAddress,
      });

    return { ...toolbox, getAddress: () => fromAddress, transfer, deposit };
  } catch (e) {
    throw e;
  }
};
