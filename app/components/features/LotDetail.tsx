"use client";

import { useState, useEffect } from "react";
import { Lot } from "@/app/hooks/useSupplyChain";
import { useEscrow, Payment } from "@/app/hooks/useEscrow";
import { FormattedDate } from "../ui/FormattedDate";
import { QRCodeModal } from "../ui/QRCodeModal";

type LotDetailProps = {
  lot: Lot;
  onBack: () => void;
  onValidate: (lotId: number, stepIndex: number) => Promise<void>;
  account?: string;
};

type LotStatus = "for_sale" | "in_progress" | "completed";

export function LotDetail({ lot, onBack, onValidate, account }: LotDetailProps) {
  const [validatingStep, setValidatingStep] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(true);

  const { depositPayment, releasePayment, getPaymentForLot, isConfigured } = useEscrow();
  
  const completedSteps = lot.steps.filter(s => s.status === 1).length;
  const totalSteps = lot.steps.length;
  const isFullyCompleted = completedSteps === totalSteps && totalSteps > 0;
  const isCreator = account && lot.creator.toLowerCase() === account.toLowerCase();

  const getLotStatus = (): LotStatus => {
    if (isFullyCompleted) return "completed";
    if (payment && !payment.released) return "in_progress";
    return "for_sale";
  };
  const lotStatus = getLotStatus();

  useEffect(() => {
    const fetchPayment = async () => {
      setLoadingPayment(true);
      const p = await getPaymentForLot(lot.id);
      setPayment(p);
      setLoadingPayment(false);
    };
    if (isConfigured) fetchPayment();
    else setLoadingPayment(false);
  }, [lot.id, getPaymentForLot, isConfigured]);

  const handleValidate = async (stepIndex: number) => {
    setValidatingStep(stepIndex);
    try {
      await onValidate(lot.id, stepIndex);
      const p = await getPaymentForLot(lot.id);
      setPayment(p);
    } catch (err) {
      console.error(err);
    } finally {
      setValidatingStep(null);
    }
  };

  const handlePurchase = async () => {
    if (lot.priceWei === BigInt(0)) return;
    setPaymentLoading(true);
    try {
      await depositPayment(lot.id, lot.priceWei);
      const p = await getPaymentForLot(lot.id);
      setPayment(p);
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRelease = async () => {
    setPaymentLoading(true);
    try {
      await releasePayment(lot.id);
      const p = await getPaymentForLot(lot.id);
      setPayment(p);
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const canValidateStep = (stepIndex: number) => {
    const step = lot.steps[stepIndex];
    if (step.status === 1) return false;
    if (stepIndex > 0 && lot.steps[stepIndex - 1].status !== 1) return false;
    if (step.validators.length === 0) return true;
    if (!account) return false;
    return step.validators.some(v => v.toLowerCase() === account.toLowerCase());
  };

  const statusConfig = {
    for_sale: { label: "En vente", color: "text-blue-700 bg-blue-50" },
    in_progress: { label: "En cours", color: "text-amber-700 bg-amber-50" },
    completed: { label: "Terminé", color: "text-green-700 bg-green-50" },
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
      >
        <span>←</span>
        Retour à la liste
      </button>

      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                #{lot.id}
              </span>
              {!loadingPayment && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusConfig[lotStatus].color}`}>
                  {statusConfig[lotStatus].label}
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-stone-900">{lot.title}</h1>
            <p className="text-stone-500 mt-1">{lot.description}</p>

            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2 text-stone-600">
                <span className="text-stone-400">Quantité:</span>
                <span className="font-medium">{lot.quantity} {lot.unit}</span>
              </div>
              {lot.origin && (
                <div className="flex items-center gap-2 text-stone-600">
                  <span className="text-stone-400">Origine:</span>
                  <span className="font-medium">{lot.origin}</span>
                </div>
              )}
            </div>

            {/* Price display */}
            <div className="mt-4 p-3 bg-teal-50 rounded-lg inline-block">
              <div className="text-xs text-teal-600 font-medium">Prix fixé par le vendeur</div>
              <div className="text-2xl font-bold text-teal-700">{lot.price} ETH</div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              QR Code
            </button>

            <div className="text-sm text-right">
              <div className="text-stone-400">Vendeur</div>
              <div className="font-mono text-stone-600 text-xs mt-0.5">
                {lot.creator.slice(0, 8)}...{lot.creator.slice(-6)}
              </div>
              <div className="text-stone-400 mt-2">
                <FormattedDate timestamp={lot.createdAt} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Section */}
      {isConfigured && lotStatus === "for_sale" && !isCreator && (
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-stone-900 mb-1">Acheter ce lot</h3>
              <p className="text-sm text-stone-600 mb-4">
                Paiement sécurisé en escrow. Les fonds seront libérés au vendeur uniquement après validation de toutes les étapes.
              </p>
              <button
                onClick={handlePurchase}
                disabled={paymentLoading}
                className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {paymentLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Achat en cours...
                  </>
                ) : (
                  <>
                    <span>Acheter pour {lot.price} ETH</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for buyer */}
      {isConfigured && lotStatus === "for_sale" && isCreator && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 mb-6 text-center">
          <div className="text-stone-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-stone-600 font-medium">En attente d'un acheteur</p>
          <p className="text-sm text-stone-400 mt-1">Partagez le QR code pour trouver un acheteur</p>
        </div>
      )}

      {/* Payment info */}
      {isConfigured && payment && !payment.released && lotStatus !== "for_sale" && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
          <h2 className="font-medium text-stone-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Paiement sécurisé
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-stone-50 rounded-lg">
            <div>
              <div className="text-xs text-stone-400">Montant</div>
              <div className="text-lg font-semibold text-stone-900">{payment.amount} ETH</div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Acheteur</div>
              <div className="font-mono text-xs text-stone-600 mt-1">
                {payment.buyer.slice(0, 6)}...{payment.buyer.slice(-4)}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Statut</div>
              <span className="text-sm font-medium text-amber-600">En escrow</span>
            </div>
            <div>
              <div className="text-xs text-stone-400">Date d'achat</div>
              <div className="text-sm text-stone-600">
                <FormattedDate timestamp={payment.createdAt} />
              </div>
            </div>
          </div>

          {isFullyCompleted && (
            <button
              onClick={handleRelease}
              disabled={paymentLoading}
              className="w-full mt-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {paymentLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Libération...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Libérer le paiement au vendeur
                </>
              )}
            </button>
          )}

          {!isFullyCompleted && (
            <p className="text-sm text-stone-500 text-center mt-4">
              Le paiement sera libéré après validation de toutes les étapes
            </p>
          )}
        </div>
      )}

      {/* Payment released */}
      {payment && payment.released && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-800">Paiement transféré</p>
              <p className="text-sm text-green-600">
                {payment.amount} ETH envoyé le <FormattedDate timestamp={payment.releasedAt} mode="full" />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {(lotStatus === "in_progress" || lotStatus === "completed") && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-stone-500">Progression</span>
            <span className="font-medium text-stone-700">{completedSteps} / {totalSteps} étapes</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isFullyCompleted ? "bg-green-500" : "bg-teal-500"}`}
              style={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-medium text-stone-900">Workflow de validation</h2>
        </div>
        
        <div className="divide-y divide-stone-100">
          {lot.steps.map((step, idx) => {
            const isCompleted = step.status === 1;
            const isNext = canValidateStep(idx) && lotStatus !== "for_sale";
            const isLocked = !isCompleted && !isNext;
            const isValidating = validatingStep === idx;

            return (
              <div 
                key={idx} 
                className={`px-6 py-4 ${isCompleted ? "bg-green-50/30" : ""}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 mt-0.5
                    ${isCompleted ? "bg-green-500 text-white" : 
                      isNext ? "bg-teal-500 text-white" : 
                      "bg-stone-100 text-stone-400"}
                  `}>
                    {isCompleted ? "✓" : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${isCompleted ? "text-stone-700" : isLocked ? "text-stone-400" : "text-stone-900"}`}>
                        {step.description}
                      </h3>
                    </div>

                    {isCompleted ? (
                      <div className="text-xs text-stone-500">
                        Validé par{" "}
                        <span className="font-mono">{step.validatedBy.slice(0, 6)}...{step.validatedBy.slice(-4)}</span>
                        {" "}le <FormattedDate timestamp={step.validatedAt} mode="time" />
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400">
                        {step.validators.length > 0 ? (
                          <span>{step.validators.length} validateur{step.validators.length > 1 ? "s" : ""} autorisé{step.validators.length > 1 ? "s" : ""}</span>
                        ) : (
                          <span>Ouvert à tous</span>
                        )}
                      </div>
                    )}

                    {!isCompleted && step.validators.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-teal-600 cursor-pointer hover:text-teal-700">
                          Voir les adresses
                        </summary>
                        <div className="mt-2 space-y-1">
                          {step.validators.map((v, i) => (
                            <div key={i} className="text-xs font-mono text-stone-500 bg-stone-50 px-2 py-1 rounded">
                              {v}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  {isNext && (
                    <button
                      onClick={() => handleValidate(idx)}
                      disabled={isValidating}
                      className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isValidating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>Validation...</span>
                        </>
                      ) : (
                        "Valider"
                      )}
                    </button>
                  )}

                  {lotStatus === "for_sale" && !isCompleted && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Après achat
                    </span>
                  )}

                  {isLocked && !isCompleted && lotStatus !== "for_sale" && (
                    <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded">
                      En attente
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <QRCodeModal
          lotId={lot.id}
          lotTitle={lot.title}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}
