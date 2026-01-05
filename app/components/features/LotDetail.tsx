"use client";

import { useState } from "react";
import { Lot } from "@/app/hooks/useSupplyChain";
import { FormattedDate } from "../ui/FormattedDate";

type LotDetailProps = {
  lot: Lot;
  onBack: () => void;
  onValidate: (lotId: number, stepIndex: number) => Promise<void>;
  account?: string;
};

export function LotDetail({ lot, onBack, onValidate, account }: LotDetailProps) {
  const [validatingStep, setValidatingStep] = useState<number | null>(null);
  
  const completedSteps = lot.steps.filter(s => s.status === 1).length;
  const totalSteps = lot.steps.length;
  const isFullyCompleted = completedSteps === totalSteps;

  const handleValidate = async (stepIndex: number) => {
    setValidatingStep(stepIndex);
    try {
      await onValidate(lot.id, stepIndex);
    } catch (err) {
      console.error(err);
    } finally {
      setValidatingStep(null);
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
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
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                #{lot.id}
              </span>
              {isFullyCompleted ? (
                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                  Terminé
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  En cours
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-stone-900">{lot.title}</h1>
            <p className="text-stone-500 mt-1">{lot.description}</p>
          </div>
          
          <div className="text-sm text-right">
            <div className="text-stone-400">Créé par</div>
            <div className="font-mono text-stone-600 text-xs mt-0.5">
              {lot.creator.slice(0, 8)}...{lot.creator.slice(-6)}
            </div>
            <div className="text-stone-400 mt-2">
              <FormattedDate timestamp={lot.createdAt} />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 pt-6 border-t border-stone-100">
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
      </div>

      {/* Steps */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-medium text-stone-900">Workflow de validation</h2>
        </div>
        
        <div className="divide-y divide-stone-100">
          {lot.steps.map((step, idx) => {
            const isCompleted = step.status === 1;
            const isNext = canValidateStep(idx);
            const isLocked = !isCompleted && !isNext;
            const isValidating = validatingStep === idx;

            return (
              <div 
                key={idx} 
                className={`px-6 py-4 ${isCompleted ? "bg-green-50/30" : ""}`}
              >
                <div className="flex items-start gap-4">
                  {/* Step indicator */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 mt-0.5
                    ${isCompleted ? "bg-green-500 text-white" : 
                      isNext ? "bg-teal-500 text-white" : 
                      "bg-stone-100 text-stone-400"}
                  `}>
                    {isCompleted ? "✓" : idx + 1}
                  </div>

                  {/* Content */}
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

                    {/* Validators list (collapsed by default) */}
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

                  {/* Action button */}
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

                  {isLocked && !isCompleted && (
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
    </div>
  );
}

