import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { formations } from "./data/formations.js";
import adminRouter from "./routes/admin.js";
import availabilityRouter from "./routes/availability.js";
import stripeRouter from "./routes/stripe.js";
import stripeWebhookRouter from "./routes/stripeWebhook.js";
import { addContactMessage } from "./services/contactStorage.js";
import {
  addReservation,
  countActiveReservationsBySession,
} from "./services/reservationStorage.js";
import {
  ensureAvailabilityDefaults,
  getSessionAvailability,
} from "./services/availabilityService.js";
import { sendReservationConfirmationEmail } from "./services/emailService.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const DEFAULT_IBAN = process.env.BANK_IBAN ?? "FR76 XXXX XXXX XXXX XXXX XXXX X";

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "*",
  })
);

app.use("/api/stripe/webhook", stripeWebhookRouter);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/formations", (_req, res) => {
  res.json(formations);
});

app.post("/api/reservations", async (req, res) => {
  const { customerName, customerEmail, formationId, sessionId, paymentMethod } = req.body ?? {};

  if (!customerName || !customerEmail || !formationId || !sessionId || !paymentMethod) {
    return res.status(400).json({ message: "Merci de compléter tous les champs requis." });
  }

  if (paymentMethod !== "virement") {
    return res.status(400).json({ message: "Ce point d'entrée gère uniquement les virements bancaires." });
  }

  const formation = formations.find((item) => item.id === formationId);
  if (!formation) {
    return res.status(404).json({ message: "Formation introuvable." });
  }

  const sessionOption = formation.sessions.find((session) => session.id === sessionId);
  if (!sessionOption) {
    return res.status(404).json({ message: "Session sélectionnée introuvable." });
  }

  const [availability, activeCount] = await Promise.all([
    getSessionAvailability(sessionId),
    countActiveReservationsBySession(sessionId),
  ]);

  if (!availability.isOpen) {
    return res.status(409).json({ message: "Cette session est momentanément fermée aux réservations." });
  }

  if (activeCount >= availability.capacity) {
    return res
      .status(409)
      .json({ message: "Cette session est complète. Merci de choisir une autre date ou nous contacter." });
  }

  try {
    const reservation = await addReservation({
      customerName,
      customerEmail,
      formationId,
      formationTitle: formation.title,
      sessionId,
      sessionLabel: sessionOption.label,
      paymentMethod: "virement",
      status: "virement_en_attente",
    });

    await sendReservationConfirmationEmail({
      reservation,
      paymentStatus: "pending",
    });

    return res.json({
      message:
        "Votre réservation est bien enregistrée. Merci d'effectuer le virement avant le début du stage pour confirmer votre place.",
      iban: DEFAULT_IBAN,
      reservationId: reservation.id,
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la réservation:", error);
    return res.status(500).json({ message: "Impossible d'enregistrer la réservation pour le moment." });
  }
});

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body ?? {};

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Merci de remplir nom, email et message." });
  }

  try {
    const record = await addContactMessage({ name, email, message });
    return res.json({
      message: "Merci pour votre message ! Nous vous recontactons très vite.",
      contactId: record.id,
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du message de contact:", error);
    return res.status(500).json({ message: "Impossible d'enregistrer votre message pour le moment." });
  }
});

app.use("/api/stripe", stripeRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/admin", adminRouter);

await ensureAvailabilityDefaults(formations);

app.listen(PORT, () => {
  console.log(`Serveur Ateliers Théâtre de Nantes démarré sur le port ${PORT}`);
});
