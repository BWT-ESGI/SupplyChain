"use client";

import { useEscrow } from "@/app/hooks/useEscrow";
import { FormattedDate } from "../ui/FormattedDate";
import { useAccount } from "wagmi";

type PaymentsPageProps = {
  onBack: () => void;
};

export function PaymentsPage({ onBack }: PaymentsPageProps) {
  const { address: account } = useAccount();
  const { 
    payments, 
    contractBalance, 
    userTotalReceived, 
    userTotalSpent,
    loading, 
    isConfigured 
  } = useEscrow();

  const myPaymentsAsBuyer = payments.filter(p => 
    account && p.buyer.toLowerCase() === account.toLowerCase()
  );
  const myPaymentsAsSeller = payments.filter(p => 
    account && p.seller.toLowerCase() === account.toLowerCase()
  );

  const pendingPayments = payments.filter(p => !p.released);

  if (!isConfigured) {
    return (
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
        >
          <span>←</span>
          Retour
        </button>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <div className="text-amber-600 font-medium">Escrow non configuré</div>
          <p className="text-sm text-amber-500 mt-2">Le contrat d'escrow n'a pas encore été déployé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
      >
        <span>←</span>
        Retour
      </button>

      <h1 className="text-2xl font-semibold text-stone-900 mb-6">Paiements</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-sm text-stone-500 mb-1">Total dépensé</div>
          <div className="text-xl font-semibold text-stone-900">{parseFloat(userTotalSpent).toFixed(6)} SepoliaETH</div>
          <div className="text-xs text-stone-400 mt-1">{myPaymentsAsBuyer.length} achat(s)</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-sm text-stone-500 mb-1">Total reçu</div>
          <div className="text-xl font-semibold text-green-600">{parseFloat(userTotalReceived).toFixed(6)} SepoliaETH</div>
          <div className="text-xs text-stone-400 mt-1">{myPaymentsAsSeller.filter(p => p.released).length} vente(s)</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-sm text-stone-500 mb-1">En attente</div>
          <div className="text-xl font-semibold text-amber-600">{pendingPayments.length}</div>
          <div className="text-xs text-stone-400 mt-1">paiement(s)</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="text-sm text-stone-500 mb-1">Solde Escrow</div>
          <div className="text-xl font-semibold text-stone-900">{parseFloat(contractBalance).toFixed(6)} SepoliaETH</div>
          <div className="text-xs text-stone-400 mt-1">Total contrat</div>
        </div>
      </div>

      {/* My purchases */}
      {myPaymentsAsBuyer.length > 0 && (
        <div className="mb-8">
          <h2 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Mes achats
          </h2>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Lot</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Vendeur</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Montant</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {myPaymentsAsBuyer.map(p => (
                  <tr key={p.lotId} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                    <td className="px-4 py-3 font-mono text-stone-600">#{p.lotId}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">
                      {p.seller.slice(0, 6)}...{p.seller.slice(-4)}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">{p.amount} SepoliaETH</td>
                    <td className="px-4 py-3">
                      {p.released ? (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">Terminé</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">En cours</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">
                      <FormattedDate timestamp={p.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My sales */}
      {myPaymentsAsSeller.length > 0 && (
        <div className="mb-8">
          <h2 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mes ventes
          </h2>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Lot</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Acheteur</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Montant</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {myPaymentsAsSeller.map(p => (
                  <tr key={p.lotId} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                    <td className="px-4 py-3 font-mono text-stone-600">#{p.lotId}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">
                      {p.buyer.slice(0, 6)}...{p.buyer.slice(-4)}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">{p.amount} SepoliaETH</td>
                    <td className="px-4 py-3">
                      {p.released ? (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">Reçu ✓</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">En attente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden sm:table-cell">
                      <FormattedDate timestamp={p.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No payments message */}
      {myPaymentsAsBuyer.length === 0 && myPaymentsAsSeller.length === 0 && !loading && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center mb-8">
          <div className="text-stone-400 mb-2">
            <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-stone-600 font-medium">Aucune transaction</p>
          <p className="text-sm text-stone-400 mt-1">Achetez ou vendez des lots pour voir vos transactions ici</p>
        </div>
      )}

      {/* All payments history */}
      {payments.length > 0 && (
        <div>
          <h2 className="font-medium text-stone-900 mb-4">Historique global</h2>
          {loading ? (
            <div className="py-8 text-center text-stone-400">Chargement...</div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="text-left px-4 py-3 font-medium text-stone-500">Lot</th>
                    <th className="text-left px-4 py-3 font-medium text-stone-500 hidden sm:table-cell">Acheteur</th>
                    <th className="text-left px-4 py-3 font-medium text-stone-500 hidden sm:table-cell">Vendeur</th>
                    <th className="text-left px-4 py-3 font-medium text-stone-500">Montant</th>
                    <th className="text-left px-4 py-3 font-medium text-stone-500">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={`${p.lotId}-${p.createdAt}`} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                      <td className="px-4 py-3 font-mono text-stone-600">#{p.lotId}</td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-400 hidden sm:table-cell">
                        {p.buyer.slice(0, 6)}...{p.buyer.slice(-4)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-400 hidden sm:table-cell">
                        {p.seller.slice(0, 6)}...{p.seller.slice(-4)}
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-900">{p.amount} SepoliaETH</td>
                      <td className="px-4 py-3">
                        {p.released ? (
                          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">Libéré</span>
                        ) : (
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Escrow</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
