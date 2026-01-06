"use client";

import { useState, useMemo } from "react";
import { Lot } from "@/app/hooks/useSupplyChain";
import { FormattedDate } from "../ui/FormattedDate";

type Filter = "all" | "pending" | "completed" | "mine";

type LotListProps = {
  lots: Lot[];
  account?: string;
  onSelect: (lot: Lot) => void;
  onCreate: () => void;
  loading?: boolean;
};

function getProgress(lot: Lot): { completed: number; total: number; percent: number } {
  const total = lot.steps.length;
  const completed = lot.steps.filter(s => s.status === 1).length;
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

function isLotCompleted(lot: Lot): boolean {
  return lot.steps.length > 0 && lot.steps.every(s => s.status === 1);
}

export function LotList({ lots, account, onSelect, onCreate, loading }: LotListProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      const matchSearch = search === "" || 
        lot.title.toLowerCase().includes(search.toLowerCase()) ||
        lot.id.toString().includes(search);
      
      if (!matchSearch) return false;
      
      if (filter === "mine") return account && lot.creator.toLowerCase() === account.toLowerCase();
      if (filter === "completed") return isLotCompleted(lot);
      if (filter === "pending") return !isLotCompleted(lot);
      return true;
    });
  }, [lots, filter, search, account]);

  const stats = useMemo(() => ({
    total: lots.length,
    completed: lots.filter(isLotCompleted).length,
    pending: lots.filter(l => !isLotCompleted(l)).length,
    mine: account ? lots.filter(l => l.creator.toLowerCase() === account.toLowerCase()).length : 0
  }), [lots, account]);

  return (
    <div className="space-y-6">
      {/* Header compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Marketplace</h1>
          <p className="text-sm text-stone-500 mt-0.5">{stats.total} lot{stats.total > 1 ? 's' : ''} disponible{stats.total > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          Vendre un lot
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
          {[
            { key: "all" as Filter, label: "Tous", count: stats.total },
            { key: "pending" as Filter, label: "Actifs", count: stats.pending },
            { key: "completed" as Filter, label: "Terminés", count: stats.completed },
            ...(account ? [{ key: "mine" as Filter, label: "Mes lots", count: stats.mine }] : [])
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                filter === f.key 
                  ? "bg-white text-stone-900 shadow-sm" 
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs text-stone-400">
                {f.count}
              </span>
            </button>
          ))}
        </div>
        
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-stone-400">Chargement...</div>
      ) : filteredLots.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-stone-400 text-sm">
            {lots.length === 0 ? "Aucun lot en vente" : "Aucun résultat"}
          </div>
          {lots.length === 0 && (
            <button onClick={onCreate} className="mt-3 text-teal-600 text-sm font-medium hover:underline">
              Mettre en vente votre premier lot
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLots.map(lot => {
            const progress = getProgress(lot);
            const done = isLotCompleted(lot);
            
            return (
              <div
                key={lot.id}
                onClick={() => onSelect(lot)}
                className="bg-white border border-stone-200 rounded-xl p-5 hover:shadow-lg hover:border-teal-200 cursor-pointer transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                    #{lot.id}
                  </span>
                  {done ? (
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                      Terminé
                    </span>
                  ) : progress.completed === 0 ? (
                    <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      En vente
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      En cours
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-stone-900 mb-1 truncate">{lot.title}</h3>
                <p className="text-sm text-stone-500 line-clamp-2 mb-3">{lot.description}</p>

                {/* Details */}
                <div className="flex items-center gap-3 text-xs text-stone-400 mb-4">
                  {lot.quantity > 0 && (
                    <span>{lot.quantity} {lot.unit}</span>
                  )}
                  {lot.origin && (
                    <span>· {lot.origin}</span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-end justify-between pt-3 border-t border-stone-100">
                  <div>
                    <div className="text-xs text-stone-400">Prix</div>
                    <div className="text-lg font-bold text-teal-600">{lot.price} SepoliaETH</div>
                  </div>
                  {!done && progress.completed > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-stone-400 mb-1">Progression</div>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-teal-500"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-stone-500">{progress.completed}/{progress.total}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Seller */}
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400">Vendeur</span>
                  <span className="font-mono text-stone-500">
                    {lot.creator.slice(0, 6)}...{lot.creator.slice(-4)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
