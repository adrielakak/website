export default function Legal() {
  return (
    <section className="p-8 max-w-3xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Mentions légales</h1>

      <div className="space-y-2">
        <p>
          <strong>Éditeur du site :</strong> NK26 — SASU (en cours d'immatriculation)
        </p>
        <p>
          <strong>Siège social :</strong> 8 rue Mercoeur, 44000 Nantes, France
        </p>
        <p>
          <strong>Responsable de publication :</strong> Nathalie Karsenti
        </p>
        <p>
          <strong>Contact :</strong> nk26fr@gmail.com — 06 09 42 59 11
        </p>
        <p>
          <strong>Hébergeur :</strong> Render.com — https://render.com
        </p>
      </div>

      <hr className="my-6" />

      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          <strong>Données personnelles (RGPD) :</strong> les informations collectées via les formulaires de
          contact et de réservation sont utilisées uniquement pour répondre aux demandes, gérer les inscriptions
          et obligations légales. Vous disposez d'un droit d'accès, de rectification et de suppression. Pour
          l'exercer, écrivez à <a className="text-blue-600 underline" href="mailto:nk26fr@gmail.com">nk26fr@gmail.com</a>.
        </p>
        <p>
          <strong>Cookies :</strong> le site n'utilise que des cookies strictement nécessaires au fonctionnement et à
          la sécurité (par ex. redirections de paiement Stripe). Aucun cookie publicitaire n'est déposé par NK26.
        </p>
        <p>
          <strong>Propriété intellectuelle :</strong> les contenus (textes, images, logos, vidéos) sont protégés.
          Toute reproduction non autorisée est interdite.
        </p>
        <p>
          <strong>Responsabilité :</strong> NK26 s'efforce d'assurer l'exactitude des informations. Le site peut contenir
          des liens externes dont le contenu relève de la seule responsabilité de leurs éditeurs.
        </p>
        <p>
          <strong>Litiges :</strong> en cas de désaccord, une recherche de solution amiable est privilégiée. À défaut,
          les juridictions françaises seront compétentes. Droit applicable : droit français.
        </p>
        <p className="text-gray-500">Dernière mise à jour : 15/10/2025</p>
      </div>
    </section>
  );
}

