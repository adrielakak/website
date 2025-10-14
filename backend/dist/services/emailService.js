import nodemailer from "nodemailer";

let transporter = null;

/* -----------------------------
   CONFIGURATION DU TRANSPORTEUR
------------------------------ */
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
  if (!transporter) transporter = buildTransporter();
  return transporter;
}

export function isEmailEnabled() {
  return Boolean(getTransporter() && process.env.EMAIL_FROM);
}

/* -----------------------------
   ENVOI D'EMAIL DE CONFIRMATION
------------------------------ */
export async function sendReservationConfirmationEmail({
  reservation,
  paymentStatus,
  checkoutSessionUrl,
}) {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM;

  if (!mailer || !from) {
    console.warn("Email non envoyé : transporteur SMTP ou adresse expéditeur non configurés.");
    return;
  }

  const adminCopy = process.env.EMAIL_NOTIFICATION_TO;

  const subject =
    paymentStatus === "confirmed"
      ? `Confirmation de paiement - ${reservation.formationTitle}`
      : `Confirmation de réservation - ${reservation.formationTitle}`;

  const statusLabel =
    paymentStatus === "confirmed"
      ? "Votre paiement a bien été reçu."
      : "Votre réservation est enregistrée et en attente de validation du paiement.";

  /* -----------------------------
     CONTENU HTML DU MAIL
  ------------------------------ */
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
        <li><strong>Mode de paiement :</strong> ${
          reservation.paymentMethod === "stripe" ? "Carte bancaire (Stripe)" : "Virement bancaire"
        }</li>
      </ul>
      ${
        checkoutSessionUrl
          ? `<p>Vous pouvez accéder à votre reçu Stripe ici : <a href="${checkoutSessionUrl}" target="_blank">${checkoutSessionUrl}</a></p>`
          : ""
      }
      <p>Nous vous enverrons un rappel avant le début du stage.</p>
      <p>À très bientôt !</p>
      <p style="margin-top: 20px;">— <strong>Les Ateliers Théâtre de Nantes</strong></p>
    </div>
  `;

  /* -----------------------------
     VERSION TEXTE SIMPLE
  ------------------------------ */
  const text = [
    `Bonjour ${reservation.customerName},`,
    "",
    statusLabel,
    "",
    `Stage : ${reservation.formationTitle}`,
    `Session : ${reservation.sessionLabel}`,
    `Lieu : ${reservation.location || "Ateliers Théâtre de Nantes — Centre-ville"}`,
    `ID de réservation : ${reservation.id}`,
    `Mode de paiement : ${
      reservation.paymentMethod === "stripe" ? "Carte bancaire (Stripe)" : "Virement bancaire"
    }`,
    checkoutSessionUrl ? `Reçu Stripe : ${checkoutSessionUrl}` : "",
    "",
    "À très bientôt !",
    "— Les Ateliers Théâtre de Nantes",
  ]
    .filter(Boolean)
    .join("\n");

  /* -----------------------------
     ENVOI DU MAIL
  ------------------------------ */
  await mailer.sendMail({
    from,
    to: reservation.customerEmail,
    bcc: adminCopy ?? undefined,
    subject,
    text,
    html,
  });

  console.log(`📩 Email envoyé à ${reservation.customerEmail}`);
}