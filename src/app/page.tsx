"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { trackProductEvent } from "./analytics";

type Offer = {
  id: string;
  company: string;
  role: string;
  baseSalary: number;
  equity: number;
  bonus: number;
  notes: string;
};

type SortKey = "total" | "company" | "role";

type OfferForm = Omit<Offer, "id">;

const storageKey = "offerlookup.offers.v1";
const offersChangedEvent = "offerlookup:offers-changed";

const emptyForm: OfferForm = {
  company: "",
  role: "",
  baseSalary: 0,
  equity: 0,
  bonus: 0,
  notes: "",
};

const sampleOffers: Offer[] = [
  {
    id: "sample-1",
    company: "Northstar Labs",
    role: "Senior Product Designer",
    baseSalary: 182000,
    equity: 48000,
    bonus: 0,
    notes: "Strong equity package, remote-friendly.",
  },
  {
    id: "sample-2",
    company: "Harbor AI",
    role: "Full-stack Engineer",
    baseSalary: 168000,
    equity: 35000,
    bonus: 12000,
    notes: "Higher upside, earlier-stage risk.",
  },
  {
    id: "sample-3",
    company: "Atlas Health",
    role: "Product Manager",
    baseSalary: 154000,
    equity: 0,
    bonus: 22000,
    notes: "Stable cash comp and mature benefits.",
  },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function totalCompensation(offer: Offer) {
  return offer.baseSalary + offer.equity + offer.bonus;
}

function parseMoney(value: string) {
  return Number(value) || 0;
}

function isOffer(value: unknown): value is Offer {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.company === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.baseSalary === "number" &&
    typeof candidate.equity === "number" &&
    typeof candidate.bonus === "number" &&
    typeof candidate.notes === "string"
  );
}

function getStoredOffersSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(storageKey) ?? "[]";
}

function subscribeToStoredOffers(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(offersChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(offersChangedEvent, onStoreChange);
  };
}

function parseStoredOffers(snapshot: string) {
  let parsedOffers: unknown;

  try {
    parsedOffers = JSON.parse(snapshot);
  } catch {
    return [];
  }

  if (Array.isArray(parsedOffers) && parsedOffers.every(isOffer)) {
    return parsedOffers;
  }

  return [];
}

function saveOffers(offers: Offer[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(offers));
  window.dispatchEvent(new Event(offersChangedEvent));
}

export default function Home() {
  const [form, setForm] = useState<OfferForm>(emptyForm);
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const offersSnapshot = useSyncExternalStore(
    subscribeToStoredOffers,
    getStoredOffersSnapshot,
    () => "[]",
  );
  const offers = useMemo(() => parseStoredOffers(offersSnapshot), [offersSnapshot]);

  const sortedOffers = useMemo(() => {
    return [...offers].sort((left, right) => {
      if (sortKey === "company") {
        return left.company.localeCompare(right.company);
      }

      if (sortKey === "role") {
        return left.role.localeCompare(right.role);
      }

      return totalCompensation(right) - totalCompensation(left);
    });
  }, [offers, sortKey]);

  const visibleOffers = sortedOffers.length > 0 ? sortedOffers : sampleOffers;
  const isShowingSamples = sortedOffers.length === 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCompany = form.company.trim();
    const trimmedRole = form.role.trim();

    if (!trimmedCompany || !trimmedRole) {
      return;
    }

    saveOffers([
      {
        ...form,
        id: crypto.randomUUID(),
        company: trimmedCompany,
        role: trimmedRole,
        notes: form.notes.trim(),
      },
      ...offers,
    ]);
    trackProductEvent("offer_saved", {
      has_equity: form.equity > 0,
      has_bonus: form.bonus > 0,
      has_notes: form.notes.trim().length > 0,
      saved_offer_count: offers.length + 1,
    });
    setForm(emptyForm);
  }

  function removeOffer(id: string) {
    saveOffers(offers.filter((offer) => offer.id !== id));
    trackProductEvent("offer_removed", {
      saved_offer_count: Math.max(offers.length - 1, 0),
    });
  }

  function updateSortKey(nextSortKey: SortKey) {
    setSortKey(nextSortKey);
    trackProductEvent("offers_sorted", {
      sort_key: nextSortKey,
      saved_offer_count: offers.length,
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <nav className="flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight">OfferLookup</div>
          <a
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-white"
            href="#compare"
            onClick={() =>
              trackProductEvent("cta_clicked", { cta: "nav_compare_offers" })
            }
          >
            Compare offers
          </a>
        </nav>

        <div className="grid items-center gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-5 inline-flex rounded-full bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200 ring-1 ring-cyan-300/20">
              Local-only offer research
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Compare job offers before you negotiate.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Add compensation details, sort by the numbers that matter, and
              keep everything private in your browser.
            </p>
          </div>

          <form
            className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur"
            onSubmit={handleSubmit}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Add an offer</h2>
              <p className="mt-2 text-sm text-slate-400">
                Saved locally on this device. Company and role are required.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">
                  Company
                </span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  onChange={(event) =>
                    setForm({ ...form, company: event.target.value })
                  }
                  placeholder="Acme Corp"
                  required
                  value={form.company}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Role</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value })
                  }
                  placeholder="Staff Engineer"
                  required
                  value={form.role}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">
                  Base salary
                </span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  min="0"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      baseSalary: parseMoney(event.target.value),
                    })
                  }
                  type="number"
                  value={form.baseSalary || ""}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">
                  Equity value
                </span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  min="0"
                  onChange={(event) =>
                    setForm({ ...form, equity: parseMoney(event.target.value) })
                  }
                  type="number"
                  value={form.equity || ""}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Bonus</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  min="0"
                  onChange={(event) =>
                    setForm({ ...form, bonus: parseMoney(event.target.value) })
                  }
                  type="number"
                  value={form.bonus || ""}
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">Notes</span>
                <textarea
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Benefits, remote policy, risk, negotiation notes..."
                  value={form.notes}
                />
              </label>
            </div>

            <button
              className="mt-6 w-full rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
              type="submit"
            >
              Save offer
            </button>
          </form>
        </div>

        <section
          className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-5"
          id="compare"
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Offer comparison</h2>
              <p className="mt-2 text-sm text-slate-400">
                {isShowingSamples
                  ? "Sample data shown until you save your first offer."
                  : `${offers.length} saved offer${offers.length === 1 ? "" : "s"}.`}
              </p>
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-300">
              Sort by
              <select
                className="rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-white outline-none focus:border-cyan-300"
                onChange={(event) => updateSortKey(event.target.value as SortKey)}
                value={sortKey}
              >
                <option value="total">Total compensation</option>
                <option value="company">Company</option>
                <option value="role">Role</option>
              </select>
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Base</th>
                    <th className="px-4 py-3 font-medium">Equity</th>
                    <th className="px-4 py-3 font-medium">Bonus</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {visibleOffers.map((offer) => (
                    <tr className="bg-slate-950/50" key={offer.id}>
                      <td className="px-4 py-4 font-medium text-white">
                        {offer.company}
                      </td>
                      <td className="px-4 py-4 text-slate-300">{offer.role}</td>
                      <td className="px-4 py-4 text-slate-300">
                        {currencyFormatter.format(offer.baseSalary)}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {currencyFormatter.format(offer.equity)}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {currencyFormatter.format(offer.bonus)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-cyan-200">
                        {currencyFormatter.format(totalCompensation(offer))}
                      </td>
                      <td className="max-w-64 px-4 py-4 text-slate-400">
                        {offer.notes || "No notes yet."}
                      </td>
                      <td className="px-4 py-4">
                        {!isShowingSamples && (
                          <button
                            className="rounded-full border border-white/10 px-3 py-1 text-slate-300 transition hover:border-red-300 hover:text-red-200"
                            onClick={() => removeOffer(offer.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
