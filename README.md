# Ateliers Theatre de Nantes

Site web professionnel presentant les ateliers animes par Nathalie Karsenti.
Stack : frontend React (Vite + Tailwind CSS) et backend Node.js/Express avec Stripe Checkout et stockage JSON.

## Demarrage local

```bash
# Installation
cd backend
npm install

cd ../frontend
npm install

# Variables d'environnement
cp ../.env.example ../.env
# Renseigner STRIPE_SECRET_KEY (cle test Stripe), CLIENT_URL, BANK_IBAN, PORT

# Lancer le backend
cd ../backend
npm run dev

# Lancer le frontend
cd ../frontend
npm run dev
```

Frontend : http://localhost:5173  
Backend : http://localhost:4000

## Fonctionnalites

- **Accueil** : hero sombre anime, biographie, carrousel photos, experiences cles et section paiement (Stripe + IBAN).
- **Formations / Reservations** :
  - Catalogue des formations (jeu d'acteur, improvisation, stage theatre & doublage) + calendrier detaille.
  - Reservation avec choix de session et mode de paiement.
  - Paiement Stripe (carte bancaire) ou virement (IBAN affiche).
  - Checkout rapide : formulaire Stripe pre-rempli pour le stage intensif.
- **Contact** : formulaire persistant (stocke dans `backend/data/contactMessages.json`) avec message de confirmation.
- **Responsive** : adapte desktop, tablette et mobile.

## Backend

- `server.ts` : serveur Express, routes API et configuration CORS.
- `routes/stripe.ts` : creation des sessions Stripe Checkout.
- `services/reservationStorage.ts` & `services/contactStorage.ts` : stockage JSON (reservations + messages).
- Donnees :
  - Reservations : `backend/data/reservations.json`
  - Messages de contact : `backend/data/contactMessages.json`

## Frontend

- Pages : `Home`, `Formations`, `Contact`
- Composants : `Navbar`, `PhotoCarousel`, `FormationCard`, `ReservationModal`, `AnimatedContent`
- Requetes API via Axios (`src/lib/api.ts`) - base URL configurable via `VITE_API_URL`

## Tests recommandes

- Reservation Stripe (mode test) et via virement (verifier l'ecriture JSON)
- Soumission du formulaire de contact
- Verification responsive 375 px / 768 px / 1440 px

## Deploiement

### Frontend (Vercel ou Netlify)

1. `cd frontend && npm run build`
2. Deployer le contenu de `frontend/dist`
3. Definir la variable `VITE_API_URL` vers l'URL du backend

### Backend (Render, Railway, VPS...)

1. `cd backend && npm run build`
2. Deployer `backend/dist` avec la commande `npm start`
3. Variables d'environnement a renseigner :
   - `STRIPE_SECRET_KEY`
   - `CLIENT_URL`
   - `BANK_IBAN`
   - `PORT`
4. Persister le dossier `backend/data` (disque Render) ou migrer vers une base de donnees

### Stripe

- Cle test (`sk_test_...`) en developpement, cle live pour la production
- Configurer les URLs de retour Stripe :
  - Succes : `https://votre-front/formations?paiement=stripe-success`
  - Annulation : `https://votre-front/formations?paiement=stripe-cancel`
- Pour utiliser des produits/prix crees dans le dashboard Stripe :
  1. Creer un produit + un prix (ponctuel) dans Stripe.
  2. Recuperer l'identifiant du prix (`price_xxx`).
  3. Ajouter une variable d'environnement `STRIPE_PRICE_ID_<FORMATION_ID>` (ex. pour `stage-theatre-doublage` : `STRIPE_PRICE_ID_STAGE_THEATRE_DOUBLAGE=price_xxx`).
  4. Redemarrer le backend. Sans variable, le montant est calcule depuis `data/formations.ts`.

## Credit

Animations adaptees depuis [ReactBits.dev](https://reactbits.dev) (MIT).  
Developpement : Ateliers Theatre de Nantes by Adriel with love 💜
