"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FaCoins, FaCheck, FaSpinner, FaGoogle, FaExclamationTriangle,
  FaCheckCircle, FaGlobe, FaChevronRight, FaArrowLeft, FaShieldAlt
} from "react-icons/fa";
import Link from "next/link";

// Plan info from config, or fallback standard packages
const plansList = [
  {
    id: "basic",
    name: "Basic Pack",
    credits: 1000,
    price: 5, // in dollars for display
    audits: Math.floor(1000 / 18),
    description: "Ideal for small websites and initial trial checks.",
    popular: false,
    color: "from-blue-600 to-indigo-500",
    glow: "shadow-blue-500/10",
    features: [
      "1,000 Visibility Credits",
      "Perform ~55 complete GEO audits",
      "Verify robots.txt, schema, and sitemap rules",
      "Export reports in raw JSON format",
      "Lifetime access to report gallery history"
    ]
  },
  {
    id: "standard",
    name: "Standard Pack",
    credits: 2000,
    price: 10,
    audits: Math.floor(2000 / 18),
    description: "Perfect for growing brands and content editors.",
    popular: false,
    color: "from-indigo-600 to-violet-500",
    glow: "shadow-indigo-500/10",
    features: [
      "2,000 Visibility Credits",
      "Perform ~111 complete GEO audits",
      "Verify robots.txt, schema, and sitemap rules",
      "Export reports in raw JSON format",
      "Lifetime access to report gallery history",
      "Priority simulation queue processing"
    ]
  },
  {
    id: "pro",
    name: "Professional Pack",
    credits: 4000,
    price: 20,
    audits: Math.floor(4000 / 18),
    description: "Best value for agencies and search consultants.",
    popular: true,
    color: "from-violet-600 to-fuchsia-600",
    glow: "shadow-violet-500/20",
    features: [
      "4,000 Visibility Credits",
      "Perform ~222 complete GEO audits",
      "Verify robots.txt, schema, and sitemap rules",
      "Export reports in raw JSON format",
      "Lifetime access to report gallery history",
      "Priority simulation queue processing",
      "Deep semantic E-E-A-T audit analysis"
    ]
  },
  {
    id: "business",
    name: "Business Pack",
    credits: 10000,
    price: 50,
    audits: Math.floor(10000 / 18),
    description: "Designed for enterprise scale and bulk audits.",
    popular: false,
    color: "from-fuchsia-600 to-pink-500",
    glow: "shadow-fuchsia-500/10",
    features: [
      "10,000 Visibility Credits",
      "Perform ~555 complete GEO audits",
      "Verify robots.txt, schema, and sitemap rules",
      "Export reports in raw JSON format",
      "Lifetime access to report gallery history",
      "Priority simulation queue processing",
      "Deep semantic E-E-A-T audit analysis",
      "Dedicated enterprise API capacity access"
    ]
  }
];

function PricingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState(null); // ID of plan that is currently purchasing

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  const handlePurchase = async (planId) => {
    if (!session?.user) {
      signIn("google");
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });

      if (!res.ok) throw new Error("Stripe checkout session failed to create");
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Missing url in checkout session response");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initiate Stripe Checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-200 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Breadcrumb / Return Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors group cursor-pointer"
          >
            <FaArrowLeft className="text-[10px] group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Studio</span>
          </Link>
        </div>

        {/* Dynamic Alerts for checkout completion feedback */}
        {success && (
          <div className="mb-8 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-3.5 max-w-3xl mx-auto shadow-lg animate-in fade-in slide-in-from-top-4 duration-250">
            <FaCheckCircle className="text-emerald-400 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">Payment Successful!</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Your credits have been added successfully. It may take a minute to synchronize with your active header session. Return to the studio to start audits.
              </p>
            </div>
          </div>
        )}

        {canceled && (
          <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-start gap-3.5 max-w-3xl mx-auto shadow-lg animate-in fade-in slide-in-from-top-4 duration-250">
            <FaExclamationTriangle className="text-amber-400 text-lg flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">Payment Canceled</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                The transaction was cancelled. No credits were deducted and you have not been charged.
              </p>
            </div>
          </div>
        )}

        {/* Pricing Header Title and Info Banner */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/35 border border-violet-800/40 text-violet-300 text-[10px] font-bold uppercase tracking-wider mb-4">
            <FaCoins className="text-amber-400" /> 18 Credits Per Audit
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-white tracking-tight leading-tight">
            Purchase Credits for Deep GEO Audits
          </h1>
          
          <p className="text-sm sm:text-base text-zinc-400 mt-4 leading-relaxed font-medium">
            Acquire credits to run simulated generative search engine analyses. Understand exactly how your page is interpreted, structured, and quoted on ChatGPT, Perplexity, and Google.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="bg-zinc-900 border border-zinc-800/80 px-4.5 py-3 rounded-xl inline-flex items-center gap-3 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs text-zinc-300 font-bold">
                1 Credit Pack = Lifetime Access. Audits cost exactly 18 credits.
              </span>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plansList.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-zinc-900 border rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all hover:scale-[1.01] hover:border-zinc-700 ${
                plan.popular ? "border-violet-600 shadow-violet-500/20" : "border-zinc-800"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[9px] font-extrabold uppercase px-3 py-1 rounded-full border border-violet-500 shadow-md tracking-wider">
                  Most Popular
                </span>
              )}

              <div>
                {/* Title */}
                <h3 className="text-base font-extrabold font-heading text-white tracking-tight">
                  {plan.name}
                </h3>
                
                {/* Price Display */}
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-3xl font-black text-white">${plan.price}</span>
                  <span className="text-xs font-bold text-zinc-500">one-time</span>
                </div>

                {/* Credits / Audits Indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-950/25 border border-amber-800/20 px-3 py-2 rounded-xl">
                  <FaCoins className="text-amber-400 text-sm flex-shrink-0" />
                  <span>
                    {plan.credits.toLocaleString()} Credits (~{plan.audits} Audits)
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mt-4 leading-relaxed font-semibold">
                  {plan.description}
                </p>

                <div className="h-px bg-zinc-800/80 my-5" />

                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed font-semibold">
                      <FaCheck className="text-violet-400 text-[10px] flex-shrink-0 mt-1" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Purchase Button Action */}
              <div className="mt-8 pt-4 border-t border-zinc-800/50">
                <button
                  onClick={() => handlePurchase(plan.id)}
                  disabled={loadingPlan !== null}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold text-white cursor-pointer transition-all active:scale-[0.98] ${
                    plan.popular
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/10"
                      : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <FaSpinner className="animate-spin text-xs" />
                      <span>Creating Checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>Get {plan.name}</span>
                      <FaChevronRight className="text-[9px]" />
                    </>
                  )}
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Security & Support Badges */}
        <div className="border-t border-zinc-800 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto text-zinc-500 text-xs font-bold">
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-zinc-500 text-base" />
            <span>Secure 256-bit SSL encrypted credit card payments processed via Stripe.</span>
          </div>
          <div className="flex items-center gap-5">
            <span>Refund Policy</span>
            <span className="h-1 w-1 rounded-full bg-zinc-700" />
            <span>Enterprise Custom Pricing</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-300">
          <FaSpinner className="animate-spin text-3xl text-violet-400 mb-4" />
          <p className="text-sm font-medium">Loading pricing options...</p>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
