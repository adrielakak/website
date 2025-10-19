import { Link } from "react-router-dom";

import PhotoCarousel from "../components/PhotoCarousel";
import AnimatedContent from "../components/reactbits/AnimatedContent";

const carouselItems = [
  {
    src: "https://fr.web.img3.acsta.net/img/8d/91/8d9128f0fddeaea82158bce554ba197b.jpg",
    alt: "Nathalie Karsenti",
    legend: "Improvisations collectives pour libÃ©rer l'Ã©coute et la confiance.",
  },
  {
    src: "https://th.bing.com/th/id/R.659eb6631bdd6301f141403c9c1a61a0?rik=ZqbYyl9kKFrhvg&riu=http%3a%2f%2fhdqwalls.com%2fwallpapers%2favengers-infinity-war-new-poster-rh.jpg&ehk=P6ky1CgtTABNI5qVyI6JVjXWiHykgC8ao4Thq%2fKgkZg%3d&risl=&pid=ImgRaw&r=0",
    alt: "Avengers Infinity War",
    legend: "Avengers Infinity War - Marvel Studios",
  },
  {
    src: "https://ds.static.rtbf.be/article/image/1248x702/2/d/2/f7e2b2b75b04175610e5a00c1e221ebb-1402035539.jpg",
    alt: "Gardiens de la Galaxie",
    legend: "Marvel Studios",
  },
];

const experienceHighlights = [
  {
    title: "Voix officielle de Gamora",
    text: "Gamora dans l'univers Marvel (Gardiens de la Galaxie, Avengers), mais aussi Eva Mendes, January Jones, Marisol Nichols, Shawnee Smith et bien d'autres actrices amÃ©ricaines.",
  },
  {
    title: "Professeur au Cours Florent",
    text: "DiplÃ´mÃ©e du Conservatoire de Nantes et du Cours Florent, Nathalie y enseigne depuis plus de 5 ans et transmet une mÃ©thode basÃ©e sur l'exigence bienveillante.",
  },
  {
    title: "CrÃ©atrice et animatrice de l'Ã©mission Il Ã©tait une voix",
    text: "Un rendez-vous dÃ©diÃ© au doublage et aux voix franÃ§aises, qui met en lumiÃ¨re le travail des comÃ©diennes et comÃ©diens de l'ombre.",
  },
];

const paymentInfo = [
  {
    title: "Paiement par carte bancaire",
    text: "StratÃ©gie sÃ©curisÃ©e via Stripe Checkout en mode test (Ã  activer avec votre clÃ© Stripe). Le rÃ¨glement valide immÃ©diatement votre inscription.",
  },
  {
    title: "Paiement par virement bancaire",
    text: "RÃ©ception de l'IBAN dÃ¨s votre rÃ©servation. Merci d'effectuer le virement avant le dÃ©but du stage pour confirmer votre place.",
    detail: "IBAN utilisÃ© par dÃ©faut : FR76 XXXX XXXX XXXX XXXX XXXX X",
  },
  {
    title: "Confirmation et facturation",
    text: "Un e-mail de confirmation est envoyÃ© automatiquement aprÃ¨s le paiement. Les factures peuvent Ãªtre remises Ã  la fin du stage ou envoyÃ©es par e-mail.",
  },
];

function Home() {
  return (
    <div className="bg-brand-midnight text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-lux-gradient opacity-80" />
        <div className="absolute inset-0 -z-10 blur-[120px]">
          <div className="absolute left-1/4 top-10 h-64 w-64 rounded-full bg-brand-primary/40" />
          <div className="absolute bottom-16 right-16 h-72 w-72 rounded-full bg-brand-gold/25" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-4 pb-24 pt-32 sm:px-6 md:flex-row md:items-center md:gap-20 lg:max-w-7xl">
          <AnimatedContent distance={80}>
            <div className="flex-1 space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/60">
                Ateliers Theatre de Nantes
              </p>
              <h4 className="text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
                Sessions week-end de 12H 
                stages intensifs (thÃ©Ã¢tre & doublage) de Nathalie Karsenti
              </h4>
              <p className="max-w-2xl text-base text-white/70">
                Nathalie Karsenti vous accompagne dans le jeu d'acteur, l'improvisation et le doublage. Un cadre exigeant et bienveillant pour explorer votre voix, votre prÃ©sence et votre crÃ©ativitÃ©.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/formations" className="btn-primary">
                  RÃ©servez une formation
                </Link>
                <Link
                  to="/contact"
                  className="btn-secondary gap-2 text-xs uppercase tracking-[0.4em]"
                >
                  Discutons de votre projet
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12 8.25 19.5" />
                  </svg>
                </Link>
              </div>
            </div>
          </AnimatedContent>

          <AnimatedContent distance={120} delay={0.1}>
            <div className="flex-1">
              <div className="card-lux bg-white/[0.04] p-10 text-white">
                <h2 className="text-2xl font-semibold text-white">Stages intensifs ThÃ©Ã¢tre &amp; doublage</h2>
                <p className="mt-4 text-sm text-white/65">
                  Un week-end de 12 heures pour sortir de votre zone de confort, explorer votre voix et dÃ©couvrir l'art du doublage avec une voix franÃ§aise emblÃ©matique du cinÃ©ma.
                </p>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-gold/85">
                    Ce que vous allez travailler
                  </p>
                  <ul className="mt-4 space-y-3 text-sm text-white/70">
                    <li className="flex items-start gap-3">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-brand-gold" />
                      <span>Improvisations guidÃ©es et travail de scÃ¨nes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-brand-gold" />
                      <span>Ecriture de dialogues et interprÃ©tation en duo et en groupe</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-brand-gold" />
                      <span>Respiration ventrale et projection vocale</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-brand-gold" />
                      <span>5 heures de dÃ©couverte du doublage en conditions rÃ©elles</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-brand-gold" />
                      <span>PrÃ©sentation publique le dimanche Ã  15h30</span>
                    </li>
                  </ul>
                </div>
                <p className="mt-6 text-sm text-white/60">
                  Tarif : <span className="font-semibold text-white">285 â‚¬</span> â€¢ Places limitÃ©es â€¢ A partir de 16 ans.
                </p>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:max-w-7xl">
        <div className="grid gap-16 md:grid-cols-2">
          <AnimatedContent distance={100} delay={0.05}>
            <div>
              <h2 className="section-title">A propos des ateliers</h2>
              <p className="section-subtitle text-white/50">
                Notre pÃ©dagogie repose sur la confiance et l'exigence. Chaque atelier rÃ©vÃ¨le votre potentiel scÃ©nique, nourrit l'Ã©coute et dÃ©veloppe votre crÃ©ativitÃ©.
              </p>
              <div className="mt-9 space-y-5 text-white/65">
                <p>
                  L'objectif : oser, se surprendre et transformer la scÃ¨ne en terrain de jeu.
                </p>
                <p>
                  Nathalie Karsenti accompagne toutes celles et ceux qui souhaitent approfondir leur jeu, affirmer leur prÃ©sence scÃ©nique et dÃ©couvrir l'univers du doublage.
                </p>
                <p>
                  Les groupes sont volontairement limitÃ©s pour offrir des retours personnalisÃ©s. Aucun prÃ©requis : les ateliers s'adaptent Ã  votre niveau et vos envies.
                </p>
                <p>
                  Vous dÃ©sirez gagner en confiance, le stage de Nathalie est fait pour vous. Il s'adresse aussi bien aux comÃ©diens, qu'aux chefs d'entreprises, qu'aux professeurs. A toutes celles et ceux qui doivent performer en public.
                </p>
              </div>
            </div>
          </AnimatedContent>

          <div className="space-y-10">
            <AnimatedContent distance={80} direction="horizontal">
              <div className="card-lux bg-white/[0.04] p-8">
                <h3 className="text-xl font-semibold text-white">Un accompagnement sur mesure</h3>
                <p className="mt-3 text-sm text-white/60">
                  Groupes limitÃ©s, retours individualisÃ©s, travail corporel, vocal et scÃ©nique : chaque parcours est pensÃ© pour faire grandir votre confiance.
                </p>
                <ul className="mt-5 space-y-3 text-sm text-white/65">
                  <li>â€¢ Maximum 16 participantÂ·es par session</li>
                  <li>â€¢ Exercices adaptÃ©s Ã  votre progression</li>
                  <li>â€¢ Approche professionnelle du doublage</li>
                  <li>â€¢ Coaching individuel et collectif</li>
                </ul>
              </div>
            </AnimatedContent>
            <AnimatedContent distance={80} direction="horizontal" reverse delay={0.05}>
              <div className="card-lux bg-white/[0.04] p-8">
                <h3 className="text-xl font-semibold text-white">Informations pratiques</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/65">
                  <li>â€¢ 8 rue Mercoeur, 44000 Nantes</li>
                  <li>â€¢ Samedi 13h30-19h30 / Dimanche 10h00-13h00 puis 14h00-17h00</li>
                  <li>â€¢ A partir de 16 ans â€“ aucun niveau requis</li>
                  <li>â€¢ RÃ©servation : nk26fr@gmail.com</li>
                  <li>â€¢ TÃ©lÃ©phone : 06 09 42 59 11</li>
                  <li>â€¢ Paiement : Stripe (carte bancaire) ou virement</li>
                </ul>
              </div>
            </AnimatedContent>
          </div>
        </div>
      </section>

      <section className="bg-[#0d1324]">
        <div className="mx-auto max-w-6xl px-4 py-24 space-y-16 sm:px-6 lg:max-w-7xl">
          <AnimatedContent distance={80}>
            <div>
              <h2 className="section-title text-white">En images</h2>
              <p className="section-subtitle text-white/55">
                Gamora le rÃ´le phare de Nathalie Karsenti, et bien d'autres encore...
              </p>
            </div>
          </AnimatedContent>
          <AnimatedContent distance={60} delay={0.05}>
            <PhotoCarousel items={carouselItems} />
          </AnimatedContent>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:max-w-7xl">
        <AnimatedContent distance={70}>
          <div className="grid gap-10 md:grid-cols-3">
            {experienceHighlights.map((item) => (
              <div key={item.title} className="card-lux bg-white/[0.04] p-8">
                <h3 className="text-lg font-semibold text-brand-gold">{item.title}</h3>
                <p className="mt-4 text-sm text-white/65">{item.text}</p>
              </div>
            ))}
          </div>
        </AnimatedContent>
      </section>

      <section className="bg-[#0d1324]">
        <div className="mx-auto max-w-6xl px-4 py-24 space-y-12 sm:px-6 lg:max-w-7xl">
          <AnimatedContent distance={70}>
            <div>
              <h2 className="section-title text-white">Paiement et rÃ©servation</h2>
              <p className="section-subtitle text-white/55">
                Choisissez votre mode de paiement au moment de la rÃ©servation. Nous proposons Stripe Checkout pour les cartes bancaires et un virement bancaire pour les paiements diffÃ©rÃ©s.
              </p>
            </div>
          </AnimatedContent>
          <AnimatedContent distance={60} delay={0.05}>
            <div className="grid gap-8 md:grid-cols-3">
              {paymentInfo.map((item) => (
                <div key={item.title} className="card-lux bg-white/[0.03] p-8">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm text-white/65">{item.text}</p>
                  {item.detail && <p className="mt-3 text-xs text-white/40">{item.detail}</p>}
                </div>
              ))}
            </div>
          </AnimatedContent>
        </div>
      </section>

      <section className="bg-[#0d1324]">
        <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:max-w-7xl">
          <AnimatedContent distance={80}>
            <div>
              <h2 className="section-title text-white">Nathalie Karsenti en quelques liens</h2>
              <p className="section-subtitle text-white/55">
                DÃ©couvrez son parcours, ses rÃ´les emblÃ©matiques et ses projets.
              </p>
            </div>
          </AnimatedContent>
          <AnimatedContent distance={100} delay={0.05}>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <a
                href="https://share.google/5NlPIOW5M5V6KBDJ5"
                target="_blank"
                rel="noreferrer"
                className="card-lux flex items-center justify-between bg-white/[0.03] px-6 py-6 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                WikipÃ©dia
                <span aria-hidden className="text-lg">â†—</span>
              </a>
              <a
                href="https://share.google/EMmZvm8sN2uEYuvQD"
                target="_blank"
                rel="noreferrer"
                className="card-lux flex items-center justify-between bg-white/[0.03] px-6 py-6 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                AlloCinÃ©
                <span aria-hidden className="text-lg">â†—</span>
              </a>
              <a
                href="https://youtube.com/@nathaliekarsenti?si=QnzpQssPOGZAfZag"
                target="_blank"
                rel="noreferrer"
                className="card-lux flex items-center justify-between bg-white/[0.03] px-6 py-6 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                ChaÃ®ne YouTube
                <span aria-hidden className="text-lg">â†—</span>
              </a>
            </div>
          </AnimatedContent>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:max-w-7xl">
        <AnimatedContent distance={80}>
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 via-brand-primary/30 to-brand-dark/40 px-10 py-14 shadow-glow-soft backdrop-blur">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
              <div className="absolute right-0 bottom-0 h-36 w-36 rounded-full bg-brand-gold/40 blur-3xl" />
            </div>
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Contact rapide</h2>
              <p className="max-w-xl text-sm text-white/70">
                Une question sur le contenu des stages, un besoin spÃ©cifique ou une demande de devis pour un groupe ? Ecrivez-nous ou appelez-nous : nous revenons vers vous sous 48 heures ouvrÃ©es.
              </p>
              <div className="grid gap-6 text-sm md:grid-cols-2">
                <div>
                  <p className="text-white/60">Email</p>
                  <a href="mailto:nk26fr@gmail.com" className="text-lg font-semibold text-white hover:underline">
                    nk26fr@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-white/60">TÃ©lÃ©phone</p>
                  <a href="tel:+33609425911" className="text-lg font-semibold text-white hover:underline">
                    06 09 42 59 11
                  </a>
                </div>
              </div>
            </div>
          </div>
        </AnimatedContent>
      </section>
    </div>
  );
}

export default Home;

