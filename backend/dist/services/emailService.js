import nodemailer from "nodemailer";
let transporter = null;
function buildTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !port || !user || !pass) {
        console.warn("Configuration SMTP incomplète : e-mails désactivés.");
        return null;
    }
    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465 || process.env.SMTP_SECURE === "true",
        auth: { user, pass },
    });
}
function getTransporter() {
    if (!transporter) {
        transporter = buildTransporter();
    }
    return transporter;
}
export function isEmailEnabled() {
    return Boolean(getTransporter() && process.env.EMAIL_FROM);
}
export async function sendReservationConfirmationEmail({ reservation, paymentStatus, checkoutSessionUrl, reason = "new", }) {
    const mailer = getTransporter();
    const from = process.env.EMAIL_FROM;
    if (!mailer || !from) {
        console.warn("Email non envoyé : transport SMTP ou expéditeur non configuré.");
        return;
    }
    const adminCopy = process.env.EMAIL_NOTIFICATION_TO;
    const subject = reason === "changed"
        ? `Changement de session enregistré - ${reservation.formationTitle}`
        : paymentStatus === "confirmed"
            ? `Confirmation de paiement - ${reservation.formationTitle}`
            : `Confirmation de réservation - ${reservation.formationTitle}`;
    const statusLabel = reason === "changed"
        ? "Votre changement de session est confirmé."
        : paymentStatus === "confirmed"
            ? "Votre paiement a bien été reçu."
            : "Votre réservation est enregistrée et en attente de validation du paiement.";
    const html = `
    <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
      <p>Bonjour <strong>${reservation.customerName}</strong>,</p>
      <p>${statusLabel}</p>

      <h3>Détails de votre réservation :</h3>
      <ul>
        <li><strong>Stage :</strong> ${reservation.formationTitle}</li>
        <li><strong>Session :</strong> ${reservation.sessionLabel}</li>
        <li><strong>Lieu :</strong> ${reservation.location || "Ateliers Théâtre de Nantes — Centre-ville"}</li>
        <li><strong>ID de réservation :</strong> ${reservation.id}</li>
        <li><strong>Mode de paiement :</strong> ${reservation.paymentMethod === "stripe" ? "Carte bancaire (Stripe)" : "Virement bancaire"}</li>
      </ul>

      ${checkoutSessionUrl
        ? `<p>Reçu Stripe : <a href="${checkoutSessionUrl}" target="_blank" rel="noopener">${checkoutSessionUrl}</a></p>`
        : ""}

      <p>À très bientôt !</p>
      <p style="margin-top: 20px;">— <strong>Les Ateliers Théâtre de Nantes</strong></p>
    </div>
  `;
    const text = `
Bonjour ${reservation.customerName},

${statusLabel}

Stage : ${reservation.formationTitle}
Session : ${reservation.sessionLabel}
Lieu : ${reservation.location || "Ateliers Théâtre de Nantes — Centre-ville"}
ID de réservation : ${reservation.id}
Mode de paiement : ${reservation.paymentMethod === "stripe" ? "Carte bancaire (Stripe)" : "Virement bancaire"}

${checkoutSessionUrl ? `Reçu Stripe : ${checkoutSessionUrl}` : ""}

À très bientôt !
— Les Ateliers Théâtre de Nantes
`;
    await mailer.sendMail({
        from,
        to: reservation.customerEmail,
        bcc: adminCopy ?? undefined,
        subject,
        text,
        html,
    });
    console.log(`Email envoyé à ${reservation.customerEmail}`);
}
