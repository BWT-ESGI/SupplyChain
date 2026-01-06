"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

type NavbarProps = {
  onHomeClick?: () => void;
  onPricingClick?: () => void;
};

export function Navbar({ onHomeClick, onPricingClick }: NavbarProps) {
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
