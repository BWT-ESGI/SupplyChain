"use client";

type PricingSectionProps = {
  onBack: () => void;
};

export function PricingSection({ onBack }: PricingSectionProps) {
  const plans = [
    {
      name: "Starter",
      price: "0€",
      period: "/mois",
      desc: "Découverte de la traçabilité blockchain",
      features: ["5 lots actifs", "Réseau Testnet", "Support email"],
      cta: "Plan Actuel",
      current: true,
    },
    {
      name: "Pro",
      price: "49€",
      period: "/mois",
      desc: "Pour les PME en production",
      features: ["Lots illimités", "Multi-validateurs", "Support 24/7", "Mainnet"],
      cta: "Passer Pro",
      current: false,
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Sur devis",
      period: "",
      desc: "Solutions sur mesure",
      features: ["Infrastructure dédiée", "API ERP", "SLA 99.9%", "Account Manager"],
      cta: "Contacter",
      current: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
      >
        <span>←</span>
        Retour
      </button>

      <div className="text-center mb-10">
        <h1 className="text-2xl font-semibold text-stone-900">Tarifs</h1>
        <p className="text-stone-500 mt-2">Choisissez le plan adapté à vos besoins</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => (
          <div
            key={plan.name}
            className={`relative bg-white border rounded-xl p-5 ${
              plan.highlight ? "border-teal-500 ring-1 ring-teal-500" : "border-stone-200"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium bg-teal-600 text-white px-2 py-0.5 rounded">
                Populaire
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold text-stone-900">{plan.name}</h3>
              <p className="text-xs text-stone-500 mt-0.5">{plan.desc}</p>
            </div>

            <div className="mb-4">
              <span className="text-2xl font-semibold text-stone-900">{plan.price}</span>
              <span className="text-stone-400 text-sm">{plan.period}</span>
            </div>

            <ul className="space-y-2 mb-5 text-sm">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-stone-600">
                  <span className="text-teal-600">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              disabled={plan.current}
              className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                plan.current
                  ? "bg-stone-100 text-stone-500 cursor-default"
                  : plan.highlight
                  ? "bg-teal-600 text-white hover:bg-teal-700"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {plan.current && "✓ "}
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Info section */}
      <div className="mt-10 bg-stone-900 text-white rounded-xl p-6">
        <h3 className="font-semibold mb-4">Pourquoi la Blockchain ?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-teal-400 font-medium mb-1">Traçabilité</div>
            <p className="text-stone-400">Historique immuable et vérifiable</p>
          </div>
          <div>
            <div className="text-teal-400 font-medium mb-1">Automatisation</div>
            <p className="text-stone-400">Smart contracts pour les validations</p>
          </div>
          <div>
            <div className="text-teal-400 font-medium mb-1">Confiance</div>
            <p className="text-stone-400">Données partagées entre partenaires</p>
          </div>
        </div>
      </div>
    </div>
  );
}
