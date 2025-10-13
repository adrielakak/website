import express, { Router } from "express";
import Stripe from "stripe";
import { sendReservationConfirmationEmail } from "../services/emailService.js";
import { updateReservationByStripeSession } from "../services/reservationStorage.js";
const router = Router();
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecretKey || !webhookSecret) {
        console.warn("Webhook Stripe reçu mais STRIPE_WEBHOOK_SECRET n'est pas configuré.");
        return res.status(200).json({ received: true });
    }
    const stripe = new Stripe(stripeSecretKey);
    const signature = req.headers["stripe-signature"];
    if (!signature) {
        return res.status(400).send("Signature Stripe absente.");
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (error) {
        console.error("Webhook Stripe invalide:", error);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }
    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const checkoutSession = event.data.object;
                const reservation = await updateReservationByStripeSession(checkoutSession.id, {
                    status: "stripe_confirmed",
                });
                if (reservation) {
                    await sendReservationConfirmationEmail({
                        reservation,
                        paymentStatus: "confirmed",
                    });
                }
                break;
            }
            case "checkout.session.expired": {
                const checkoutSession = event.data.object;
                await updateReservationByStripeSession(checkoutSession.id, {
                    status: "cancelled",
                });
                break;
            }
            default:
                break;
        }
    }
    catch (error) {
        console.error("Erreur lors du traitement du webhook Stripe:", error);
        return res.status(500).json({ message: "Erreur interne lors du traitement du webhook." });
    }
    return res.json({ received: true });
});
export default router;
