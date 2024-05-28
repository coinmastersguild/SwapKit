import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
  Tooltip,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, InfoOutlineIcon } from '@chakra-ui/icons';
import { AssetValue } from '@coinmasters/core';
// @ts-ignore
import { COIN_MAP_LONG } from '@pioneer-platform/pioneer-coins';
import React, { useCallback, useEffect, useState } from 'react';
import { getWalletBadgeContent } from '../WalletIcon';

export function Transfer({ usePioneer }: any): JSX.Element {
  const toast = useToast();
  const { state, setIntent, connectWallet } = usePioneer();
  const { app, assetContext, context } = state;
  const [isPairing, setIsPairing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMax, setisMax] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [sendAmount, setSendAmount] = useState<any | undefined>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [memo, setMemo] = useState('');
  const [recipient, setRecipient] = useState('');
  const [walletType, setWalletType] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [maxSpendable, setMaxSpendable] = useState('');
  const [loadingMaxSpendable, setLoadingMaxSpendable] = useState(false);

  const textColor = useColorModeValue('gray.600', 'gray.200');
  const bgColor = useColorModeValue('white', 'gray.700');
  const headingColor = useColorModeValue('teal.500', 'teal.300');

  useEffect(() => {
    if (context) {
      setWalletType(context.split(':')[0]);
    }
  }, [context]);

  useEffect(() => {
    setIsPairing(false);
  }, [app]);

  let onStart = async function () {
    let tag = " | onStart Transfer | "
    try{
      if(app && app.swapKit && assetContext && assetContext.chain && app.swapKit.estimateMaxSendableAmount && assetContext.networkId){
          console.log("onStart Transfer page")
          //figure out if we need to connect the wallet
          console.log(tag,"assetContext: ",assetContext)
          const walletInfo = await app.swapKit.getWalletByChain(assetContext.chain);
          if (!walletInfo) {
            //connect to wallet
            console.log(tag,"connectWallet needed!")
            // let blockchains = [assetContext.networkId];
            // await app.setBlockchains(blockchains);
            console.log(tag,"assetContext: ",assetContext)
            await connectWallet('KEEPKEY');
            // let walletType = assetContext.context.split(':')[0];
            // console.log(tag,"walletType: ",walletType)
            // if(walletType){
            //   await connectWallet('KEEPKEY');
            // }
            //TODO wait, try again
            setTimeout(onStart, 10000);
          } else {
            let pubkeys = await app.pubkeys;
            pubkeys = pubkeys.filter((pubkey: any) => pubkey.networks.includes(assetContext.networkId));
            console.log("onStart Transfer pubkeys", pubkeys)
            let estimatePayload: any = {
              feeRate: 10,
              pubkeys,
              memo,
              recipient,
            };
            let maxSpendableAmount = await app.swapKit.estimateMaxSendableAmount({ chain: assetContext.chain, params: estimatePayload });
            console.log("onStart Transfer pubkeys", pubkeys)
            setMaxSpendable(maxSpendableAmount.getValue('string'));
          }
      }

    }catch(e){
      console.error('Failed to get Max Spendable', e);
    }
  }

  useEffect(() => {
    onStart();
  }, [app, app?.swapKit, assetContext]);

  // let onStart = async function () {
  //   try{
  //     if(app && app.swapKit && assetContext && app.swapKit.estimateMaxSendableAmount && assetContext.networkId){
  //         console.log("onStart Transfer page")
  //         //figure out if we need to connect the wallet
  //
  //         let pubkeys = await app.pubkeys;
  //         pubkeys = pubkeys.filter((pubkey: any) => pubkey.networks.includes(assetContext.networkId));
  //         console.log("onStart Transfer pubkeys", pubkeys)
  //         let estimatePayload: any = {
  //           feeRate: 10,
  //           pubkeys,
  //           memo,
  //           recipient,
  //         };
  //         let maxSpendableAmount = await app.swapKit.estimateMaxSendableAmount({ chain: assetContext.chain, params: estimatePayload });
  //         console.log("onStart Transfer pubkeys", pubkeys)
  //         setMaxSpendable(maxSpendableAmount.getValue('string'));
  //     }
  //
  //   }catch(e){
  //     console.error('Failed to get Max Spendable', e);
  //   }
  // }
  //
  // useEffect(() => {
  //   onStart();
  // }, [app, app?.swapKit, assetContext]);

  // useEffect(() => {
  //   const calculateMaxSpendable = async () => {
  //     setLoadingMaxSpendable(true);
  //     try {
  //       const walletInfo = await app.swapKit.getWalletByChain(assetContext.chain);
  //       if (!walletInfo) {
  //         let blockchains = [assetContext.networkId];
  //         app.setBlockchains(blockchains);
  //
  //         let walletType = app.context.split(':')[0];
  //         await connectWallet(walletType.toUpperCase());
  //       } else {
  //         let pubkeys = await app.pubkeys;
  //         pubkeys = pubkeys.filter((pubkey: any) => pubkey.networks.includes(assetContext.networkId));
  //
  //         let estimatePayload: any = {
  //           feeRate: 10,
  //           pubkeys,
  //           memo,
  //           recipient,
  //         };
  //         let maxSpendableAmount = await app.swapKit.estimateMaxSendableAmount({ chain: assetContext.chain, params: estimatePayload });
  //         setMaxSpendable(maxSpendableAmount.getValue('string'));
  //       }
  //     } catch (e) {
  //       console.error(e);
  //     }
  //     setLoadingMaxSpendable(false);
  //   };
  //
  //   if (assetContext.chain && assetContext.networkId) {
  //     calculateMaxSpendable();
  //   }
  // }, [assetContext.chain, assetContext.networkId, memo, recipient, app, connectWallet]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputAmount(event.target.value);
  };

  const handleRecipientChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(event.target.value);
  };

  const handleSend = useCallback(async () => {
    try {
      if (!inputAmount) {
        alert('You MUST input an amount to send!');
        return;
      }
      if (!recipient) {
        alert('You MUST input a recipient to send to!');
        return;
      }
      setIntent(
        'transfer:' +
        assetContext.chain +
        ':' +
        assetContext.symbol +
        ':' +
        inputAmount +
        ':' +
        recipient,
      );
      const walletInfo = await app.swapKit.getWalletByChain(assetContext.chain);

      if (!walletInfo) {
        let walletType = app.context.split(':')[0];
        connectWallet(walletType.toUpperCase());
        setTimeout(() => {
          handleSend();
        }, 3000);
      } else {
        setIsSubmitting(true);
        const assetString = `${assetContext.chain}.${assetContext.symbol}`;
        await AssetValue.loadStaticAssets();
        //@ts-ignore
        const assetValue = await AssetValue.fromIdentifier(assetString, parseFloat(inputAmount));

        let sendPayload: any = {
          assetValue,
          memo,
          recipient,
        };
        if (isMax) sendPayload.isMax = true;
        const txHash = await app.swapKit.transfer(sendPayload);
        if (typeof window !== 'undefined') {
          window.open(
            `${app.swapKit.getExplorerTxUrl(assetContext.chain, txHash as string)}`,
            '_blank',
          );
        }
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Error',
        description: e.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [assetContext, inputAmount, app, recipient, sendAmount, toast]);

  const setMaxAmount = () => {
    setInputAmount(maxSpendable);
  };

  if (loadingMaxSpendable) {
    return (
      <Flex align="center" justify="center" height="100vh">
        <Box p={10} borderRadius="md" boxShadow="lg" bg={bgColor}>
          <Flex align="center" justify="center">
            <Spinner size="xl" />
            <Text ml={4}>Calculating max spendable amount...</Text>
          </Flex>
        </Box>
      </Flex>
    );
  }

  return (
    <VStack align="start" borderRadius="md" p={6} spacing={5} bg={bgColor} boxShadow="lg" width={{ base: '100%', md: '75%', lg: '50%' }} margin="0 auto">
      <Heading as="h1" mb={4} size="lg" color={headingColor}>
        Send Crypto!
      </Heading>

      {isPairing ? (
        <Box>
          <Text mb={2} color={textColor}>
            Connecting to {context}...
            <Spinner size="xl" />
            Please check your wallet to approve the connection.
          </Text>
        </Box>
      ) : (
        <div>
          <Flex align="center" direction={{ base: 'column', md: 'row' }} gap={20}>
            <Box>
              <Avatar size="xxl" src={avatarUrl}>
                {getWalletBadgeContent(walletType, '8em')}
              </Avatar>
            </Box>
            <Box>
              <Text mb={2} color={textColor}>Asset: {assetContext?.name || 'N/A'}</Text>
              <Text mb={2} color={textColor}>Chain: {assetContext?.chain || 'N/A'}</Text>
              <Text mb={4} color={textColor}>Symbol: {assetContext?.symbol || 'N/A'}</Text>
              <Text mb={4} color={textColor}>
                Max Spendable: {maxSpendable} {assetContext?.symbol}
              </Text>
            </Box>
          </Flex>
          <br />
          <Grid
            gap={10}
            templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
            w="full"
          >
            <FormControl>
              <FormLabel color={textColor}>Recipient:</FormLabel>
              <Input
                onChange={handleRecipientChange}
                placeholder="Address"
                value={recipient}
              />
            </FormControl>
            <FormControl>
              <FormLabel color={textColor}>Input Amount:</FormLabel>
              <Input
                onChange={handleInputChange}
                placeholder="0.0"
                value={inputAmount}
              />
            </FormControl>
          </Grid>
          <Flex justify="space-between" align="center" mt="4">
            <Button
              variant="ghost"
              rightIcon={showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              Advanced
            </Button>
          </Flex>
          {showAdvanced && (
            <FormControl>
              <FormLabel color={textColor}>
                Memo:
                <Tooltip label="Optional memo to include with your transaction for reference." aria-label="A tooltip for memo input">
                  <InfoOutlineIcon ml="2" />
                </Tooltip>
              </FormLabel>
              <Input placeholder="Enter memo (optional)" value={memo} onChange={(e) => setMemo(e.target.value)} />
            </FormControl>
          )}
          <br />
          <Button onClick={setMaxAmount} size="sm" colorScheme="teal">MAX</Button>
        </div>
      )}

      <Button
        colorScheme="green"
        w="full"
        mt={4}
        onClick={handleSend}
        isLoading={isSubmitting}
      >
        {isSubmitting ? 'Sending...' : 'Send'}
      </Button>
    </VStack>
  );
}

export default Transfer;