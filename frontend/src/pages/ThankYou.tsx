export default function ThankYou() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-3xl font-bold mb-4">Merci pour votre réservation !</h1>
      <p className="mb-2">Votre paiement a bien été confirmé.</p>
      <p className="text-gray-600">Vous recevrez un email de confirmation avec tous les détails de la séance.</p>
    </div>
  );
}

