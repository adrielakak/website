import { NextFunction, Request, Response, Router } from "express";

import { formations } from "../data/formations.js";
import {
  getAvailabilityList,
  upsertSessionAvailability,
} from "../services/availabilityService.js";
import {
  listReservations,
  readReservations,
  ReservationRecord,
} from "../services/reservationStorage.js";
import { listContactMessages } from "../services/contactStorage.js";

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
        isOpen: item.isOpen,
        reservedCount,
        remaining: Math.max(item.capacity - reservedCount, 0),
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
  const { capacity, isOpen } = req.body ?? {};

  if (capacity !== undefined && (typeof capacity !== "number" || Number.isNaN(capacity) || capacity < 0)) {
    return res.status(400).json({ message: "La capacité doit être un nombre positif." });
  }

  if (isOpen !== undefined && typeof isOpen !== "boolean") {
    return res.status(400).json({ message: "isOpen doit être un booléen." });
  }

  try {
    const formation = formations.find((form) => form.sessions.some((session) => session.id === sessionId));
    if (!formation) {
      return res.status(404).json({ message: "Session introuvable." });
    }

    const updated = await upsertSessionAvailability(sessionId, {
      capacity,
      isOpen,
    });

    res.json(updated);
  } catch (error) {
    console.error("Erreur admin/update availability:", error);
    res.status(500).json({ message: "Impossible de mettre à jour la disponibilité." });
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

export default router;
