'use client';
import { Box } from '@chakra-ui/react';
// @ts-ignore
import React, { useEffect, useState } from 'react';

import CalculatingComponent from '../../../components/CalculatingComponent';
import Quote from "../../../components/Quote";

const BeginSwap = ({ quote, onAcceptSign, memoless}: any) => {
  const [showGif, setShowGif] = useState(true);

  // wait for routes
  useEffect(() => {
    if (quote && quote.quote) {
      setShowGif(false);
    }
  }, [quote]);

  return (
    <Box>
      {showGif ? (
        <Box>
          <CalculatingComponent />
        </Box>
      ) : (
        <div>
          <Quote quote={quote} onAcceptSign={onAcceptSign} memoless={memoless}/>
        </div>
      )}
    </Box>
  );
};

export default BeginSwap;
