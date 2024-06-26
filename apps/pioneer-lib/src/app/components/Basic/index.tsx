"use client";
import { Button, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';

export interface BasicProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function Basic({ children, usePioneer }: any): JSX.Element {
    const { state, showModal } = usePioneer();
    const { app, context, assetContext } = state;
    const [pioneerUrl, setPioneerUrl] = useState('Copy');
    const [copyButtonText, setCopyButtonText] = useState('Copy');
    const [lastConnectedWallet, setLastConnectedWallet] = useState('');

  useEffect(() => {
    // Step 2: Retrieve the value in useEffect
    if (typeof window !== 'undefined') {
      const storedLastConnectedWallet = window.localStorage.getItem('lastConnectedWallet');
      setLastConnectedWallet(storedLastConnectedWallet || '');
    }
  }, []); // Empty array means this runs once on mount

    // Variable to store the timeout ID
    let timeoutId: any = null;

    const copyToClipboard = (text: any) => {
      navigator.clipboard.writeText(text);
      setCopyButtonText('Copied to Clipboard');

      // Clear any existing timeout to avoid multiple timeouts running
      if (timeoutId) clearTimeout(timeoutId);

      // Set a new timeout
      timeoutId = setTimeout(() => {
        setCopyButtonText('Copy');
      }, 2000);
    };

    useEffect(() => {
      if (typeof window !== 'undefined') {
        let pioneerUrlLocal = window.localStorage.getItem('pioneerUrl');
        setPioneerUrl(pioneerUrlLocal || '');
        // Cleanup function to clear the timeout when the component unmounts
        return () => {
          if (timeoutId) clearTimeout(timeoutId);
        };
      }
    }, []);

    return (
      <div>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Context</Th>
                <Th>Value</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>Server</Td>
                <Td>{pioneerUrl}</Td>
                <Td>
                  <Button onClick={() => showModal('ONBOARDING')} size="sm">
                    edit
                  </Button>
                </Td>
              </Tr>
              <Tr>
                <Td>Username</Td>
                <Td>{app?.username}</Td>
                <Td />
              </Tr>
              <Tr>
                <Td>QueryKey</Td>
                <Td>{app?.queryKey}</Td>
                <Td />
              </Tr>
              <Tr>
                <Td>lastConnected</Td>
                <Td>{lastConnectedWallet}</Td>
                <Td />
              </Tr>
              <Tr>
                <Td>Asset Context</Td>
                <Td>{assetContext?.caip || 'no wallets paired!'}</Td>
                <Td />
              </Tr>
              <Tr>
                <Td>Address for context</Td>
                <Td>{assetContext?.address || 'no wallets paired!'}</Td>
                <Td>
                  <Button onClick={() => copyToClipboard(assetContext.address)} size="sm">
                    {copyButtonText}
                  </Button>
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      </div>
    );
}

export default Basic;
