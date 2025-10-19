import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import ReservationModal from "../components/ReservationModal";
import AnimatedContent from "../components/reactbits/AnimatedContent";
import { apiClient } from "../lib/api";
import { Formation } from "../types";

interface SessionAvailabilityInfo {
  sessionId: string;
  capacity: number;
  isOpen: boolean;
  isCancelled: boolean;
  reservedCount: number;
  remaining: number;
}

type SessionAvailabilityMap = Record<string, SessionAvailabilityInfo>;

interface QuickStripeCheckoutFormProps {
  formation: Formation;
  name: string;
  email: string;
  sessionId: string;
  errorMessage: string | null;
  isLoading: boolean;
  availability: SessionAvailabilityMap;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSessionChange: (value: string) => void;
  onErrorChange: (value: string | null) => void;
  onLoadingChange: (value: boolean) => void;
}

function QuickStripeCheckoutForm({
  formation,
  name,
  email,
  sessionId,
  errorMessage,
  isLoading,
  availability,
  onNameChange,
  onEmailChange,
  onSessionChange,
  onErrorChange,
  onLoadingChange,
}: QuickStripeCheckoutFormProps) {
  const sessionAvailability = sessionId ? availability[sessionId] : undefined;
  const isSessionCancelled = sessionAvailability ? sessionAvailability.isCancelled : false;
  const isSessionOpen = sessionAvailability ? sessionAvailability.isOpen : true;
  const hasSeats = sessionAvailability ? sessionAvailability.remaining > 0 : true;
  const isSessionAvailable = !isSessionCancelled && isSessionOpen && hasSeats;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formation) {
      onErrorChange("La formation sÃ©lectionnÃ©e est indisponible.");
      return;
    }

    if (!name || !email || !sessionId) {
      onErrorChange("Merci de renseigner nom, email et session.");
      return;
    }

    if (isSessionCancelled) {
      onErrorChange("Cette session a Ã©tÃ© annulÃ©e. Merci de sÃ©lectionner une autre date.");
      return;
    }

    if (!isSessionAvailable) {
      onErrorChange("Cette session est complÃ¨te ou momentanÃ©ment fermÃ©e aux rÃ©servations.");
      return;
    }

    try {
      onLoadingChange(true);
      onErrorChange(null);

      const response = await apiClient.post("/api/stripe/create-checkout-session", {
        customerName: name,
        customerEmail: email,
        formationId: formation.id,
        sessionId,
      });

      const checkoutUrl = response.data?.url;
      if (!checkoutUrl) {
        throw new Error("Lien de redirection Stripe indisponible.");
      }

      window.location.href = checkoutUrl;
    } catch (checkoutError) {
      console.error("Erreur de paiement rapide:", checkoutError);
      if (
        typeof checkoutError === "object" &&
        checkoutError !== null &&
        "isAxiosError" in checkoutError &&
        (checkoutError as { isAxiosError: boolean }).isAxiosError
      ) {
        const axiosError = checkoutError as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        onErrorChange(
          axiosError.response?.data?.message ??
            axiosError.message ??
            "Impossible de dÃ©marrer le paiement Stripe pour le moment."
        );
      } else if (checkoutError instanceof Error) {
        onErrorChange(checkoutError.message);
      } else {
        onErrorChange("Impossible de dÃ©marrer le paiement Stripe pour le moment.");
      }
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <form className="mt-4 grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
      <div className="md:col-span-1">
        <label htmlFor="quick-name" className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          Nom complet
        </label>
        <input
          id="quick-name"
          type="text"
          required
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          placeholder="Votre nom"
        />
      </div>
      <div className="md:col-span-1">
        <label htmlFor="quick-email" className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          Email
        </label>
        <input
          id="quick-email"
          type="email"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          placeholder="email@example.com"
        />
      </div>
      <div className="md:col-span-1">
        <label htmlFor="quick-session" className="block text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
          Session
        </label>
        <select
          id="quick-session"
          required
          value={sessionId}
          onChange={(event) => onSessionChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-brand-primary/40 bg-brand-midnight px-3 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
        >
          <option value="" disabled>
            Selectionner
          </option>
          {formation.sessions.map((session) => (
            <option
              key={session.id}
              value={session.id}
              disabled={Boolean(availability[session.id]?.isCancelled)}
            >
              {session.label}
              {(() => {
                const info = availability[session.id];
                if (!info) {
                  return "";
                }
                if (info.isCancelled) {
                  return " â€“ session annulÃ©e";
                }
                if (!info.isOpen) {
                  return " â€“ session fermÃ©e";
                }
                if (info.remaining <= 0) {
                  return " â€” complet";
                }
                return "";
              })()}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-3 flex flex-wrap items-center gap-3 pt-1">
        <button type="submit" className="btn-primary" disabled={isLoading || !isSessionAvailable}>
          {isLoading ? "Redirection vers Stripe..." : "Payer maintenant avec Stripe"}
        </button>
        <span className="text-xs text-white/50">
          {isSessionAvailable
            ? "Vous serez redirigÃ© vers le formulaire sÃ©curisÃ© de Stripe."
            : "Session indisponible : ajustez votre sÃ©lection ou contactez-nous."}
        </span>
      </div>
      {errorMessage && (
        <div className="md:col-span-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}
      {isSessionCancelled && (
        <div className="md:col-span-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Cette session a Ã©tÃ© annulÃ©e. Merci de sÃ©lectionner une autre date.
        </div>
      )}
      {!isSessionCancelled && !isSessionAvailable && (
        <div className="md:col-span-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Cette session est complÃ¨te ou momentanÃ©ment fermÃ©e aux rÃ©servations. Merci de choisir une autre date ou de
          nous contacter.
        </div>
      )}
    </form>
  );
}

function Formations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickSessionId, setQuickSessionId] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [availability, setAvailability] = useState<SessionAvailabilityMap>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const location = useLocation();

  const paiementMessage = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("paiement");
    if (status === "stripe-success") {
      return { tone: "success", text: "Merci ! Votre paiement Stripe a bien ete confirme." };
    }
    if (status === "stripe-cancel") {
      return { tone: "warning", text: "Le paiement Stripe a ete annule. Vous pouvez reessayer a tout moment." };
    }
    return null;
  }, [location.search]);

  useEffect(() => {
    const fetchFormations = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<Formation[]>("/api/formations");
        setFormations(response.data);
      } catch (err) {
        console.error("Erreur de recuperation des formations:", err);
        setError("Impossible de charger les formations pour le moment.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormations();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setAvailabilityLoading(true);
        const response = await apiClient.get<{ sessions: SessionAvailabilityInfo[] }>("/api/availability");
        const map = response.data.sessions.reduce<SessionAvailabilityMap>((acc, session) => {
          acc[session.sessionId] = session;
          return acc;
        }, {});
        setAvailability(map);
        setAvailabilityError(null);
      } catch (err) {
        console.error("Erreur de rÃ©cupÃ©ration des disponibilitÃ©s:", err);
        setAvailabilityError("Impossible de rÃ©cupÃ©rer les disponibilitÃ©s en temps rÃ©el.");
      } finally {
        setAvailabilityLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const stageIntensif = useMemo(
    () => formations.find((formation) => formation.id === "stage-theatre-doublage"),
    [formations]
  );

  const stageSessionsByMonth = useMemo(() => {
    if (!stageIntensif) {
      return {} as Record<string, string[]>;
    }
    const formatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
    return stageIntensif.sessions.reduce<Record<string, string[]>>((acc, session) => {
      const date = new Date(session.startDate);
      const monthKey = Number.isNaN(date.getTime()) ? "Sessions a planifier" : formatter.format(date);
      acc[monthKey] = acc[monthKey] ?? [];
      acc[monthKey].push(session.label);
      return acc;
    }, {});
  }, [stageIntensif]);

  useEffect(() => {
    if (!stageIntensif?.sessions?.length) {
      setQuickSessionId("");
      return;
    }

    setQuickSessionId((current) => {
      const sessions = stageIntensif.sessions;

      if (current && sessions.some((session) => session.id === current)) {
        const info = availability[current];
        if (!info || (!info.isCancelled && info.isOpen && info.remaining > 0)) {
          return current;
        }
      }

      const firstAvailable = sessions.find((session) => {
        const info = availability[session.id];
        return !info || (!info.isCancelled && info.isOpen && info.remaining > 0);
      });

      return firstAvailable?.id ?? sessions[0].id;
    });
  }, [availability, stageIntensif]);
  const stageSessionsEntries = useMemo(() => Object.entries(stageSessionsByMonth), [stageSessionsByMonth]);

  const openModal = (formation: Formation) => {
    setSelectedFormation(formation);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFormation(null);
  };

  return (
    <div className="bg-brand-midnight pb-20 text-white sm:pb-24">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/30 via-brand-midnight to-brand-midnight" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:max-w-7xl">
          <AnimatedContent distance={90}>
            <div className="space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/60 sm:text-xs">
                Reservations
              </p>
              <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl">Choisissez votre formation</h1>
              <p className="max-w-2xl text-sm text-white/70 sm:text-base">
                Toutes nos sessions sont limitees afin de garantir un accompagnement attentif. Choisissez votre mode de paiement : Stripe pour un reglement immediat ou virement bancaire avec IBAN.
              </p>
            </div>
          </AnimatedContent>
        </div>
      </section>

      {stageIntensif && (
        <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 lg:max-w-7xl">
          <AnimatedContent distance={70} delay={0.05}>
            <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft backdrop-blur sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                    Calendrier des stages ThÃ©Ã¢tre &amp; doublage
                  </h2>
                  <p className="mt-3 text-sm text-white/70 sm:text-base">
                    Toutes les sessions proposÃ©es par Nathalie Karsenti Ã  Nantes. Places limitÃ©es Ã  16 personnes par week-end. Confirmation dÃ©finitive aprÃ¨s paiement.
                  </p>
                </div>
                <div className="inline-flex max-w-full items-center justify-center rounded-2xl border border-brand-primary/30 bg-brand-primary/20 px-5 py-3 text-sm font-semibold text-brand-gold shadow-glow sm:text-base">
                  Stage week-end : 285&nbsp;EUR
                </div>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {stageSessionsEntries.map(([month, sessions]) => (
                  <div key={month} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-gold/80">{month}</h3>
                    <ul className="mt-4 space-y-2 text-sm text-white/65">
                      {sessions.map((label) => (
                        <li key={label} className="flex items-center gap-2">
                          <span className="inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-gold" />
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-10 rounded-2xl border border-brand-primary/20 bg-brand-primary/10 p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-white sm:text-xl">Paiement rapide par carte (Stripe)</h3>
                <p className="mt-2 text-sm text-white/70 sm:text-base">
                  Remplissez ce formulaire pour saisir vos informations et confirmez le paiement sÃ©curisÃ© via Stripe.
                </p>
                <QuickStripeCheckoutForm
                  formation={stageIntensif}
                  name={quickName}
                  email={quickEmail}
                  sessionId={quickSessionId}
                  errorMessage={quickError}
                  isLoading={quickLoading}
                  availability={availability}
                  onNameChange={setQuickName}
                  onEmailChange={setQuickEmail}
                  onSessionChange={setQuickSessionId}
                  onErrorChange={setQuickError}
                  onLoadingChange={setQuickLoading}
                />
                <p className="mt-4 text-xs text-white/60 sm:text-sm">
                  Un imprÃ©vu ? Vous pourrez modifier votre rÃ©servation plus tard via{" "}
                  <Link to="/reservations" className="font-semibold text-brand-gold hover:underline">
                    l&apos;espace dÃ©diÃ©
                  </Link>.
                </p>
                {availabilityLoading && (
                  <p className="mt-3 text-xs text-white/60 sm:text-sm">
                    Actualisation des disponibilitÃ©s en coursâ€¦
                  </p>
                )}
                {availabilityError && (
                  <p className="mt-3 text-xs text-amber-200 sm:text-sm">{availabilityError}</p>
                )}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="btn-secondary w-full sm:w-auto"
                  onClick={() => openModal(stageIntensif)}
                >
                  Autres options de rÃ©servation (virement)
                </button>
                <p className="text-xs text-white/50 sm:text-sm">
                  Besoin d&apos;un virement ou d&apos;une facture ? Ouvrez la rÃ©servation classique.
                </p>
              </div>
            </div>
          </AnimatedContent>
        </div>
      )}

      {paiementMessage && (
        <div
          className={`mx-auto mt-12 max-w-6xl rounded-3xl border px-6 py-4 text-sm sm:px-8 sm:text-base lg:max-w-7xl ${
            paiementMessage.tone === "success"
              ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
              : "border-amber-400/40 bg-amber-400/15 text-amber-100"
          }`}
        >
          {paiementMessage.text}
        </div>
      )}

      {isLoading && (
        <p className="mx-auto mt-12 max-w-6xl px-4 text-center text-sm text-white/50 sm:text-base lg:max-w-7xl">
          Chargement des informationsâ€¦
        </p>
      )}

      {error && (
        <p className="mx-auto mt-12 max-w-6xl px-4 text-center text-sm text-red-300 sm:text-base lg:max-w-7xl">{error}</p>
      )}

      <ReservationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        formation={selectedFormation}
        availability={availability}
      />
    </div>
  );
}

export default Formations;


