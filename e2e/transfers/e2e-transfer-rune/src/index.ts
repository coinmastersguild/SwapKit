/*
    E2E testing

 */

require("dotenv").config()
require('dotenv').config({path:"../../.env"});
require('dotenv').config({path:"./../../.env"});
require("dotenv").config({path:'../../../.env'})
require("dotenv").config({path:'../../../../.env'})

const TAG  = " | intergration-test | "
import { WalletOption, availableChainsByWallet, Chain } from '@coinmasters/types';
import { AssetValue } from '@pioneer-platform/helpers';
const log = require("@pioneer-platform/loggerdog")()
let assert = require('assert')
let SDK = require('@coinmasters/pioneer-sdk')
let wait = require('wait-promise');
let {ChainToNetworkId, ChainToCaip, caipToNetworkId} = require('@pioneer-platform/pioneer-caip');
let sleep = wait.sleep;

let ASSET = 'THOR'
let BLOCKCHAIN = ChainToNetworkId[ASSET]
console.log("BLOCKCHAIN: ",BLOCKCHAIN)
let MIN_BALANCE = process.env['MIN_BALANCE_RUNE'] || "0.004"
let TEST_AMOUNT = process.env['TEST_AMOUNT'] || "0.001"
let spec = process.env['VITE_PIONEER_URL_SPEC'] || 'https://pioneers.dev/spec/swagger.json'
//http://127.0.0.1:9001/spec/swagger.json

let wss = process.env['VITE_URL_PIONEER_SOCKET'] || 'wss://pioneers.dev'
let FAUCET_RUNE_ADDRESS = process.env['FAUCET_RUNE_ADDRESS']
if(!FAUCET_RUNE_ADDRESS) throw Error("Need Faucet Address!")
let FAUCET_ADDRESS = FAUCET_RUNE_ADDRESS

import {
    getPaths,
    // @ts-ignore
} from '@pioneer-platform/pioneer-coins';

console.log("spec: ",spec)
console.log("wss: ",wss)

let txid:string
let IS_SIGNED: boolean


const test_service = async function (this: any) {
    let tag = TAG + " | test_service | "
    try {
        //(tag,' CHECKPOINT 1');
        console.time('start2paired');
        console.time('start2build');
        console.time('start2broadcast');
        console.time('start2end');
        //if force new user
        const queryKey = "sdk:pair-keepkey:"+Math.random();
        log.info(tag,"queryKey: ",queryKey)
        // const queryKey = "key:66fefdd6-7ea9-48cf-8e69-fc74afb9c45412"
        assert(queryKey)

        const username = "user:"+Math.random()
        assert(username)

        //add custom path
        let blockchains = [BLOCKCHAIN]

        //get paths for wallet
        let paths = getPaths(blockchains)

        let config:any = {
            username,
            queryKey,
            spec,
            keepkeyApiKey:process.env.KEEPKEY_API_KEY,
            wss,
            paths,
            blockchains,
            // @ts-ignore
            ethplorerApiKey:
            // @ts-ignore
              process.env.VITE_ETHPLORER_API_KEY || 'EK-xs8Hj-qG4HbLY-LoAu7',
            // @ts-ignore
            covalentApiKey:
            // @ts-ignore
              process.env.VITE__COVALENT_API_KEY || 'cqt_rQ6333MVWCVJFVX3DbCCGMVqRH4q',
            // @ts-ignore
            utxoApiKey: process.env.VITE_BLOCKCHAIR_API_KEY || 'B_s9XK926uwmQSGTDEcZB3vSAmt5t2',
            // @ts-ignore
            walletConnectProjectId:
            // @ts-ignore
              process.env.VITE_WALLET_CONNECT_PROJECT_ID || '18224df5f72924a5f6b3569fbd56ae16',
        };

        //console.log(tag,' CHECKPOINT 2');
        //console.log(tag,' config: ',config);
        let app = new SDK.SDK(spec,config)
        const walletsVerbose: any = [];
        const { keepkeyWallet } = await import("@coinmasters/wallet-keepkey");
        //log.info(tag,"walletKeepKey: ",keepkeyWallet)
        const walletKeepKey = {
            type: WalletOption.KEEPKEY,
            icon: "https://pioneers.dev/coins/keepkey.png",
            chains: availableChainsByWallet[WalletOption.KEEPKEY],
            wallet: keepkeyWallet,
            status: "offline",
            isConnected: false,
        };
        walletsVerbose.push(walletKeepKey);

        let resultInit = await app.init(walletsVerbose, {})
        // log.info(tag,"resultInit: ",resultInit)
        log.info(tag,"wallets: ",app.wallets.length)


        // //connect
        // assert(blockchains)
        // assert(blockchains[0])
        log.info(tag,"blockchains: ",blockchains)
        let pairObject = {
            type:WalletOption.KEEPKEY,
            blockchains
        }
        resultInit = await app.pairWallet(pairObject)
        log.info(tag,"resultInit: ",resultInit)

        //check pairing
        // //context should match first account
        let context = await app.context
        log.info(tag,"context: ",context)
        assert(context)


        //verify state
        let assets = app.assetsMap;
        log.info(tag, "assets: ", assets);
        assert(assets)

        //get paths
        // let paths = app.paths
        // assert(paths)
        // assert(paths[0])
        // let AssetPath = paths.filter((e:any) => e.symbol === ASSET)
        // log.info(tag,"AssetPath: ",AssetPath)
        // assert(AssetPath)

        await app.getPubkeys()
        log.info(tag,"pubkeys: ",app.pubkeys)
        // assert(app.pubkeys)
        // assert(app.pubkeys[0])
        // let pubkey = app.pubkeys.filter((e:any) => e.symbol === ASSET)
        // log.info(tag,"pubkey: ",pubkey)
        // assert(pubkey.length > 0)
        //verify pubkeys


        await app.getBalances()
        log.info(tag,"balances: ",app.balances)
        //filter by caip

        assert(assets.get(ChainToCaip[ASSET]))
        await app.setAssetContext(assets.get(ChainToCaip[ASSET]))
        log.info(tag,"assetContext: ",app.assetContext)
        assert(app.assetContext)
        assert(app.assetContext.caip)


        //sendMax
        log.info(tag, "app.pubkeys: ", app.pubkeys);
        let pubkeys = app.pubkeys.filter((e: any) => e.networks.includes(caipToNetworkId(app.assetContext.caip)));
        log.info(tag,"pubkeys: ",pubkeys)
        assert(pubkeys)
        assert(pubkeys[0])
        assert(pubkeys[0].address)


        //verify balances
        //send
        let estimatePayload:any = {
            // from:fromAddress,
            pubkeys,
            // assetValue,
            // feeRate: 10,
            memo: '',
            recipient: FAUCET_ADDRESS,
        }
        log.info(tag,"estimatePayload: ",estimatePayload)
        //verify amount is < max spendable
        let maxSpendable = await app.swapKit.estimateMaxSendableAmount({chain:Chain.THORChain, params:estimatePayload})
        log.info(tag,"maxSpendable: ",maxSpendable)

        // create assetValue
        // const assetString = `${ASSET}.${ASSET}`;
        // console.log('assetString: ', assetString);
        // // await AssetValue.loadStaticAssets();
        // log.info("TEST_AMOUNT: ",TEST_AMOUNT)
        // log.info("TEST_AMOUNT: ",typeof(TEST_AMOUNT))
        // let assetValue = AssetValue.fromChainOrSignature(
        //   Chain.Mayachain,
        //   TEST_AMOUNT,
        // );
        // log.info("assetValue: ",assetValue)

        let assetString = 'THOR.RUNE'
        await AssetValue.loadStaticAssets();
        const assetValue = AssetValue.fromStringSync(assetString, parseFloat(TEST_AMOUNT));
        log.info("assetValue: ",assetValue)
        assert(assetValue)

        //send
        let sendPayload = {
            assetValue,
            memo: '',
            recipient: FAUCET_ADDRESS,
        }
        log.info("sendPayload: ",sendPayload)
        const txHash = await app.swapKit.transfer(sendPayload);
        log.info("txHash: ",txHash)
        assert(txHash)

        console.log("************************* TEST PASS *************************")
    } catch (e) {
        log.error(e)
        //process
        process.exit(666)
    }
}
test_service()
