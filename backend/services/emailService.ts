import nodemailer from "nodemailer";

import type { ReservationRecord } from "./reservationStorage.js";

let transporter: nodemailer.Transporter | null = null;

function buildTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || process.env.SMTP_SECURE === "true",
    auth: {
      user,
      pass,
    },
  });
}

function getTransporter(): nodemailer.Transporter | null {
  if (!transporter) {
    transporter = buildTransporter();
  }
  return transporter;
}

export function isEmailEnabled(): boolean {
  return Boolean(getTransporter() && process.env.EMAIL_FROM);
}

interface ConfirmationEmailPayload {
  reservation: ReservationRecord;
  paymentStatus: "pending" | "confirmed";
  checkoutSessionUrl?: string;
}

export async function sendReservationConfirmationEmail({
  reservation,
  paymentStatus,
  checkoutSessionUrl,
}: ConfirmationEmailPayload): Promise<void> {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM;
  if (!mailer || !from) {
    console.warn("Email non envoyé : transporteur SMTP ou adresse expéditeur non configurés.");
    return;
  }

  const adminCopy = process.env.EMAIL_NOTIFICATION_TO;
  const subject =
    paymentStatus === "confirmed"
      ? `Confirmation paiement - ${reservation.formationTitle}`
      : `Réservation en attente - ${reservation.formationTitle}`;

  const statusLabel =
    paymentStatus === "confirmed"
      ? "Nous confirmons la bonne réception de votre paiement via Stripe."
      : "Votre réservation est enregistrée. Le paiement sera confirmé dès validation.";

  const html = `
    <p>Bonjour ${reservation.customerName},</p>
    <p>${statusLabel}</p>
    <p><strong>Stage :</strong> ${reservation.formationTitle}</p>
    <p><strong>Session :</strong> ${reservation.sessionLabel}</p>
    <p><strong>Mode de paiement :</strong> ${reservation.paymentMethod === "stripe" ? "Carte bancaire (Stripe)" : "Virement bancaire"}</p>
    ${
      checkoutSessionUrl
        ? `<p>Vous pouvez accéder au reçu Stripe depuis votre espace client : <a href="${checkoutSessionUrl}">${checkoutSessionUrl}</a></p>`
        : ""
    }
    <p>À très bientôt !</p>
    <p>— Ateliers Théâtre de Nantes</p>
  `;

  const text = [
    `Bonjour ${reservation.customerName},`,
    "",
    statusLabel,
    "",
    `Stage : ${reservation.formationTitle}`,
    `Session : ${reservation.sessionLabel}`,
    `Mode de paiement : ${reservation.paymentMethod === "stripe" ? "Carte bancaire (Stripe)" : "Virement bancaire"}`,
    checkoutSessionUrl ? `Reçu Stripe : ${checkoutSessionUrl}` : "",
    "",
    "À très bientôt !",
    "— Ateliers Théâtre de Nantes",
  ]
    .filter(Boolean)
    .join("\n");

  await mailer.sendMail({
    from,
    to: reservation.customerEmail,
    bcc: adminCopy ?? undefined,
    subject,
    text,
    html,
  });
}
