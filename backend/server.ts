import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { getFormations } from "./services/formationsService.js";
import adminRouter from "./routes/admin.js";
import availabilityRouter from "./routes/availability.js";
import stripeRouter from "./routes/stripe.js";
import stripeWebhookRouter from "./routes/stripeWebhook.js";
import nknewsRoutes from "./routes/nknews.js";
import uploadsRouter from "./routes/uploads.js";
import { resolveDataPath } from "./services/storagePaths.js";
import { addContactMessage } from "./services/contactStorage.js";
import {
  addReservation,
  countActiveReservationsBySession,
  findReservationById,
  readReservations,
  ReservationRecord,
  updateReservationById,
} from "./services/reservationStorage.js";
import {
  ensureAvailabilityDefaults,
  getAvailabilityList,
  getSessionAvailability,
} from "./services/availabilityService.js";
import { sendReservationConfirmationEmail } from "./services/emailService.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const DEFAULT_IBAN = process.env.BANK_IBAN ?? "FR76 XXXX XXXX XXXX XXXX XXXX X";

const rawOrigins = process.env.CLIENT_URLS ?? process.env.CLIENT_URL ?? "*";
const allowedOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  })
);

app.use("/api/stripe/webhook", stripeWebhookRouter);

app.use(express.json());
app.use("/api/uploads", uploadsRouter);
app.use("/uploads", express.static(resolveDataPath("uploads")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/formations", async (_req, res) => {
  const formations = await getFormations();
  res.json(formations);
});

app.use("/api/nknews", nknewsRoutes);

app.post("/api/reservations", async (req, res) => {
  const { customerName, customerEmail, formationId, sessionId, paymentMethod } = req.body ?? {};

  if (!customerName || !customerEmail || !formationId || !sessionId || !paymentMethod) {
    return res.status(400).json({ message: "Merci de compléter tous les champs requis." });
  }

  if (paymentMethod !== "virement") {
    return res.status(400).json({ message: "Ce point d'entrée gère uniquement les virements bancaires." });
  }

  const formations = await getFormations();
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

  if (availability.isCancelled) {
    return res
      .status(409)
      .json({ message: "Cette session a été annulée. Merci de choisir une autre date ou de nous contacter." });
  }

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

app.post("/api/reservations/manage", async (req, res) => {
  const { reservationId, customerEmail } = req.body ?? {};

  if (!reservationId || !customerEmail) {
    return res.status(400).json({ message: "Merci de renseigner l'identifiant de réservation et votre email." });
  }

  try {
    const reservation = await findReservationById(reservationId);
    if (
      !reservation ||
      reservation.customerEmail.trim().toLowerCase() !== String(customerEmail).trim().toLowerCase()
    ) {
      return res.status(404).json({ message: "Réservation introuvable. Vérifiez les informations saisies." });
    }

    const formations = await getFormations();
    const [availabilityList, reservations] = await Promise.all([getAvailabilityList(formations), readReservations()]);
    const activeStatuses = new Set<ReservationRecord["status"]>(["stripe_pending", "stripe_confirmed", "virement_en_attente"]);

    const sessions = availabilityList
      .filter((session) => session.formationId === reservation.formationId)
      .map((session) => {
        const reservedCount = reservations.filter(
          (entry) => entry.sessionId === session.sessionId && activeStatuses.has(entry.status)
        ).length;

        return {
          sessionId: session.sessionId,
          sessionLabel: session.sessionLabel,
          startDate: session.startDate,
          endDate: session.endDate,
          capacity: session.capacity,
          isOpen: session.isOpen && !session.isCancelled,
          isCancelled: session.isCancelled,
          reservedCount,
          remaining: session.isCancelled ? 0 : Math.max(session.capacity - reservedCount, 0),
        };
      });

    const sanitizedReservation = {
      id: reservation.id,
      formationId: reservation.formationId,
      formationTitle: reservation.formationTitle,
      sessionId: reservation.sessionId,
      sessionLabel: reservation.sessionLabel,
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      paymentMethod: reservation.paymentMethod,
      status: reservation.status,
      createdAt: reservation.createdAt,
    };

    return res.json({
      reservation: sanitizedReservation,
      sessions,
    });
  } catch (error) {
    console.error("Erreur manage reservation:", error);
    return res.status(500).json({ message: "Impossible de récupérer la réservation pour le moment." });
  }
});

app.patch("/api/reservations/:reservationId", async (req, res) => {
  const { reservationId } = req.params;
  const { customerEmail, sessionId: nextSessionId } = req.body ?? {};

  if (!customerEmail || !nextSessionId) {
    return res.status(400).json({ message: "Merci de préciser l'email et la nouvelle session souhaitée." });
  }

  try {
    const reservation = await findReservationById(reservationId);
    if (
      !reservation ||
      reservation.customerEmail.trim().toLowerCase() !== String(customerEmail).trim().toLowerCase()
    ) {
      return res.status(404).json({ message: "Réservation introuvable pour cet email." });
    }

    if (reservation.status === "cancelled") {
      return res
        .status(409)
        .json({ message: "Cette réservation est annulée. Merci de nous contacter pour toute assistance." });
    }

    const formations = await getFormations();
    const formation = formations.find((form) => form.id === reservation.formationId);
    if (!formation) {
      return res.status(404).json({ message: "Formation associée introuvable." });
    }

    const targetSession = formation.sessions.find((session) => session.id === nextSessionId);
    if (!targetSession) {
      return res.status(404).json({ message: "Session introuvable pour cette formation." });
    }

    const availability = await getSessionAvailability(nextSessionId);
    if (availability.isCancelled) {
      return res.status(409).json({ message: "Cette session a été annulée." });
    }
    if (!availability.isOpen) {
      return res.status(409).json({ message: "Cette session est fermée aux réservations." });
    }

    const activeCount = await countActiveReservationsBySession(nextSessionId, reservation.id);
    if (activeCount >= availability.capacity) {
      return res
        .status(409)
        .json({ message: "Cette session est complète. Merci de choisir une autre date disponible." });
    }

    const updated = await updateReservationById(reservation.id, {
      sessionId: nextSessionId,
      sessionLabel: targetSession.label,
    });

    if (!updated) {
      return res.status(500).json({ message: "Impossible de mettre à jour la réservation." });
    }

    try {
      await sendReservationConfirmationEmail({
        reservation: updated as any,
        paymentStatus: updated.status === "stripe_confirmed" ? "confirmed" : "pending",
        reason: "changed",
      });
    } catch (e) {
      console.warn("E-mail de confirmation non envoyé après changement de session (client):", e);
    }

    const sanitizedReservation = {
      id: updated.id,
      formationId: updated.formationId,
      formationTitle: updated.formationTitle,
      sessionId: updated.sessionId,
      sessionLabel: updated.sessionLabel,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      paymentMethod: updated.paymentMethod,
      status: updated.status,
      createdAt: updated.createdAt,
    };

    return res.json({
      message: "Votre changement de session est confirmé.",
      reservation: sanitizedReservation,
    });
  } catch (error) {
    console.error("Erreur update reservation:", error);
    return res.status(500).json({ message: "Impossible de modifier la réservation pour le moment." });
  }
});

app.use("/api/stripe", stripeRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/admin", adminRouter);

await ensureAvailabilityDefaults(await getFormations());

app.listen(PORT, () => {
  console.log(`Serveur Ateliers Théâtre de Nantes démarré sur le port ${PORT}`);
});
