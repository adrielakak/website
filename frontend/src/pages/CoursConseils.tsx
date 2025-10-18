import { Link } from "react-router-dom";

export default function CoursConseils() {
  return (
    <div className="bg-brand-midnight text-white">
      <section className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold">Cours et Conseils personnalisés en ligne</h1>
        <p className="mt-4 max-w-2xl text-white/80">
          Nathalie Karsenti vous accompagne à distance avec des séances individuelles ou en petit groupe.
          Perfectionnez votre jeu d’acteur, votre aisance orale ou préparez un concours d’entrée.
        </p>
        <Link to="/contact" className="btn-primary mt-6">
          Réserver une séance
        </Link>
      </section>
    </div>
  );
}
