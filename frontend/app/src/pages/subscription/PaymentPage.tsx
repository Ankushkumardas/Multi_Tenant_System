import { useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/axios";

type PlanId = "FREE" | "PRO" | "ENTERPRISE";

type SignupPayload = {
  name: string;
  email: string;
  password: string;
  companyName: string;
  plan: PlanId;
};

type PaymentLocationState =
  | {
      mode: "signup";
      planId: PlanId;
      planName: string;
      priceLabel: string;
      tagline: string;
      signupData: SignupPayload;
    }
  | {
      mode: "change";
      slug: string;
      planId: string;
      planName: string;
      priceLabel: string;
      tagline?: string;
    };

const PaymentPage = () => {
  const { slug: slugFromParams } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as PaymentLocationState | null;

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const isValidState = state && (state.mode === "signup" || state.mode === "change");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isValidState) {
        throw new Error("Missing payment session information.");
      }

      if (!cardName || !cardNumber || !expiry || !cvc) {
        throw new Error("Please fill in all payment details.");
      }

      if (state.mode === "signup") {
        const res = await api.post("/auth/register-owner", state.signupData);
        return { context: "signup" as const, data: res.data };
      }

      const slug = state.slug || slugFromParams;
      if (!slug) {
        throw new Error("Workspace slug missing.");
      }

      const res = await api.post(`/${slug}/subscription/change-plan`, {
        newplan: state.planName,
      });

      return { context: "change" as const, data: res.data, slug };
    },
    onSuccess: (result) => {
      if (result.context === "signup") {
        const { data } = result;
        navigate("/verify-email", {
          state: { email: data.user?.email ?? data?.signupData?.email },
        });
      } else {
        navigate(`/${result.slug}/settings/subscription`, { replace: true });
      }
    },
  });

  if (!isValidState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 font-[Inter,sans-serif]">
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm max-w-md w-full text-center">
          <p className="text-sm text-gray-700 font-medium mb-1">
            Payment session not found
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Please start again from the signup flow or billing page.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-gray-700 transition-colors"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  const isSignup = state.mode === "signup";
  const planName = state.planName;
  const priceLabel = state.priceLabel;
  const tagline = state.tagline;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-[Inter,sans-serif]">
      {/* Top bar */}
      <header className="px-6 py-4 border-b border-gray-100 bg-white/70 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shadow-sm">
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z"
                />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-[14px] tracking-tight">
              FlowSpace
            </span>
          </Link>

          <p className="text-[11px] text-gray-400 hidden sm:block">
            Secured demo checkout — no real charges
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-8 items-start">
          {/* Payment form */}
          <section className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm relative overflow-hidden">
            <div className="absolute -top-24 -right-16 w-64 h-64 bg-gray-900/3 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">
                {isSignup ? "Complete your signup" : "Confirm plan change"}
              </h1>
              <p className="text-[13px] text-gray-400 mb-6">
                Enter a few basic payment details to{" "}
                {isSignup ? "create your workspace." : "switch your workspace plan."}{" "}
                This is a simulated payment — nothing will be charged.
              </p>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="card-name"
                    className="block text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-widest"
                  >
                    Name on card
                  </label>
                  <input
                    id="card-name"
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                    placeholder="Jane Smith"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="card-number"
                    className="block text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-widest"
                  >
                    Card number
                  </label>
                  <input
                    id="card-number"
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                    placeholder="4242 4242 4242 4242"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="card-expiry"
                      className="block text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-widest"
                    >
                      Expiry
                    </label>
                    <input
                      id="card-expiry"
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                      placeholder="MM / YY"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="card-cvc"
                      className="block text-[11px] font-semibold text-gray-600 mb-1.5 uppercase tracking-widest"
                    >
                      CVC
                    </label>
                    <input
                      id="card-cvc"
                      type="password"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="w-full h-10 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full h-11 mt-2 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {mutation.isPending
                    ? "Processing..."
                    : isSignup
                    ? `Start ${planName} plan`
                    : `Confirm ${planName} plan`}
                </button>

                {mutation.isError && (
                  <p className="text-[12px] text-red-500 mt-2 text-center">
                    {(mutation.error as Error).message || "Payment failed. Please try again."}
                  </p>
                )}
              </form>

              <p className="mt-4 text-[11px] text-gray-400">
                This is a demo checkout flow for testing subscription logic. No
                card information is stored or transmitted to a payment provider.
              </p>
            </div>
          </section>

          {/* Plan summary */}
          <aside className="space-y-4">
            <div className="bg-gray-900 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute -top-10 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-semibold mb-1">
                  Selected plan
                </p>
                <h2 className="text-2xl font-semibold tracking-tight mb-1">
                  {planName}
                </h2>
                <p className="text-sm text-gray-300 mb-4">{tagline}</p>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold">{priceLabel}</span>
                  {priceLabel !== "$0" && (
                    <span className="text-[11px] text-gray-400">/ month</span>
                  )}
                </div>

                <ul className="space-y-1.5 text-[12px] text-gray-200">
                  <li>• Unlimited access during the billing period</li>
                  <li>• Team collaboration tools included</li>
                  <li>• Cancel or change plan anytime</li>
                </ul>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-[12px] text-gray-500">
              <p className="font-semibold text-gray-800 mb-1">
                Need a purchase order or invoice?
              </p>
              <p className="mb-2">
                This sandbox flow is designed to test your billing experience.
                In production, you can connect Stripe, Razorpay or any other
                gateway here.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;

