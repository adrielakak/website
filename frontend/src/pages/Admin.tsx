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
  isCancelled: boolean;
}

type AdminReservationStatus = "stripe_pending" | "stripe_confirmed" | "virement_en_attente" | "virement_confirme" | "cancelled";

interface AdminReservation {
  id: string;
  formationId: string;
  formationTitle: string;
  sessionLabel: string;
  sessionId: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: "stripe" | "virement";
  status: AdminReservationStatus;
  stripeSessionId?: string;
  createdAt: string;
}

interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  status: "new" | "handled";
}

const RESERVATION_STATUS_OPTIONS: AdminReservationStatus[] = [
  "stripe_pending",
  "stripe_confirmed",
  "virement_en_attente",
  "virement_confirme",
  "cancelled",
];

const RESERVATION_STATUS_LABELS: Record<AdminReservationStatus, string> = {
  stripe_pending: "Stripe - en attente",
  stripe_confirmed: "Stripe - confirmé",
  virement_en_attente: "Virement - en attente",
  virement_confirme: "Virement - confirmé",
  cancelled: "Annulée",
};

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
  const [reservationSessionDrafts, setReservationSessionDrafts] = useState<Record<string, string>>({});
  const [reservationStatusDrafts, setReservationStatusDrafts] = useState<Record<string, AdminReservationStatus>>({});
  const [updatingReservationId, setUpdatingReservationId] = useState<string | null>(null);
  const [nknews, setNknews] = useState<Array<{ id?: string; title?: string; content?: string; image?: string; createdAt?: string }>>([]);
  const [nkTitle, setNkTitle] = useState("");
  const [nkContent, setNkContent] = useState("");
  const [nkImage, setNkImage] = useState("");
  const [nkFile, setNkFile] = useState<File | null>(null);
  const [editNewsId, setEditNewsId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Actives = visibles et comptées dans les sessions
  const ACTIVE_RES_STATUS: AdminReservationStatus[] = [
    "stripe_pending",
    "stripe_confirmed",
    "virement_en_attente",
    "virement_confirme",
  ];

  const [newSessionFormationId, setNewSessionFormationId] = useState("");
  const [newSessionLabel, setNewSessionLabel] = useState("");
  const [newSessionStart, setNewSessionStart] = useState("");
  const [newSessionEnd, setNewSessionEnd] = useState("");

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }), []);

  const fetchDashboard = async (key: string) => {
    try {
      setIsLoading(true);
      const [availabilityResponse, reservationsResponse, contactResponse, nknewsResponse] = await Promise.all([
        apiClient.get<{ sessions: AdminAvailabilityItem[] }>("/api/admin/availability", {
          headers: { "x-admin-key": key },
        }),
        apiClient.get<{ reservations: AdminReservation[] }>("/api/admin/reservations", {
          headers: { "x-admin-key": key },
        }),
        apiClient.get<{ messages: AdminContactMessage[] }>("/api/admin/contact", {
          headers: { "x-admin-key": key },
        }),
        apiClient.get<Array<{ id?: string; title?: string; content?: string; image?: string; createdAt?: string }>>("/api/nknews"),
      ]);

      setAvailability(availabilityResponse.data.sessions);
      setCapacityDrafts(
        availabilityResponse.data.sessions.reduce<Record<string, number>>((acc, session) => {
          acc[session.sessionId] = session.capacity;
          return acc;
        }, {})
      );
      setReservations(reservationsResponse.data.reservations);
      setReservationSessionDrafts(
        reservationsResponse.data.reservations.reduce<Record<string, string>>((acc, reservation) => {
          acc[reservation.id] = reservation.sessionId;
          return acc;
        }, {})
      );
      setReservationStatusDrafts(
        reservationsResponse.data.reservations.reduce<Record<string, AdminReservationStatus>>((acc, reservation) => {
          acc[reservation.id] = reservation.status;
          return acc;
        }, {})
      );
      setContactMessages(contactResponse.data.messages);
      setNknews(nknewsResponse.data ?? []);
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

  const addNknews = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  try {
    if (!adminKey) {
      setErrorMessage("Connectez-vous d'abord avec la clé administrateur.");
      return;
    }
    let imageUrl = nkImage.trim();
    if (nkFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", nkFile);
      const uploadRes = await apiClient.post(
        "/api/uploads/image",
        formData,
        { headers: { "x-admin-key": adminKey } }
      );
      imageUrl = uploadRes.data?.url ?? imageUrl;
    }

    if (editNewsId) {
      await apiClient.patch(
        `/api/nknews/${editNewsId}`,
        { title: nkTitle.trim(), content: nkContent.trim(), image: imageUrl },
        { headers: { "x-admin-key": adminKey } }
      );
    } else {
      await apiClient.post(
        "/api/nknews",
        { title: nkTitle.trim(), content: nkContent.trim(), image: imageUrl },
        { headers: { "x-admin-key": adminKey } }
      );
    }

    setNkTitle("");
    setNkContent("");
    setNkImage("");
    setNkFile(null);
    setEditNewsId(null);
    const res = await apiClient.get<Array<{ id?: string; title?: string; content?: string; image?: string; createdAt?: string }>>(
      "/api/nknews"
    );
    setNknews(res.data ?? []);
  } catch (e) {
    console.error("Erreur ajout/màj NKNEWS:", e);
    setErrorMessage("Impossible d'enregistrer l'actualité.");
  } finally {
    setIsUploading(false);
  }
};

  const addSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminKey) {
      setErrorMessage("Connectez-vous d'abord avec la clé administrateur.");
      return;
    }
    if (!newSessionFormationId || !newSessionLabel || !newSessionStart || !newSessionEnd) {
      setErrorMessage("Veuillez remplir tous les champs de la nouvelle session.");
      return;
    }
    try {
      setIsLoading(true);
      await apiClient.post(
        "/api/admin/sessions",
        {
          formationId: newSessionFormationId,
          label: newSessionLabel,
          startDate: newSessionStart,
          endDate: newSessionEnd,
        },
        { headers: { "x-admin-key": adminKey } }
      );
      setNewSessionLabel("");
      setNewSessionStart("");
      setNewSessionEnd("");
      await fetchDashboard(adminKey);
    } catch (error) {
      console.error("Erreur ajout session:", error);
      setErrorMessage("Impossible d'ajouter la session.");
    } finally {
      setIsLoading(false);
    }
  };

    const handleNewsEdit = (item: { id?: string; title?: string; content?: string; image?: string }) => {
    setNkTitle(item.title ?? "");
    setNkContent(item.content ?? "");
    setNkImage(item.image ?? "");
    setNkFile(null);
    setEditNewsId(item.id ?? null);
  };

  const deleteNews = async (item: { id?: string }, index: number) => {
    if (!adminKey) return;
    const target = item.id ?? `index:${index}`;
    const ok = window.confirm("Supprimer définitivement cette actualitée ?");
    if (!ok) return;
    try {
      await apiClient.delete(`/api/nknews/${encodeURIComponent(target)}`, { headers: { "x-admin-key": adminKey } });
      const res = await apiClient.get<Array<{ id?: string; title?: string; content?: string; image?: string; createdAt?: string }>>(
        "/api/nknews"
      );
      setNknews(res.data ?? []);
    } catch (e) {
      console.error("Erreur suppression NKNEWS:", e);
      setErrorMessage("Suppression impossible.");
    }
  };

  const handleNewsDelete = async (id?: string) => {
    if (!id || !adminKey) return;
    const ok = window.confirm("Supprimer définitivement cette actualitée ?");
    if (!ok) return;
    try {
      await apiClient.delete(`/api/nknews/${id}`, { headers: { "x-admin-key": adminKey } });
      const res = await apiClient.get<Array<{ id?: string; title?: string; content?: string; image?: string; createdAt?: string }>>(
        "/api/nknews"
      );
      setNknews(res.data ?? []);
    } catch (e) {
      console.error("Erreur suppression NKNEWS:", e);
      setErrorMessage("Suppression impossible.");
    }
  };const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminKeyInput.trim()) {
      setErrorMessage("Merci de renseigner la clé administrateur.");
      return;
    }
    await fetchDashboard(adminKeyInput.trim());
  };

const updateAvailability = async (
  sessionId: string,
  updates: { capacity?: number; isOpen?: boolean; isCancelled?: boolean }
) => {
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

  const deleteSessionById = async (sessionId: string) => {
    if (!adminKey) {
      return;
    }
    const ok = window.confirm(
      "Supprimer définitivement cette session ? Elle disparaîtra des pages publiques et de l'admin."
    );
    if (!ok) return;
    try {
      setSavingSessionId(sessionId);
      await apiClient.delete(`/api/admin/sessions/${sessionId}`, {
        headers: { "x-admin-key": adminKey },
      });
      await fetchDashboard(adminKey);
    } catch (error) {
      console.error("Erreur suppression session:", error);
      setErrorMessage("Impossible de supprimer la session.");
    } finally {
      setSavingSessionId(null);
    }
  };

  const updateReservation = async (
    reservationId: string,
    updates: { sessionId?: string; status?: AdminReservationStatus }
  ) => {
    if (!adminKey) {
      return;
    }

    if (!updates.sessionId && !updates.status) {
      return;
    }

    try {
      setUpdatingReservationId(reservationId);
      await apiClient.patch(`/api/admin/reservations/${reservationId}`, updates, {
        headers: { "x-admin-key": adminKey },
      });
      await fetchDashboard(adminKey);
    } catch (error) {
      console.error("Erreur mise à jour réservation:", error);
      setErrorMessage("Impossible de mettre à jour la réservation. Réessayez plus tard.");
    } finally {
      setUpdatingReservationId(null);
    }
  };

  const handleContactStatusChange = async (id: string, status: AdminContactMessage["status"]) => {
    if (!adminKey) {
      return;
    }
    try {
      await apiClient.patch(
        `/api/admin/contact/${id}`,
        { status },
        { headers: { "x-admin-key": adminKey } }
      );
      await fetchDashboard(adminKey);
    } catch (error) {
      console.error("Erreur mise à jour message:", error);
      setErrorMessage("Impossible de mettre à jour le message. Réessayez plus tard.");
    }
  };

  const handleContactDelete = async (id: string) => {
    if (!adminKey) {
      return;
    }
    const confirmation = window.confirm("Supprimer définitivement ce message ?");
    if (!confirmation) {
      return;
    }
    try {
      await apiClient.delete(`/api/admin/contact/${id}`, {
        headers: { "x-admin-key": adminKey },
      });
      await fetchDashboard(adminKey);
    } catch (error) {
      console.error("Erreur suppression message:", error);
      setErrorMessage("Impossible de supprimer le message.");
    }
  };

  const sessionsWithParticipants = useMemo(() => {
    const participantsBySession = reservations.reduce<Record<string, AdminReservation[]>>((acc, reservation) => {
      // N'afficher que les réservations actives (exclut "cancelled")
      if (ACTIVE_RES_STATUS.includes(reservation.status)) {
        acc[reservation.sessionId] = acc[reservation.sessionId] ?? [];
        acc[reservation.sessionId].push(reservation);
      }
      return acc;
    }, {});

    return availability.map((session) => {
      const participants = participantsBySession[session.sessionId] ?? [];
      const percent =
        session.capacity === 0
          ? 0
          : Math.min(100, Math.round((session.reservedCount / session.capacity) * 100));
      return {
        ...session,
        participants,
        percent,
      };
    });
  }, [availability, reservations]);

  const sessionsByFormation = useMemo(() => {
    const grouped = availability.reduce<Record<string, AdminAvailabilityItem[]>>((acc, session) => {
      acc[session.formationId] = acc[session.formationId] ?? [];
      acc[session.formationId].push(session);
      return acc;
    }, {});

    for (const key of Object.keys(grouped)) {
      grouped[key] = grouped[key]
        .slice()
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }

    return grouped;
  }, [availability]);

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
              const statusLabel = session.isCancelled
                ? "Session Annulée"
                : session.isOpen
                ? "Session ouverte"
                : "Session fermée";
              const statusClasses = session.isCancelled
                ? "border-red-500/40 bg-red-500/15 text-red-200"
                : session.isOpen
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                : "border-amber-400/40 bg-amber-400/15 text-amber-200";

              return (
                <div
                  key={session.sessionId}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-brand-gold/80">{session.sessionLabel}</p>
                      <h3 className="text-xl font-semibold text-white">{session.formationTitle}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                        <span>
                          Réservations confirmées ou en attente&nbsp;: {session.reservedCount} &nbsp;•&nbsp; Restant&nbsp;:
                          {" "}
                          {session.remaining}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 font-semibold ${statusClasses}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      {session.isCancelled && (
                        <p className="mt-2 text-xs text-red-200">
                          Session Annulée : les nouvelles inscriptions et paiements sont bloqués.
                        </p>
                      )}
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                            session.isOpen && !session.isCancelled
                              ? "border-emerald-400/40 text-emerald-200 hover:bg-emerald-400/10"
                              : "border-amber-400/40 text-amber-200 hover:bg-amber-400/10"
                          } ${session.isCancelled ? "cursor-not-allowed opacity-40" : ""}`}
                          onClick={() => updateAvailability(session.sessionId, { isOpen: !session.isOpen })}
                          disabled={isSaving || session.isCancelled}
                        >
                          {session.isOpen && !session.isCancelled ? "Fermer temporairement" : "Ouvrir aux inscriptions"}
                        </button>
                        <button
                          type="button"
                          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                            session.isCancelled
                              ? "border-emerald-400/40 text-emerald-200 hover:bg-emerald-400/10"
                              : "border-red-400/40 text-red-200 hover:bg-red-400/10"
                          }`}
                          onClick={() => deleteSessionById(session.sessionId)}
                          disabled={isSaving}
                        >
                          Supprimer la session
                        </button>
                      </div>
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
          <h2 className="text-2xl font-semibold">Ajouter une session</h2>
          <p className="mt-2 text-sm text-white/65">Créez une nouvelle date pour une formation existante.</p>
          <form className="mt-6 grid gap-4 md:grid-cols-4" onSubmit={addSession}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Formation</label>
              <select
                value={newSessionFormationId}
                onChange={(e) => setNewSessionFormationId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                required
              >
                <option value="" disabled>
                  Sélectionner
                </option>
                {Array.from(new Map(availability.map((s) => [s.formationId, s.formationTitle])).entries()).map(
                  ([id, title]) => (
                    <option key={id} value={id}>
                      {title}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Intitulé</label>
              <input
                value={newSessionLabel}
                onChange={(e) => setNewSessionLabel(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                placeholder="Session week-end : 12 & 13 décembre 2025"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Début</label>
              <input
                type="date"
                value={newSessionStart}
                onChange={(e) => setNewSessionStart(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Fin</label>
              <input
                type="date"
                value={newSessionEnd}
                onChange={(e) => setNewSessionEnd(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                required
              />
            </div>
            <div className="md:col-span-4 flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? "Ajout en cours..." : "Ajouter la session"}
              </button>
              <span className="text-xs text-white/50">
                La session sera automatiquement ouverte avec la capacité par défaut.
              </span>
            </div>
          </form>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-glow-soft">
          <h2 className="text-2xl font-semibold">NKNEWS</h2>
          <p className="mt-2 text-sm text-white/65">Publiez une brève (titre, texte, URL d'image ou upload).</p>
          <form className="mt-6 grid gap-4 md:grid-cols-3" onSubmit={addNknews}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Titre</label>
              <input
                value={nkTitle}
                onChange={(e) => setNkTitle(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                placeholder="Titre de l'actualité"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Texte</label>
              <input
                value={nkContent}
                onChange={(e) => setNkContent(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                placeholder="Contenu de l'actualité"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Image (URL)</label>
              <input
                value={nkImage}
                onChange={(e) => setNkImage(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                placeholder="https://..."
              />
            </div>
                        <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-white/60">ou Uploader une image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNkFile(e.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-xs text-white/70 file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-white/[0.06] file:px-3 file:py-2 file:text-white hover:file:bg-white/[0.1]"
              />
              {isUploading && <p className="mt-1 text-xs text-white/60">Televersement en cours...</p>}
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" className="btn-primary">
                {editNewsId ? "Mettre à jour" : "Publier"}
              </button>
              {editNewsId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setNkTitle("");
                    setNkContent("");
                    setNkImage("");
                    setNkFile(null);
                    setEditNewsId(null);
                  }}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nknews.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                {item.image && <img src={item.image} className="w-full h-48 object-cover" alt="" />}
                <div className="p-4">
                  {item.title && <h3 className="font-semibold">{item.title}</h3>}
                  {item.content && <p className="text-sm text-white/70 mt-1 whitespace-pre-line">{item.content}</p>}
                  {item.createdAt && (
                    <p className="mt-2 text-xs text-white/50">{new Date(item.createdAt).toLocaleString("fr-FR")}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="btn-secondary text-xs uppercase tracking-[0.3em]"
                      onClick={() => handleNewsEdit(item)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-red-500/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-red-200 transition hover:bg-red-500/10"
                      onClick={() => deleteNews(item, i)}
                    >
                      Supprimer
                    </button>
                    {editNewsId === item.id && (
                      <span className="ml-2 text-[11px] text-brand-gold">(édition en cours)</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {nknews.length === 0 && (
              <p className="text-white/60">Aucune actualité publiée.</p>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 shadow-glow-soft">
          <h2 className="text-2xl font-semibold">Remplissage des sessions</h2>
          <p className="mt-2 text-sm text-white/65">
            Visualisez l&apos;occupation de chaque session et les participants déjà inscrits.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {sessionsWithParticipants.map((session) => {
              const statusLabel = session.isCancelled
                ? "Session Annulée"
                : session.isOpen
                ? "Session ouverte"
                : "Session fermée";
              const statusClasses = session.isCancelled
                ? "border-red-500/40 bg-red-500/15 text-red-200"
                : session.isOpen
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200"
                : "border-amber-400/40 bg-amber-400/15 text-amber-200";

              return (
                <div key={session.sessionId} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-gold/80">{session.sessionLabel}</p>
                      <h3 className="mt-1 text-lg font-semibold text-white">{session.formationTitle}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
                        <span>
                          {session.reservedCount}/{session.capacity} places — ${session.percent}% rempli
                        </span>
                        <span className={`inline-flex rounded-full border px-3 py-1 font-semibold ${statusClasses}`}>
                          {statusLabel}
                        </span>
                      </div>
                      {session.isCancelled && (
                        <p className="mt-2 text-xs text-red-200">
                          Session Annulée : pensez à prévenir les participants déjà inscrits.
                        </p>
                      )}
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-primary/40 bg-brand-primary/10 text-center text-sm font-semibold text-brand-gold">
                      {session.percent}%
                    </div>
                  </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-gold"
                    style={{ width: `${session.percent}%` }}
                  />
                </div>
                <div className="mt-4 space-y-2 text-sm text-white/70">
                  {session.participants.length === 0 ? (
                    <p className="text-xs text-white/50">Aucun participant pour le moment.</p>
                  ) : (
                    session.participants.map((participant) => (
                      <div key={participant.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2">
                        <div>
                          <p className="font-semibold text-white">{participant.customerName}</p>
                          <p className="text-xs text-white/50">{participant.customerEmail}</p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                          {participant.paymentMethod === "stripe" ? "Stripe" : "Virement"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
            })}
            {sessionsWithParticipants.length === 0 && !isLoading && (
              <p className="text-sm text-white/60">Aucune session planifiée.</p>
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
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reservations.filter((r) => ACTIVE_RES_STATUS.includes(r.status)).map((reservation) => {
                  const sessionDraft = reservationSessionDrafts[reservation.id] ?? reservation.sessionId;
                  const statusDraft = reservationStatusDrafts[reservation.id] ?? reservation.status;
                  const sessionOptions = sessionsByFormation[reservation.formationId] ?? [];
                  const isUpdatingReservation = updatingReservationId === reservation.id;
                  const hasSessionChange = Boolean(sessionDraft && sessionDraft !== reservation.sessionId);
                  const hasStatusChange = statusDraft !== reservation.status;
                  const hasPendingChanges = hasSessionChange || hasStatusChange;

                  return (
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
                            reservation.status === "stripe_confirmed" || reservation.status === "virement_confirme"
                              ? "bg-emerald-400/15 text-emerald-200"
                              : reservation.status === "stripe_pending"
                              ? "bg-amber-400/15 text-amber-200"
                              : reservation.status === "cancelled"
                              ? "bg-red-400/20 text-red-200"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          {RESERVATION_STATUS_LABELS[reservation.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <select
                            value={sessionDraft}
                            onChange={(event) =>
                              setReservationSessionDrafts((prev) => ({
                                ...prev,
                                [reservation.id]: event.target.value,
                              }))
                            }
                            className="rounded-xl border border-brand-primary/40 bg-brand-midnight px-3 py-2 text-xs text-white focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                          >
                            {sessionOptions.map((option) => (
                              <option
                                key={option.sessionId}
                                value={option.sessionId}
                                disabled={option.isCancelled && option.sessionId !== reservation.sessionId}
                              >
                                {option.sessionLabel}
                                {option.isCancelled
                                  ? " — Annulée"
                                  : option.remaining <= 0
                                  ? " — complet"
                                  : ""}
                              </option>
                            ))}
                          </select>
                          <select
                            value={statusDraft}
                            onChange={(event) =>
                              setReservationStatusDrafts((prev) => ({
                                ...prev,
                                [reservation.id]: event.target.value as AdminReservationStatus,
                              }))
                            }
                            className="rounded-xl border border-brand-primary/40 bg-brand-midnight px-3 py-2 text-xs text-white focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                          >
                            {RESERVATION_STATUS_OPTIONS.map((statusOption) => (
                              <option key={statusOption} value={statusOption}>
                                {RESERVATION_STATUS_LABELS[statusOption]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn-primary text-[10px] uppercase tracking-[0.35em] disabled:opacity-60"
                            disabled={!hasPendingChanges || isUpdatingReservation}
                            onClick={() =>
                              updateReservation(reservation.id, {
                                ...(hasSessionChange ? { sessionId: sessionDraft } : {}),
                                ...(hasStatusChange ? { status: statusDraft } : {}),
                              })
                            }
                          >
                            {isUpdatingReservation ? "Mise à jour..." : "Appliquer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                  <div className="flex flex-col items-end gap-2 text-xs">
                    <span className="uppercase tracking-[0.3em] text-white/50">
                      {dateFormatter.format(new Date(message.createdAt))}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                        message.status === "handled"
                          ? "bg-emerald-400/15 text-emerald-200"
                          : "bg-amber-400/15 text-amber-200"
                      }`}
                    >
                      {message.status === "handled" ? "Traité" : "Nouveau"}
                    </span>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-line rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-white/80">
                  {message.message}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {message.status === "handled" ? (
                    <button
                      type="button"
                      className="btn-secondary text-xs uppercase tracking-[0.3em]"
                      onClick={() => handleContactStatusChange(message.id, "new")}
                    >
                      Marquer comme à traiter
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary text-xs uppercase tracking-[0.3em]"
                      onClick={() => handleContactStatusChange(message.id, "handled")}
                    >
                      Marquer comme traité
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-200 transition hover:bg-red-500/10"
                    onClick={() => handleContactDelete(message.id)}
                  >
                    supprimer
                  </button>
                </div>
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



































