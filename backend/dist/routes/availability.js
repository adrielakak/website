import { Router } from "express";
import { getFormations } from "../services/formationsService.js";
import { getAvailabilityList } from "../services/availabilityService.js";
import { readReservations } from "../services/reservationStorage.js";
const router = Router();
router.get("/", async (_req, res) => {
    try {
        const formations = await getFormations();
        const [availability, reservations] = await Promise.all([getAvailabilityList(formations), readReservations()]);
        const activeStatuses = new Set(["stripe_pending", "stripe_confirmed", "virement_en_attente", "virement_confirme"]);
        const sessions = availability.map((item) => {
            const reservedCount = reservations.filter((reservation) => reservation.sessionId === item.sessionId && activeStatuses.has(reservation.status)).length;
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
    }
    catch (error) {
        console.error("Erreur de récupération des disponibilités:", error);
        res.status(500).json({ message: "Impossible de récupérer les disponibilités pour le moment." });
    }
});
export default router;
