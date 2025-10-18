import { Link } from "react-router-dom";

export default function CoursConseils() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Cours et Conseils personnalisés en ligne</h1>
      <p className="max-w-2xl text-center mb-8">
        Nathalie Karsenti vous accompagne personnellement à distance avec des séances individuelles ou en petit groupe.
        Perfectionnez votre jeu d’acteur, votre aisance orale ou préparez un concours d’entrée.
      </p>
      <Link to="/contact">
        <button className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition">
          Réserver une séance
        </button>
      </Link>
    </section>
  );
}

