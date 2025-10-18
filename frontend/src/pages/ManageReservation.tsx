import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AnimatedContent from "../components/reactbits/AnimatedContent";
import { apiClient } from "../lib/api";

type ReservationStatus = "stripe_pending" | "stripe_confirmed" | "virement_en_attente" | "virement_confirme" | "cancelled";

interface ManagedReservation {
  id: string;
  formationId: string;
  formationTitle: string;
  sessionId: string;
  sessionLabel: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: "stripe" | "virement";
  status: ReservationStatus;
  createdAt: string;
}

interface ManagedSession {
  sessionId: string;
  sessionLabel: string;
  startDate: string;
  endDate: string;
  capacity: number;
  isOpen: boolean;
  isCancelled: boolean;
  reservedCount: number;
  remaining: number;
}

interface ManageLookupResponse {
  reservation: ManagedReservation;
  sessions: ManagedSession[];
}

function ManageReservation() {
  const [reservationIdInput, setReservationIdInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reservation, setReservation] = useState<ManagedReservation | null>(null);
  const [sessions, setSessions] = useState<ManagedSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }),
    []
  );

  const sessionDateFormatter = useMemo(
    () => new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }),
    []
  );

  const statusLabels: Record<ReservationStatus, string> = {
    stripe_pending: "Stripe - en attente",
    stripe_confirmed: "Stripe - confirmé",
    virement_en_attente: "Virement - en attente",
    virement_confirme: "Virement - confirmé",
    cancelled: "Annulée",
  };

  const formatSessionPeriod = (session?: ManagedSession): string => {
    if (!session) return "Dates communiquées prochainement";
    const start = new Date(session.startDate);
    const end = new Date(session.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return session.sessionLabel;
    }
    return `${sessionDateFormatter.format(start)} — ${sessionDateFormatter.format(end)}`;
  };

  const extractErrorMessage = (error: unknown, fallback: string): string => {
    if (
      typeof error === "object" &&
      error !== null &&
      "isAxiosError" in error &&
      (error as { isAxiosError: boolean }).isAxiosError
    ) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      return axiosError.response?.data?.message ?? axiosError.message ?? fallback;
    }
    if (error instanceof Error) return error.message;
    return fallback;
  };

  const performLookup = async (
    reservationId: string,
    email: string,
    { silent = false }: { silent?: boolean } = {}
  ): Promise<ManageLookupResponse> => {
    if (!silent) {
      setIsLookupLoading(true);
      setLookupError(null);
      setSuccessMessage(null);
    }
    try {
      const response = await apiClient.post<ManageLookupResponse>("/api/reservations/manage", {
        reservationId: reservationId.trim(),
        customerEmail: email.trim(),
      });
      setReservation(response.data.reservation);
      setSessions(response.data.sessions);
      setSelectedSessionId(response.data.reservation.sessionId);
      setUpdateError(null);
      return response.data;
    } catch (error) {
      if (!silent) setLookupError(extractErrorMessage(error, "Réservation introuvable. Vérifiez les informations saisies."));
      throw error;
    } finally {
      if (!silent) setIsLookupLoading(false);
    }
  };

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reservationIdInput.trim() || !emailInput.trim()) {
      setLookupError("Merci de renseigner votre email et l'identifiant de réservation.");
      return;
    }
    try {
      await performLookup(reservationIdInput, emailInput);
    } catch (error) {
      console.error("Erreur lookup réservation:", error);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reservation) return;
    if (!selectedSessionId) {
      setUpdateError("Merci de choisir la nouvelle session.");
      return;
    }
    if (selectedSessionId === reservation.sessionId) {
      setUpdateError("Votre réservation est déjà positionnée sur cette session.");
      return;
    }
    const targetSession = sessions.find((s) => s.sessionId === selectedSessionId);
    if (!targetSession) {
      setUpdateError("Session introuvable pour cette formation.");
      return;
    }
    if (!targetSession.isOpen || targetSession.remaining <= 0) {
      setUpdateError("Cette session n'accepte plus d'inscriptions.");
      return;
    }
    try {
      setIsUpdating(true);
      setUpdateError(null);
      setSuccessMessage(null);
      const response = await apiClient.patch<{
        message?: string;
        reservation: ManagedReservation;
      }>(`/api/reservations/${reservation.id}`, {
        customerEmail: reservation.customerEmail,
        sessionId: selectedSessionId,
      });
      await performLookup(reservation.id, reservation.customerEmail, { silent: true });
      setSuccessMessage(response.data.message ?? "Votre changement de session est confirmé.");
    } catch (error) {
      setUpdateError(
        extractErrorMessage(error, "Impossible de modifier la réservation pour le moment. Réessayez un peu plus tard.")
      );
    } finally {
      setIsUpdating(false);
    }
  };
  const handleCancel = async () => {
    if (!reservation) return;
    try {
      setIsUpdating(true);
      setUpdateError(null);
      setSuccessMessage(null);
      await apiClient.post(`/api/reservations/${reservation.id}/cancel`, {
        customerEmail: reservation.customerEmail,
      });
      setSuccessMessage("Votre annulation a bien été prise en compte.");
      setReservation(null);
      setSessions([]);
    } catch (error) {
      setUpdateError(
        extractErrorMessage(error, "Impossible d'annuler la réservation pour le moment. Réessayez plus tard.")
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const upcomingSessions = sessions.filter((s) => !s.isCancelled);
  const cancelledSessions = sessions.filter((s) => s.isCancelled);
  const selectedSession = sessions.find((s) => s.sessionId === selectedSessionId);

  return (
    <div className="bg-brand-midnight pb-20 text-white sm:pb-24">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/30 via-brand-midnight to-brand-midnight" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
          <AnimatedContent distance={90}>
            <div className="space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/60 sm:text-xs">
                Gérer ma réservation
              </p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Changer de session ou vérifier votre inscription
              </h1>
              <p className="max-w-2xl text-sm text-white/70 sm:text-base">
                Saisissez l&apos;identifiant communiqué dans votre email de confirmation ainsi que votre adresse mail.
                Vous pourrez ensuite choisir une autre session encore disponible. En cas de difficulté, <Link to="/contact" className="text-brand-gold hover:underline">contactez-nous directement</Link>.
              </p>
            </div>
          </AnimatedContent>
        </div>
      </section>

      <div className="mx-auto mt-12 max-w-5xl space-y-8 px-4 sm:px-6">
        <AnimatedContent distance={70}>
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft sm:p-8">
            <h2 className="text-2xl font-semibold text-white">Retrouver ma réservation</h2>
            <p className="mt-2 text-sm text-white/70">
              L&apos;identifiant ressemble à <span className="font-mono text-white/80">8f5a2-...</span> et se trouve dans
              l&apos;email de confirmation envoyé après votre inscription.
            </p>
            <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleLookup}>
              <div className="sm:col-span-1">
                <label htmlFor="reservation-id" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Identifiant de réservation
                </label>
                <input
                  id="reservation-id"
                  type="text"
                  value={reservationIdInput}
                  onChange={(e) => setReservationIdInput(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                  placeholder="Ex : c076f596-34fa..."
                />
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="reservation-email" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Adresse email utilisée
                </label>
                <input
                  id="reservation-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                  placeholder="email@example.com"
                />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary" disabled={isLookupLoading}>
                  {isLookupLoading ? "Recherche..." : "Afficher ma réservation"}
                </button>
                {lookupError && (
                  <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {lookupError}
                  </p>
                )}
              </div>
            </form>
          </div>
        </AnimatedContent>

        {reservation && (
          <AnimatedContent distance={70}>
            <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-gold/80">Réservation confirmée</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{reservation.formationTitle}</h3>
                  <p className="mt-1 text-sm text-white/60">
                    {reservation.customerName} — {reservation.customerEmail}
                  </p>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Session actuelle</p>
                    <p className="mt-2 text-sm font-semibold text-white">{reservation.sessionLabel}</p>
                    <p className="text-xs text-white/60">{formatSessionPeriod(sessions.find((s) => s.sessionId === reservation.sessionId))}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">Statut</p>
                  <p className="mt-2 text-sm font-semibold text-white">{statusLabels[reservation.status]}</p>
                  <p className="text-xs text-white/60">Paiement : {reservation.paymentMethod === "stripe" ? "Stripe" : "Virement bancaire"}</p>
                </div>
              </div>

              <form className="mt-8 space-y-4" onSubmit={handleUpdate}>
                <div>
                  <label htmlFor="new-session" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                    Choisir une nouvelle session
                  </label>
                  <select
                    id="new-session"
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-brand-primary/40 bg-brand-midnight px-4 py-3 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                  >
                    {upcomingSessions.length === 0 && <option value="">Aucune session disponible pour le moment</option>}
                    {upcomingSessions.map((s) => (
                      <option key={s.sessionId} value={s.sessionId} disabled={!s.isOpen || s.remaining <= 0}>
                        {s.sessionLabel}
                        {s.isOpen ? (s.remaining > 0 ? "" : " — complet") : " — session fermée"}
                      </option>
                    ))}
                    {cancelledSessions.length > 0 && (
                      <optgroup label="Sessions annulées">
                        {cancelledSessions.map((s) => (
                          <option key={s.sessionId} value={s.sessionId} disabled>
                            {s.sessionLabel} — annulée
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="btn-primary text-xs uppercase tracking-[0.35em] disabled:opacity-70"
                    disabled={
                      isUpdating ||
                      !selectedSessionId ||
                      selectedSessionId === reservation.sessionId ||
                      upcomingSessions.length === 0 ||
                      !selectedSession?.isOpen ||
                      (selectedSession?.remaining ?? 0) <= 0
                    }
                  >
                    {isUpdating ? "Mise à jour..." : "Changer de session"}
                  </button>
                  <span className="text-xs text-white/50">La place libérée est immédiatement proposée aux autres participants.</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-red-200 hover:bg-red-500/20 disabled:opacity-70"
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Annulation..." : "Annuler ma réservation"}
                  </button>
                  <span className="text-xs text-white/50">La place libérée sera immédiatement remise à disposition.</span>
                </div>

                {updateError && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{updateError}</p>
                )}
                {successMessage && (
                  <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{successMessage}</p>
                )}
              </form>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-xs text-white/60 sm:text-sm">
                Besoin de reporter une deuxième fois, d&apos;annuler ou de demander un remboursement ? Utilisez le
                <Link to="/contact" className="font-semibold text-brand-gold hover:underline"> formulaire de contact</Link>
                {" "}ou appelez le <a className="font-semibold text-brand-gold hover:underline" href="tel:+33609425911">06 09 42 59 11</a>.
              </div>
            </div>
          </AnimatedContent>
        )}
      </div>
    </div>
  );
}

export default ManageReservation;





