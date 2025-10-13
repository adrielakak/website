import { FormEvent, useMemo, useState } from "react";

import { apiClient } from "../lib/api";

interface AdminAvailabilityItem {
  formationId: string;
  formationTitle: string;
  sessionId: string;
  sessionLabel: string;
  startDate: string;
  endDate: string;
  capacity: number;
  reservedCount: number;
  remaining: number;
  isOpen: boolean;
}

interface AdminReservation {
  id: string;
  formationTitle: string;
  sessionLabel: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: "stripe" | "virement";
  status: string;
  stripeSessionId?: string;
  createdAt: string;
}

interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

function Admin() {
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AdminAvailabilityItem[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [contactMessages, setContactMessages] = useState<AdminContactMessage[]>([]);
  const [capacityDrafts, setCapacityDrafts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }), []);

  const fetchDashboard = async (key: string) => {
    try {
      setIsLoading(true);
      const [availabilityResponse, reservationsResponse, contactResponse] = await Promise.all([
        apiClient.get<{ sessions: AdminAvailabilityItem[] }>("/api/admin/availability", {
          headers: { "x-admin-key": key },
        }),
        apiClient.get<{ reservations: AdminReservation[] }>("/api/admin/reservations", {
          headers: { "x-admin-key": key },
        }),
        apiClient.get<{ messages: AdminContactMessage[] }>("/api/admin/contact", {
          headers: { "x-admin-key": key },
        }),
      ]);

      setAvailability(availabilityResponse.data.sessions);
      setCapacityDrafts(
        availabilityResponse.data.sessions.reduce<Record<string, number>>((acc, session) => {
          acc[session.sessionId] = session.capacity;
          return acc;
        }, {})
      );
      setReservations(reservationsResponse.data.reservations);
      setContactMessages(contactResponse.data.messages);
      setAdminKey(key);
      setErrorMessage(null);
    } catch (error) {
      console.error("Erreur dashboard admin:", error);
      setErrorMessage("Impossible d'accéder au tableau de bord. Vérifiez la clé administrateur.");
      setAdminKey(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminKeyInput.trim()) {
      setErrorMessage("Merci de renseigner la clé administrateur.");
      return;
    }
    await fetchDashboard(adminKeyInput.trim());
  };

  const updateAvailability = async (sessionId: string, updates: { capacity?: number; isOpen?: boolean }) => {
    if (!adminKey) {
      return;
    }
    try {
      setSavingSessionId(sessionId);
      await apiClient.put(`/api/admin/availability/${sessionId}`, updates, {
        headers: { "x-admin-key": adminKey },
      });
      await fetchDashboard(adminKey);
    } catch (error) {
      console.error("Erreur mise à jour disponibilité:", error);
      setErrorMessage("Impossible de mettre à jour la disponibilité. Réessayez plus tard.");
    } finally {
      setSavingSessionId(null);
    }
  };

  if (!adminKey) {
    return (
      <div className="bg-brand-midnight py-24 text-white">
        <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-10 shadow-glow-soft">
          <h1 className="text-2xl font-semibold">Espace administrateur</h1>
          <p className="mt-3 text-sm text-white/70">
            Entrez la clé fournie pour ajuster les disponibilités des stages et consulter les réservations en temps réel.
          </p>
          <form className="mt-8 space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-white" htmlFor="admin-key">
                Clé administrateur
              </label>
              <input
                id="admin-key"
                type="password"
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                value={adminKeyInput}
                onChange={(event) => setAdminKeyInput(event.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
          {errorMessage && <p className="mt-4 text-sm text-red-300">{errorMessage}</p>}
        </div>
      </div>
    );
  }

  const totalRemaining = availability.reduce((sum, session) => sum + Math.max(session.remaining, 0), 0);

  return (
    <div className="bg-brand-midnight pb-24 pt-28 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
        <header className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-glow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Tableau de bord — réservations</h1>
              <p className="mt-2 text-sm text-white/70">
                Ajustez les capacités, ouvrez ou fermez une session et visualisez toutes les inscriptions confirmées ou en attente.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-primary/40 bg-brand-primary/20 px-5 py-3 text-sm font-semibold text-brand-gold">
              Places restantes (toutes sessions)&nbsp;: {totalRemaining}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/60">
            <button
              type="button"
              className="btn-secondary text-xs uppercase tracking-[0.4em]"
              onClick={() => fetchDashboard(adminKey)}
              disabled={isLoading}
            >
              Actualiser
            </button>
            {errorMessage && <span className="text-red-300">{errorMessage}</span>}
          </div>
        </header>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-glow-soft">
          <h2 className="text-2xl font-semibold">Gestion des disponibilités</h2>
          <p className="mt-2 text-sm text-white/65">
            Modifiez le nombre de places ou fermez temporairement une session pour bloquer les paiements.
          </p>
          <div className="mt-8 grid gap-6">
            {availability.map((session) => {
              const draftValue = capacityDrafts[session.sessionId] ?? session.capacity;
              const isSaving = savingSessionId === session.sessionId;
              return (
                <div
                  key={session.sessionId}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-brand-gold/80">{session.sessionLabel}</p>
                      <h3 className="text-xl font-semibold text-white">{session.formationTitle}</h3>
                      <p className="mt-1 text-xs text-white/60">
                        Réservations confirmées ou en attente&nbsp;: {session.reservedCount} &nbsp;•&nbsp; Restant&nbsp;:
                        {" "}
                        {session.remaining}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 md:w-80">
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60" htmlFor={`capacity-${session.sessionId}`}>
                        Capacité
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          id={`capacity-${session.sessionId}`}
                          type="number"
                          min={0}
                          className="w-32 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                          value={draftValue}
                          onChange={(event) =>
                            setCapacityDrafts((prev) => ({
                              ...prev,
                              [session.sessionId]: Number(event.target.value),
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="btn-primary text-xs uppercase tracking-[0.4em]"
                          disabled={isSaving}
                          onClick={() => updateAvailability(session.sessionId, { capacity: draftValue })}
                        >
                          {isSaving ? "Enregistrement..." : "Mettre à jour"}
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                          session.isOpen
                            ? "border-emerald-400/40 text-emerald-200 hover:bg-emerald-400/10"
                            : "border-amber-400/40 text-amber-200 hover:bg-amber-400/10"
                        }`}
                        onClick={() => updateAvailability(session.sessionId, { isOpen: !session.isOpen })}
                        disabled={isSaving}
                      >
                        {session.isOpen ? "Session ouverte" : "Session fermée"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {availability.length === 0 && !isLoading && (
              <p className="text-sm text-white/60">Aucune session trouvée.</p>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-glow-soft">
          <h2 className="text-2xl font-semibold">Réservations en temps réel</h2>
          <p className="mt-2 text-sm text-white/65">
            Historique des paiements Stripe et demandes de virement. La colonne statut vous aide à suivre ce qu&apos;il reste à valider.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
              <thead className="text-xs uppercase tracking-[0.3em] text-white/50">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Participant</th>
                  <th className="px-4 py-3 text-left">Session</th>
                  <th className="px-4 py-3 text-left">Paiement</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="px-4 py-3 text-white/60">
                      {dateFormatter.format(new Date(reservation.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{reservation.customerName}</p>
                      <p className="text-xs text-white/50">{reservation.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{reservation.formationTitle}</p>
                      <p className="text-xs text-white/50">{reservation.sessionLabel}</p>
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {reservation.paymentMethod === "stripe" ? "Stripe" : "Virement"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          reservation.status === "stripe_confirmed"
                            ? "bg-emerald-400/15 text-emerald-200"
                            : reservation.status === "stripe_pending"
                            ? "bg-amber-400/15 text-amber-200"
                            : reservation.status === "cancelled"
                            ? "bg-red-400/20 text-red-200"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {reservation.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reservations.length === 0 && !isLoading && (
              <p className="mt-6 text-sm text-white/60">Aucune réservation enregistrée pour le moment.</p>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-glow-soft">
          <h2 className="text-2xl font-semibold">Messages de contact</h2>
          <p className="mt-2 text-sm text-white/65">
            Suivez les demandes envoyées depuis le formulaire de contact. Pensez à répondre rapidement pour confirmer la prise en charge.
          </p>
          <div className="mt-6 space-y-4">
            {contactMessages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{message.name}</p>
                    <a className="text-sm text-brand-gold hover:underline" href={`mailto:${message.email}`}>
                      {message.email}
                    </a>
                  </div>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {dateFormatter.format(new Date(message.createdAt))}
                  </span>
                </div>
                <p className="mt-4 whitespace-pre-line rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-white/80">
                  {message.message}
                </p>
              </div>
            ))}
            {contactMessages.length === 0 && !isLoading && (
              <p className="text-sm text-white/60">Aucun message reçu pour le moment.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Admin;
