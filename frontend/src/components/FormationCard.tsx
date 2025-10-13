import { Formation } from "../types";

interface FormationCardProps {
  formation: Formation;
  onReserve: (formation: Formation) => void;
}

function FormationCard({ formation, onReserve }: FormationCardProps) {
  return (
    <article className="card-lux flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold text-white">{formation.title}</h3>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-brand-gold/80">
            {formation.location}
          </p>
        </div>
        <div className="rounded-full border border-brand-primary/40 bg-brand-primary/20 px-4 py-1 text-sm font-semibold text-brand-gold">
          {formation.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-white/70">{formation.description}</p>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold/70">Objectifs pédagogiques</p>
        <ul className="mt-3 space-y-2 text-sm text-white/70">
          {formation.objectives.map((objective) => (
            <li key={objective} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand-gold" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <p className="text-sm font-semibold text-white">Prochaines dates</p>
        <ul className="mt-3 space-y-2 text-sm text-white/60">
          {formation.sessions.map((session) => (
            <li key={session.id}>{session.label}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-white/60">
        <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1">
          Durée : {formation.duration}
        </span>
        <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1">
          Intervenante : {formation.teacher}
        </span>
      </div>

      <button type="button" className="btn-primary self-start" onClick={() => onReserve(formation)}>
        Réserver maintenant
      </button>
    </article>
  );
}

export default FormationCard;
