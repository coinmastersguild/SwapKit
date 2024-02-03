import { RequestClient } from '@coinmasters/helpers';
import { RPCUrl } from '@coinmasters/types';
//https://pioneers.dev/api/v1/getAccountInfo/osmosis/
// const PIONEER_API_URI = 'https://pioneers.dev';
const PIONEER_API_URI = 'http://localhost:9001';
const TAG = ' | osmosis-toolbox | ';
const getAccount = (address: string): Promise<any> => {
  // Construct the URL
  const url = `${PIONEER_API_URI}/api/v1/getAccountInfo/mayachain/${address}`;

  // Log the URL
  console.log(`Requesting URL: ${url}`);

  // Make the request
  return RequestClient.get<any>(url);
};

const getBalance = async (address: any[]) => {
  //console.log(address)
  try {
    console.log('address: ', address[0].address);
    console.log(
      'URL: ',
      `${PIONEER_API_URI}/api/v1/getPubkeyBalance/mayachain/${address[0].address}`,
    );
    const balancesNative: any = await RequestClient.get(
      `${PIONEER_API_URI}/api/v1/getPubkeyBalance/mayachain/${address[0].address}`,
    );

    return balancesNative;
  } catch (e) {
    return [];
  }
};

const sendRawTransaction = async (tx, sync = true) => {
  let tag = TAG + ' | sendRawTransaction | ';
  try{
    // Construct payload
    let payload = {
      tx_bytes: tx,
      mode: sync ? 'BROADCAST_MODE_SYNC' : 'BROADCAST_MODE_ASYNC',
    };

    // Define the URL for broadcasting transactions
    let urlRemote = `${RPCUrl.Mayachain}/cosmos/tx/v1beta1/txs`;
    console.log(tag, 'urlRemote: ', urlRemote);

    // Sending the transaction using RequestClient
    let result = await RequestClient.post(urlRemote, {
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json', // Assuming JSON content type is required
      },
    });
    console.log(tag, '** Broadcast ** REMOTE: result: ', result);

    // Handle the response
    if (result.tx_response.txhash) {
      output.txid = result.tx_response.txhash;
      output.success = true;
    } else {
      output.success = false;
      output.error = 'No txhash found in response';
    }
  }catch(e){
    console.log(e);
    throw e
  }
};

export const MayachainToolbox = (): any => {
  return {
    // transfer: (params: TransferParams) => transfer(params),
    getAccount,
    getBalance,
    // getFees,
    sendRawTransaction,
  };
};
