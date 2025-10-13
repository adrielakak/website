function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-midnight">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-base font-semibold text-white">Ateliers Théâtre de Nantes</p>
          <p>8 rue Mercoeur, 44000 Nantes</p>
        </div>
        <div className="space-y-2">
          <p className="text-white/50">Contact</p>
          <a href="mailto:nk26fr@gmail.com" className="inline-flex items-center gap-2 text-white hover:text-brand-gold">
            nk26fr@gmail.com
          </a>
          <p className="mt-1 text-white/70">Tél. : 06 52 89 74 10</p>
        </div>
        <div className="text-xs text-white/40">
          © {new Date().getFullYear()} Ateliers Théâtre de Nantes. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
