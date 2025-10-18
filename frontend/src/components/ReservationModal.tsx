import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import { apiClient } from "../lib/api";
import { Formation } from "../types";

interface SessionAvailabilitySnapshot {
  isOpen: boolean;
  remaining: number;
  isCancelled?: boolean;
}

interface ReservationModalProps {
  isOpen: boolean;
  formation: Formation | null;
  availability?: Record<string, SessionAvailabilitySnapshot>;
  onClose: () => void;
}

type PaymentMethod = "stripe" | "virement";

interface FormValues {
  customerName: string;
  customerEmail: string;
  sessionId: string;
  paymentMethod: PaymentMethod;
}

const buildInitialState = (): FormValues => ({
  customerName: "",
  customerEmail: "",
  sessionId: "",
  paymentMethod: "stripe",
});

function ReservationModal({ isOpen, formation, availability, onClose }: ReservationModalProps) {
  const [formValues, setFormValues] = useState<FormValues>(buildInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [iban, setIban] = useState<string | null>(null);

  useEffect(() => {
    if (formation) {
      const firstAvailableSession =
        formation.sessions.find((session) => {
          const info = availability?.[session.id];
          return !info || (!info.isCancelled && info.isOpen && info.remaining > 0);
        }) ?? formation.sessions[0];

      setFormValues({
        customerName: "",
        customerEmail: "",
        sessionId: firstAvailableSession?.id ?? "",
        paymentMethod: "stripe",
      });
      setErrorMessage(null);
      setSuccessMessage(null);
      setIban(null);
    }
  }, [formation, availability, isOpen]);

  if (!isOpen || !formation) {
    return null;
  }

  const selectedSessionInfo = formValues.sessionId ? availability?.[formValues.sessionId] : undefined;
  const isSelectedSessionCancelled = selectedSessionInfo?.isCancelled ?? false;
  const isSelectedSessionOpen = selectedSessionInfo ? selectedSessionInfo.isOpen : true;
  const hasSelectedSessionSeats = selectedSessionInfo ? selectedSessionInfo.remaining > 0 : true;

  const handleChange =
    (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIban(null);

    try {
      if (isSelectedSessionCancelled) {
        setErrorMessage("Cette session a été annulée. Merci de sélectionner une autre date.");
        return;
      }

      if (!isSelectedSessionOpen || !hasSelectedSessionSeats) {
        setErrorMessage("Cette session est complète ou fermée aux réservations.");
        return;
      }

      if (!formValues.sessionId) {
        throw new Error("Merci de sélectionner une session.");
      }

      if (formValues.paymentMethod === "stripe") {
        const response = await apiClient.post("/api/stripe/create-checkout-session", {
          customerName: formValues.customerName,
          customerEmail: formValues.customerEmail,
          formationId: formation.id,
          sessionId: formValues.sessionId,
        });

        const checkoutUrl = response.data?.url;
        if (!checkoutUrl) {
          throw new Error("Lien de redirection Stripe indisponible.");
        }

        window.location.href = checkoutUrl;
        return;
      }

      const response = await apiClient.post("/api/reservations", {
        customerName: formValues.customerName,
        customerEmail: formValues.customerEmail,
        formationId: formation.id,
        sessionId: formValues.sessionId,
        paymentMethod: "virement",
      });

      setSuccessMessage(response.data?.message ?? "Votre réservation a bien été enregistrée.");
      setIban(response.data?.iban ?? null);
    } catch (error) {
      console.error("Erreur de réservation:", error);
      if (
        typeof error === "object" &&
        error !== null &&
        "isAxiosError" in error &&
        (error as { isAxiosError: boolean }).isAxiosError
      ) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        setErrorMessage(
          axiosError.response?.data?.message ?? axiosError.message ?? "Une erreur est survenue. Merci de réessayer."
        );
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Une erreur est survenue. Merci de réessayer.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-midnight/90 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-glow-soft">
        <button
          type="button"
          className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-white/50 transition hover:border-brand-primary hover:bg-brand-primary/10 hover:text-white"
          onClick={onClose}
          aria-label="Fermer la fenêtre de réservation"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/70">Réservation</p>
          <h2 className="text-2xl font-semibold text-white">{formation.title}</h2>
          <p className="text-sm text-white/60">Sélectionnez vos informations pour réserver ce stage.</p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="customerName" className="block text-sm font-semibold text-white">
              Nom et prénom
            </label>
            <input
              id="customerName"
              type="text"
              required
              value={formValues.customerName}
              onChange={handleChange("customerName")}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              placeholder="Votre nom complet"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-semibold text-white">
              Email
            </label>
            <input
              id="customerEmail"
              type="email"
              required
              value={formValues.customerEmail}
              onChange={handleChange("customerEmail")}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              placeholder="votreadresse@email.com"
            />
          </div>

          <div>
            <label htmlFor="sessionId" className="block text-sm font-semibold text-white">
              Choix de la session
            </label>
            <select
              id="sessionId"
              required
              value={formValues.sessionId}
              onChange={handleChange("sessionId")}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            >
              <option value="">Sélectionnez une session</option>
              {formation.sessions.map((session) => (
                <option
                  key={session.id}
                  value={session.id}
                  disabled={Boolean(availability?.[session.id]?.isCancelled)}
                >
                  {session.label}
                  {(() => {
                    const info = availability?.[session.id];
                    if (!info) {
                      return "";
                    }
                    if (info.isCancelled) {
                      return " – session annulée";
                    }
                    if (!info.isOpen) {
                      return " – session fermée";
                    }
                    if (info.remaining <= 0) {
                      return " — complet";
                    }
                    return "";
                  })()}
                </option>
              ))}
            </select>
            {isSelectedSessionCancelled && (
              <p className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                Cette session a été annulée. Merci de sélectionner une autre date disponible.
              </p>
            )}
            {!isSelectedSessionCancelled && (!isSelectedSessionOpen || !hasSelectedSessionSeats) && (
              <p className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                Cette session est momentanément indisponible. N&apos;hésitez pas à choisir une autre date.
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Mode de paiement</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-brand-primary/60">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={formValues.paymentMethod === "stripe"}
                  onChange={handleChange("paymentMethod")}
                  className="h-4 w-4 border-white/20 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm text-white/70">Stripe (carte bancaire)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-brand-primary/60">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="virement"
                  checked={formValues.paymentMethod === "virement"}
                  onChange={handleChange("paymentMethod")}
                  className="h-4 w-4 border-white/20 text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm text-white/70">Virement bancaire</span>
              </label>
            </div>
            {formValues.paymentMethod === "stripe" && (
              <p className="mt-2 text-xs text-white/60">Vous serez redirigé vers Stripe pour finaliser le paiement.</p>
            )}
          </div>

          {errorMessage && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <div className="space-y-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-100">
              <p className="font-semibold text-emerald-50">{successMessage}</p>
              {iban && (
                <p>
                  IBAN pour le virement : <span className="font-mono font-semibold text-emerald-50">{iban}</span>
                </p>
              )}
              <p className="text-xs text-emerald-200">
                Merci d'envoyer le justificatif de paiement à{" "}
                <a className="font-medium text-emerald-50 underline" href="mailto:nk26fr@gmail.com">
                  nk26fr@gmail.com
                </a>{" "}
                pour confirmer votre participation.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Traitement en cours..." : "Valider la réservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReservationModal;
