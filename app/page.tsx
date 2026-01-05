"use client";

import { useState, useEffect } from "react";
import { useConnect } from "wagmi";
import { useSupplyChain, Lot } from "@/app/hooks/useSupplyChain";
import { Navbar } from "@/app/components/layout/Navbar";
import { LotList } from "@/app/components/features/LotList";
import { LotDetail } from "@/app/components/features/LotDetail";
import { CreateLotForm } from "@/app/components/features/CreateLotForm";
import { PricingSection } from "@/app/components/features/PricingSection";

type View = "list" | "detail" | "create" | "pricing";

export default function Home() {
  const { account, lots, loading, createLot, validateStep } = useSupplyChain();
  const { connect, connectors } = useConnect();

  const [view, setView] = useState<View>("list");
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  // Récupère le lot sélectionné depuis la liste mise à jour
  const selectedLot = selectedLotId !== null 
    ? lots.find(l => l.id === selectedLotId) || null 
    : null;

  // Si le lot sélectionné n'existe plus, retourner à la liste
  useEffect(() => {
    if (view === "detail" && selectedLotId !== null && !selectedLot) {
      setView("list");
      setSelectedLotId(null);
    }
  }, [view, selectedLotId, selectedLot]);

  const handleSelectLot = (lot: Lot) => {
    setSelectedLotId(lot.id);
    setView("detail");
  };

  const handleCreate = async (title: string, desc: string, stepDescs: string[], stepValidators: string[][]) => {
    await createLot(title, desc, stepDescs, stepValidators);
    setView("list");
  };

  const handleBack = () => {
    setSelectedLotId(null);
    setView("list");
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar
        onHomeClick={handleBack}
        onPricingClick={() => setView("pricing")}
      />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!account && view !== "pricing" ? (
          <div className="py-16 text-center">
            <div className="text-stone-400 mb-4">Connectez votre wallet pour accéder à vos lots</div>
            <button
              onClick={() => connectors[0] && connect({ connector: connectors[0] })}
              className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Connecter Metamask
            </button>
          </div>
        ) : (
          <>
            {view === "list" && (
              <LotList
                lots={lots}
                account={account}
                loading={loading}
                onSelect={handleSelectLot}
                onCreate={() => setView("create")}
              />
            )}

            {view === "detail" && selectedLot && (
              <LotDetail
                lot={selectedLot}
                account={account}
                onBack={handleBack}
                onValidate={validateStep}
              />
            )}

            {view === "create" && (
              <CreateLotForm
                onCreate={handleCreate}
                onCancel={handleBack}
              />
            )}

            {view === "pricing" && (
              <PricingSection onBack={handleBack} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
