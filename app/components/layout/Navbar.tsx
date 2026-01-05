"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

type NavbarProps = {
  onHomeClick?: () => void;
  onPricingClick?: () => void;
  onPaymentsClick?: () => void;
};

export function Navbar({ onHomeClick, onPricingClick, onPaymentsClick }: NavbarProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-6 h-14 flex justify-between items-center">
        {/* Logo */}
        <button onClick={onHomeClick} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <div className="w-7 h-7 bg-teal-600 rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <span className="font-semibold text-stone-900">SupplyChain</span>
        </button>

        {/* Right */}
        <div className="flex items-center gap-6">
          {isConnected && (
            <button
              onClick={onPaymentsClick}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Paiements
            </button>
          )}
          
          <button
            onClick={onPricingClick}
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            Tarifs
          </button>

          {isConnected && address ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="font-mono text-stone-600 text-xs">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
              <button
                onClick={() => disconnect()}
                className="text-xs text-stone-400 hover:text-red-500 transition-colors"
              >
                Déconnecter
              </button>
            </div>
          ) : (
            <button
              onClick={() => connectors[0] && connect({ connector: connectors[0] })}
              className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Connecter
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
