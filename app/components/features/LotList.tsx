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
          <h1 className="text-2xl font-semibold text-stone-900">Lots</h1>
          <p className="text-sm text-stone-500 mt-0.5">{stats.total} lot{stats.total > 1 ? 's' : ''} enregistré{stats.total > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          Nouveau lot
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
          {[
            { key: "all" as Filter, label: "Tous", count: stats.total },
            { key: "pending" as Filter, label: "En cours", count: stats.pending },
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
            {lots.length === 0 ? "Aucun lot créé" : "Aucun résultat"}
          </div>
          {lots.length === 0 && (
            <button onClick={onCreate} className="mt-3 text-teal-600 text-sm font-medium hover:underline">
              Créer votre premier lot
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="text-left px-4 py-3 font-medium text-stone-500">ID</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Lot</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 hidden md:table-cell">Créateur</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Avancement</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.map(lot => {
                const progress = getProgress(lot);
                const done = isLotCompleted(lot);
                
                return (
                  <tr 
                    key={lot.id} 
                    onClick={() => onSelect(lot)}
                    className="border-b border-stone-50 last:border-0 hover:bg-stone-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-stone-400">#{lot.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900">{lot.title}</div>
                      <div className="text-stone-400 text-xs mt-0.5 line-clamp-1">{lot.description}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-stone-400">
                        {lot.creator.slice(0, 6)}...{lot.creator.slice(-4)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-stone-500">
                      <FormattedDate timestamp={lot.createdAt} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${done ? "bg-green-500" : "bg-teal-500"}`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${done ? "text-green-600" : "text-stone-500"}`}>
                          {progress.completed}/{progress.total}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

