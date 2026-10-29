/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NexusProvider, useNexus } from './context/NexusContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastContainer } from './components/layout/ToastContainer';

// View modules
import { CommandCenter } from './components/command-center/CommandCenter';
import { AgentMarketplace } from './components/marketplace/AgentMarketplace';
import { ContractForge } from './components/contracts/ContractForge';
import { PayPalSentinel } from './components/sentinel/PayPalSentinel';
import { ProofEngine } from './components/proof-engine/ProofEngine';
import { TrustCrashTest } from './components/crash-test/TrustCrashTest';
import { TrustLedger } from './components/ledger/TrustLedger';
import { PaymentsEngine } from './components/payments/PaymentsEngine';

const MainContent: React.FC = () => {
  const { activePage } = useNexus();

  const renderActiveView = () => {
    switch (activePage) {
      case 'command-center':
        return <CommandCenter />;
      case 'marketplace':
        return <AgentMarketplace />;
      case 'contracts':
        return <ContractForge />;
      case 'sentinel':
        return <PayPalSentinel />;
      case 'proof-engine':
        return <ProofEngine />;
      case 'crash-test':
        return <TrustCrashTest />;
      case 'ledger':
        return <TrustLedger />;
      case 'payments':
        return <PaymentsEngine />;
      default:
        return <CommandCenter />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#080B10] text-[#E2E8F0]">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto overflow-y-auto">
        {renderActiveView()}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <NexusProvider>
      <div className="flex min-h-screen bg-[#080B10] text-[#E2E8F0] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <Sidebar />
        <MainContent />
        <CommandPalette />
        <ToastContainer />
      </div>
    </NexusProvider>
  );
}
