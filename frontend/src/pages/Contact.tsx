import { FormEvent, useState } from "react";

import AnimatedContent from "../components/reactbits/AnimatedContent";
import { apiClient } from "../lib/api";

function Contact() {
  const [formValues, setFormValues] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChange =
    (field: "name" | "email" | "message") =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await apiClient.post("/api/contact", formValues);
      setFeedback({ type: "success", text: response.data?.message ?? "Merci pour votre message !" });
      setFormValues({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Erreur lors de l'envoi du message de contact:", error);
      setFeedback({
        type: "error",
        text: "Impossible d'enregistrer votre message pour le moment. Merci de réessayer ou de nous écrire directement par email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-brand-midnight pb-24 pt-28 text-white">
      <div className="mx-auto max-w-4xl rounded-[36px] border border-white/10 bg-white/[0.04] px-6 py-16 shadow-glow-soft backdrop-blur md:px-12">
        <AnimatedContent distance={80}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.45em] text-white/60">Contact</span>
            <h1 className="mt-5 text-4xl font-semibold text-white md:text-5xl">Entrons en scène ensemble</h1>
            <p className="mt-4 text-sm text-white/65">
              Remplissez le formulaire pour toute question ou pour bâtir un programme sur mesure. Nous vous répondons sous 48 heures ouvrées.
            </p>
          </div>
        </AnimatedContent>

        <AnimatedContent distance={80} delay={0.05}>
          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white">
                Nom
              </label>
              <input
                id="name"
                required
                value={formValues.name}
                onChange={handleChange("name")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                placeholder="Votre nom complet"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formValues.email}
                onChange={handleChange("email")}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                placeholder="votreadresse@email.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-white">
                Message
              </label>
              <textarea
                id="message"
                required
                value={formValues.message}
                onChange={handleChange("message")}
                rows={6}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-brand-primary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                placeholder="Parlez-nous de votre projet ou posez votre question"
              />
            </div>

            <button type="submit" className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>
              {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
            </button>
          </form>
        </AnimatedContent>

        {feedback && (
          <AnimatedContent distance={40} delay={0.1}>
            <div
              className={`mt-8 rounded-2xl border px-5 py-4 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                  : "border-red-400/40 bg-red-400/15 text-red-100"
              }`}
            >
              {feedback.text}
            </div>
          </AnimatedContent>
        )}

        <AnimatedContent distance={70} delay={0.05}>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm font-semibold text-white/70">Email</p>
              <a href="mailto:nk26fr@gmail.com" className="mt-2 block text-lg font-semibold text-white hover:text-brand-gold">
                nk26fr@gmail.com
              </a>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm font-semibold text-white/70">Téléphone</p>
              <a href="tel:+33652897410" className="mt-2 block text-lg font-semibold text-white hover:text-brand-gold">
                06 52 89 74 10
              </a>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </div>
  );
}

export default Contact;
