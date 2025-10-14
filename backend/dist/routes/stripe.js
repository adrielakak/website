import { Router } from "express";
import Stripe from "stripe";
import { sendReservationConfirmationEmail } from "../services/emailService.js";
import { formations } from "../data/formations.js";
import { getSessionAvailability } from "../services/availabilityService.js";
import { addReservation, countActiveReservationsBySession } from "../services/reservationStorage.js";

const router = Router();

/* -------------------------------
   UTILITAIRES STRIPE
--------------------------------- */
function resolveLineItems(formation, sessionLabel, configuredValue) {
  const cleanedValue = configuredValue?.trim();
  if (cleanedValue) {
    if (cleanedValue.startsWith("price_")) {
      return [{ price: cleanedValue, quantity: 1 }];
    }
    const parsed = Number.parseFloat(cleanedValue);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(parsed * 100),
            product_data: {
              name: formation.title,
              description: sessionLabel,
            },
          },
        },
      ];
    }
  }
  return [
    {
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(formation.price * 100),
        product_data: {
          name: formation.title,
          description: sessionLabel,
        },
      },
    },
  ];
}

function resolveClientBaseUrl() {
  const raw = process.env.CLIENT_URL ?? "http://localhost:5173";
  return raw.trim().replace(/\/+$/, "");
}

/* -------------------------------
   ROUTE PRINCIPALE : CRÉATION DE SESSION STRIPE
--------------------------------- */
router.post("/create-checkout-session", async (req, res) => {
  const { customerName, customerEmail, formationId, sessionId } = req.body ?? {};

  // Validation de base
  if (!customerName || !customerEmail || !formationId || !sessionId) {
    return res.status(400).json({ message: "Informations de réservation incomplètes." });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({ message: "La clé Stripe n'est pas configurée." });
  }

  const formation = formations.find((item) => item.id === formationId);
  if (!formation) {
    return res.status(404).json({ message: "Formation introuvable." });
  }

  const sessionOption = formation.sessions.find((session) => session.id === sessionId);
  if (!sessionOption) {
    return res.status(404).json({ message: "Session sélectionnée introuvable." });
  }

  const envKey = `STRIPE_PRICE_ID_${formationId.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
  const lineItems = resolveLineItems(formation, sessionOption.label, process.env[envKey]);

  // Vérifie la disponibilité
  const [availability, activeCount] = await Promise.all([
    getSessionAvailability(sessionId),
    countActiveReservationsBySession(sessionId),
  ]);

  if (availability.isCancelled) {
    return res.status(409).json({ message: "Cette session a été annulée. Merci de choisir une autre date." });
  }
  if (!availability.isOpen) {
    return res.status(409).json({ message: "Cette session est momentanément fermée aux réservations." });
  }
  if (activeCount >= availability.capacity) {
    return res.status(409).json({ message: "Cette session est complète. Merci de choisir une autre date." });
  }

  // Crée la session Stripe
  const stripe = new Stripe(stripeSecretKey);
  const metadata = { formationId, sessionId, customerName, customerEmail };

  try {
    const successBase = resolveClientBaseUrl();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      metadata,
      line_items: lineItems,
      success_url: `${successBase}/formations?paiement=stripe-success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successBase}/formations?paiement=stripe-cancel`,
      allow_promotion_codes: false,
      billing_address_collection: "auto",
    });

    // Enregistre la réservation
    const reservation = await addReservation({
      customerName,
      customerEmail,
      formationId,
      formationTitle: formation.title,
      sessionId,
      sessionLabel: sessionOption.label,
      paymentMethod: "stripe",
      status: "stripe_pending",
      stripeSessionId: checkoutSession.id,
    });

    // 🔔 Envoi automatique du mail de confirmation
    try {
      await sendReservationConfirmationEmail({
        reservation: {
          ...reservation,
          location: formation.location || "Ateliers Théâtre de Nantes — Centre-ville",
        },
        paymentStatus: "pending",
      });

      console.log(`✅ E-mail de confirmation envoyé à ${customerEmail}`);
    } catch (mailError) {
      console.error("❌ Erreur lors de l'envoi du mail :", mailError);
    }

    // Renvoie l'URL Stripe au frontend
    return res.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Erreur Stripe:", error);
    return res.status(500).json({ message: "Impossible de créer la session de paiement Stripe." });
  }
});

export default router;