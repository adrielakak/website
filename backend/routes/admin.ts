import { NextFunction, Request, Response, Router } from "express";

import { getFormations, addSession } from "../services/formationsService.js";
import {
  getAvailabilityList,
  getSessionAvailability,
  SessionAvailability,
  upsertSessionAvailability,
} from "../services/availabilityService.js";
import {
  countActiveReservationsBySession,
  findReservationById,
  listReservations,
  readReservations,
  ReservationRecord,
  ReservationStatus,
  ReservationUpdate,
  updateReservationById,
  deleteReservationById,
} from "../services/reservationStorage.js";
import { deleteContactMessage, listContactMessages, updateContactMessageStatus } from "../services/contactStorage.js";
import { sendReservationConfirmationEmail } from "../services/emailService.js";
import { sendReservationCancellationEmail } from "../services/emailService.js";

const router = Router();

function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.ADMIN_API_KEY;
  if (!configuredKey) {
    return res
      .status(500)
      .json({ message: "Clé administrateur non configurée sur le serveur." });
  }

  const providedKey = req.header("x-admin-key");
  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({ message: "Clé administrateur invalide." });
  }

  return next();
}

router.use(requireAdminKey);

router.get("/availability", async (_req, res) => {
  try {
    const formations = await getFormations();
    const [availability, reservations] = await Promise.all([
      getAvailabilityList(formations),
      readReservations(),
    ]);
    const activeStatuses = new Set(["stripe_pending", "stripe_confirmed", "virement_en_attente"]);

    const sessions = availability.map((item) => {
      const reservedCount = reservations.filter(
        (reservation) => reservation.sessionId === item.sessionId && activeStatuses.has(reservation.status)
      ).length;

      return {
        formationId: item.formationId,
        formationTitle: item.formationTitle,
        sessionId: item.sessionId,
        sessionLabel: item.sessionLabel,
        startDate: item.startDate,
        endDate: item.endDate,
        capacity: item.capacity,
        isOpen: item.isOpen && !item.isCancelled,
        isCancelled: item.isCancelled,
        reservedCount,
        remaining: item.isCancelled ? 0 : Math.max(item.capacity - reservedCount, 0),
      };
    });

    res.json({ sessions });
  } catch (error) {
    console.error("Erreur admin/availability:", error);
    res.status(500).json({ message: "Impossible de récupérer les disponibilités." });
  }
});

router.put("/availability/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const { capacity, isOpen, isCancelled } = req.body ?? {};

  if (capacity !== undefined && (typeof capacity !== "number" || Number.isNaN(capacity) || capacity < 0)) {
    return res.status(400).json({ message: "La capacité doit être un nombre positif." });
  }

  if (isOpen !== undefined && typeof isOpen !== "boolean") {
    return res.status(400).json({ message: "isOpen doit être un booléen." });
  }

  if (isCancelled !== undefined && typeof isCancelled !== "boolean") {
    return res.status(400).json({ message: "isCancelled doit être un booléen." });
  }

  try {
    const formations = await getFormations();
    const formation = formations.find((form) => form.sessions.some((session) => session.id === sessionId));
    if (!formation) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    const updates: Partial<Pick<SessionAvailability, "capacity" | "isOpen" | "isCancelled">> = {};
    if (capacity !== undefined) {
      updates.capacity = capacity;
    }
    if (isOpen !== undefined) {
      updates.isOpen = isOpen;
    }
    if (isCancelled !== undefined) {
      updates.isCancelled = isCancelled;
      if (isCancelled) {
        updates.isOpen = false;
      }
    }

    const updated = await upsertSessionAvailability(sessionId, updates);

    res.json(updated);
  } catch (error) {
    console.error("Erreur admin/update availability:", error);
    res.status(500).json({ message: "Impossible de mettre à jour la disponibilité." });
  }
});

// Créer une nouvelle session pour une formation
router.post("/sessions", async (req, res) => {
  const { formationId, label, startDate, endDate, id } = req.body ?? {};

  if (!formationId || !label || !startDate || !endDate) {
    return res.status(400).json({ message: "formationId, label, startDate et endDate sont requis." });
  }

  try {
    const session = await addSession(formationId, { id, label, startDate, endDate });
    await upsertSessionAvailability(session.id, {});
    res.json({ session });
  } catch (error) {
    console.error("Erreur admin/sessions:create:", error);
    res.status(500).json({ message: (error as Error).message || "Impossible d'ajouter la session." });
  }
});

router.patch("/reservations/:id", async (req, res) => {
  const { id } = req.params;
  const { sessionId, status } = req.body ?? {};

  if (!sessionId && !status) {
    return res.status(400).json({ message: "Aucune mise à jour demandée." });
  }

  try {
    const reservation = await findReservationById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }

    const updates: ReservationUpdate = {};

    if (sessionId) {
      const formations = await getFormations();
      const formation = formations.find((form) => form.id === reservation.formationId);
      if (!formation) {
        return res.status(404).json({ message: "Formation associée introuvable." });
      }

      const sessionOption = formation.sessions.find((session) => session.id === sessionId);
      if (!sessionOption) {
        return res.status(404).json({ message: "Session introuvable pour cette formation." });
      }

      const availability = await getSessionAvailability(sessionId);
      if (availability.isCancelled) {
        return res
          .status(409)
          .json({ message: "Cette session est annulée : impossible d'y déplacer une réservation." });
      }
      if (!availability.isOpen) {
        return res.status(409).json({ message: "Cette session est fermée aux réservations." });
      }

      const activeCount = await countActiveReservationsBySession(sessionId, reservation.id);
      if (activeCount >= availability.capacity) {
        return res
          .status(409)
          .json({ message: "Cette session est complète. Merci de choisir une autre date." });
      }

      updates.sessionId = sessionId;
      updates.sessionLabel = sessionOption.label;
    }

    if (status) {
      const allowedStatuses: ReservationStatus[] = ["stripe_pending", "stripe_confirmed", "virement_en_attente", "cancelled"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Statut de réservation invalide." });
      }
      updates.status = status;
    }

    const updated = await updateReservationById(id, updates);
    if (updated) {
      try {
        await sendReservationConfirmationEmail({
          reservation: updated as any,
          paymentStatus: updated.status === "stripe_confirmed" ? "confirmed" : "pending",
          reason: "changed",
        });
      } catch (e) {
        console.warn("E-mail de confirmation non envoyé après changement (admin):", e);
      }
    }
    if (!updated) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }

    res.json({ reservation: updated });
  } catch (error) {
    console.error("Erreur admin/reservations:update:", error);
    res.status(500).json({ message: "Impossible de mettre à jour la réservation." });
  }
});

router.get("/reservations", async (_req, res) => {
  try {
    const reservations = await listReservations();
    res.json({
      reservations: reservations.map((reservation: ReservationRecord) => ({
        ...reservation,
      })),
    });
  } catch (error) {
    console.error("Erreur admin/reservations:", error);
    res.status(500).json({ message: "Impossible de lister les réservations." });
  }
});

router.get("/contact", async (_req, res) => {
  try {
    const messages = await listContactMessages();
    res.json({ messages });
  } catch (error) {
    console.error("Erreur admin/contact:", error);
    res.status(500).json({ message: "Impossible de récupérer les messages de contact." });
  }
});

router.patch("/contact/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body ?? {};

  if (!status || !["new", "handled"].includes(status)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const updated = await updateContactMessageStatus(id, status);
    if (!updated) {
      return res.status(404).json({ message: "Message introuvable." });
    }
    res.json(updated);
  } catch (error) {
    console.error("Erreur admin/contact:update:", error);
    res.status(500).json({ message: "Impossible de mettre à jour le message." });
  }
});

router.delete("/contact/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await deleteContactMessage(id);
    if (!deleted) {
      return res.status(404).json({ message: "Message introuvable." });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Erreur admin/contact:delete:", error);
    res.status(500).json({ message: "Impossible de supprimer le message." });
  }
});








router.delete("/reservations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const reservation = await findReservationById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Réservation introuvable." });
    }
    try {
      await sendReservationCancellationEmail(reservation as any);
    } catch (e) {
      console.warn("E-mail d'annulation non envoyé (admin):", e);
    }
    const deleted = await deleteReservationById(id);
    if (!deleted) {
      return res.status(500).json({ message: "Impossible de supprimer la réservation." });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("Erreur admin/reservations:delete:", error);
    return res.status(500).json({ message: "Erreur interne lors de la suppression." });
  }
});
export default router;
