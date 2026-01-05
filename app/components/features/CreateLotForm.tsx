"use client";

import { useState } from "react";
import { CreateLotParams } from "@/app/hooks/useSupplyChain";

type StepInput = { desc: string; validators: string };

type CreateLotFormProps = {
  onCreate: (params: CreateLotParams) => Promise<void>;
  onCancel: () => void;
};

export function CreateLotForm({ onCreate, onCancel }: CreateLotFormProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("unités");
  const [origin, setOrigin] = useState("");
  const [steps, setSteps] = useState<StepInput[]>([{ desc: "Production", validators: "" }]);
  const [loading, setLoading] = useState(false);

  const addStep = () => setSteps([...steps, { desc: "", validators: "" }]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: keyof StepInput, value: string) => {
    const updated = [...steps];
    updated[i][field] = value;
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim() || !quantity) return;
    
    setLoading(true);
    try {
      await onCreate({
        title,
        description: desc,
        quantity: parseInt(quantity),
        unit,
        origin,
        stepDescriptions: steps.map(s => s.desc).filter(Boolean),
        stepValidators: steps.map(s => 
          s.validators.split(",").map(v => v.trim()).filter(v => v.length > 0)
        ),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={onCancel}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
      >
        <span>←</span>
        Retour
      </button>

      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-6">Créer un lot</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Nom du lot *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Vaccins Lot #402"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Description *
              </label>
              <input
                type="text"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Détails du lot"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          {/* Quantity, Unit, Origin */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Quantité *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="100"
                min="1"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Unité
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
              >
                <option value="unités">Unités</option>
                <option value="kg">Kilogrammes</option>
                <option value="L">Litres</option>
                <option value="m³">Mètres cubes</option>
                <option value="palettes">Palettes</option>
                <option value="cartons">Cartons</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Origine
              </label>
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                placeholder="France"
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-stone-700">
                Étapes de validation
              </label>
              <button
                type="button"
                onClick={addStep}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                + Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 bg-stone-50 rounded-lg">
                  <div className="w-6 h-6 bg-stone-200 rounded flex items-center justify-center text-xs font-medium text-stone-500 shrink-0 mt-1">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={step.desc}
                      onChange={e => updateStep(idx, "desc", e.target.value)}
                      placeholder="Nom de l'étape"
                      className="w-full px-3 py-1.5 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:border-teal-500"
                    />
                    <input
                      type="text"
                      value={step.validators}
                      onChange={e => updateStep(idx, "validators", e.target.value)}
                      placeholder="Adresses validateurs (virgule). Vide = tous"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-stone-200 rounded-md focus:outline-none focus:border-teal-500 text-stone-500"
                    />
                  </div>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="text-stone-400 hover:text-red-500 transition-colors p-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim() || !desc.trim() || !quantity}
              className="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Création..." : "Créer le lot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
