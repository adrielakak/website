export default function Legal() {
  return (
    <div className="bg-brand-midnight text-white">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Mentions légales</h1>

        <div className="mt-6 space-y-2 text-white/80">
          <p><strong>Éditeur du site :</strong> NK26 — SASU </p>
          <p><strong>Siège social :</strong>Rue Briord, 44000 Nantes, France</p>
          <p><strong>Responsable de publication :</strong> Nathalie Karsenti</p>
          <p><strong>Contact :</strong> nk26fr@gmail.com — 06 09 42 59 11</p>
          <p><strong>Hébergeur :</strong> Render.com — https://render.com</p>
        </div>

        <hr className="my-8 border-white/10" />

        <div className="space-y-4 text-sm leading-relaxed text-white/80">
          <p>
            <strong>Données personnelles (RGPD) :</strong> les informations collectées via les formulaires de
            contact et de réservation sont utilisées uniquement pour répondre aux demandes, gérer les inscriptions
            et obligations légales. Vous disposez d'un droit d'accès, de rectification et de suppression. Pour l'exercer,
            écrivez à <a className="text-brand-gold underline" href="mailto:nk26fr@gmail.com">nk26fr@gmail.com</a>.
          </p>
          <p>
            <strong>Cookies :</strong> le site n'utilise que des cookies strictement nécessaires au fonctionnement et à la sécurité (ex. Stripe).
          </p>
          <p>
            <strong>Propriété intellectuelle :</strong> les contenus (textes, images, logos, vidéos) sont protégés. Toute reproduction non autorisée est interdite.
          </p>
          <p>
            <strong>Responsabilité :</strong> NK26 s'efforce d'assurer l'exactitude des informations. Les liens externes relèvent de la seule responsabilité de leurs éditeurs.
          </p>
          <p>
            <strong>Litiges :</strong> en cas de désaccord, une solution amiable est recherchée. À défaut, les juridictions françaises sont compétentes.
          </p>
          <p className="text-white/40">Dernière mise à jour : 04/11/2025</p>
        </div>
      </section>
    </div>
  );
}
