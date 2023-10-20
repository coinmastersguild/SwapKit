// @ts-ignore
import { addressInfoForCoin, COIN_MAP_KEEPKEY_LONG } from '@pioneer-platform/pioneer-coins';
import type { UTXOTransferParams } from '@coinmasters/toolbox-utxo';
import { BCHToolbox, BTCToolbox, DOGEToolbox, LTCToolbox } from '@coinmasters/toolbox-utxo';
import type { UTXO } from '@coinmasters/types';
import { Chain, FeeOption } from '@coinmasters/types';
import { toCashAddress } from 'bchaddrjs';
import type { Psbt } from 'bitcoinjs-lib';

export const utxoWalletMethods: any = async function (params: any) {
  try {
    let { sdk, chain, utxoApiKey, api, derivationPath } = params;
    console.log('derivationPath: ', derivationPath);
    if (!utxoApiKey && !api) throw new Error('UTXO API key not found');
    let toolbox: any = {};
    let isSegwit = false;
    const toolboxParams = { api, apiKey: utxoApiKey };
    switch (chain) {
      case Chain.Bitcoin:
        isSegwit = true;
        toolbox = BTCToolbox(toolboxParams);
        break;
      case Chain.Litecoin:
        isSegwit = true;
        toolbox = LTCToolbox(toolboxParams);
        break;
      case Chain.Dogecoin:
        toolbox = DOGEToolbox(toolboxParams);
        break;
      case Chain.BitcoinCash:
        toolbox = BCHToolbox(toolboxParams);
        break;
      default:
        throw Error('unsupported chain! ' + chain);
    }
    const utxoMethods = toolbox;
    //get addressNlist of master
    let scriptType;
    if (isSegwit) {
      scriptType = 'p2wpkh';
    } else {
      scriptType = 'p2pkh';
    }
    let addressInfo = addressInfoForCoin(chain, false, scriptType);
    //getAddress
    const getAddress = async function () {
      try {
        //TODO custom script types?
        let scriptType;
        if (isSegwit) {
          scriptType = 'p2wpkh';
        } else {
          scriptType = 'p2pkh';
        }
        let addressInfo = addressInfoForCoin(chain, false, scriptType);
        let response = await sdk.address.utxoGetAddress(addressInfo);
        return response.address;
      } catch (e) {
        console.error(e);
      }
    };
    const address = await getAddress();

    const signTransaction = async (psbt: Psbt, inputs: UTXO[], memo: string = '') => {
      let outputs: any[] = psbt.txOutputs.map((output: any) => {
        let outputAddress = output.address;
        if (chain === Chain.BitcoinCash && output.address) {
          outputAddress = toCashAddress(output.address);
          const strippedAddress = (toolbox as ReturnType<typeof BCHToolbox>).stripPrefix(
            outputAddress,
          );
          outputAddress = strippedAddress;
        }
        if (output.change || output.address === address) {
          return {
            addressNList: addressInfo.address_n,
            isChange: true,
            addressType: 'change',
            amount: output.value,
            scriptType: isSegwit ? 'p2wpkh' : 'p2pkh',
          };
        } else {
          if (outputAddress) {
            return {
              address: outputAddress,
              amount: output.value,
              addressType: 'spend',
            };
          } else {
            //else opReturn DO NOT ADD
            //HDwallet will handle opReturn do not send as an output to keepkey
            return null;
          }
        }
      });
      function removeNullAndEmptyObjectsFromArray(arr: any[]): any[] {
        return arr.filter(
          (item) => item !== null && typeof item === 'object' && Object.keys(item).length !== 0,
        );
      }
      let txToSign: any = {
        coin: COIN_MAP_KEEPKEY_LONG[chain],
        inputs,
        outputs: removeNullAndEmptyObjectsFromArray(outputs),
        version: 1,
        locktime: 0,
      };
      if (memo) {
        txToSign.opReturnData = memo;
      }
      console.log('txToSign: ', txToSign);
      let responseSign = await sdk.utxo.utxoSignTransaction(txToSign);
      return responseSign.serializedTx;
    };

    const transfer: any = async ({
      from,
      recipient,
      feeOptionKey,
      feeRate,
      memo,
      ...rest
    }: UTXOTransferParams) => {
      if (!from) throw new Error('From address must be provided');
      if (!recipient) throw new Error('Recipient address must be provided');
      let { psbt, inputs } = await toolbox.buildTx({
        ...rest,
        memo,
        feeOptionKey,
        recipient,
        feeRate: feeRate || (await toolbox.getFeeRates())[feeOptionKey || FeeOption.Fast],
        sender: from,
        fetchTxHex: chain,
      });
      //convert inputs for keepkey
      let inputsKeepKey = [];
      for (const input of inputs) {
        const inputKeepKey: any = {
          addressNList: addressInfo.address_n, //@TODO don't hardcode master, lookup on blockbook what input this is for and what path that address is!
          scriptType: 'p2pkh',
          amount: input.value.toString(),
          vout: input.index,
          txid: input.hash,
          hex: input.txHex,
        };
        //if segwit I need script
        if (input.witnessUtxo && isSegwit) {
          inputKeepKey.scriptType = 'p2wpkh';
        }
        inputsKeepKey.push(inputKeepKey);
      }
      inputs = inputsKeepKey;

      const txHex = await signTransaction(psbt, inputs, memo);
      return toolbox.broadcastTx(txHex);
    };

    return { ...utxoMethods, getAddress, signTransaction, transfer };
  } catch (e) {
    console.error(e);
    throw e;
  }
};
