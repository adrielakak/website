export interface SessionOption {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface Formation {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  location: string;
  teacher: string;
  objectives: string[];
  sessions: SessionOption[];
}

export const formations: Formation[] = [
  {
    id: "stage-theatre-doublage",
    title: "Stage intensif Théâtre & Initiation doublage",
    description:
      "Un week-end de 12 heures pour explorer le jeu d'acteur, travailler la voix et découvrir les coulisses du doublage avec Nathalie Karsenti.",
    duration: "12 h (week-end)",
    price: 285,
    location: "8 rue Mercoeur, 44000 Nantes",
    teacher: "Nathalie Karsenti",
    objectives: [
      "Improvisations guidées et travail de l'écoute",
      "Jeu de scène et écriture de séquences originales",
      "Travail du corps et de la voix",
      "Initiation à la respiration ventrale",
      "Découverte du doublage (4 h) en conditions réelles",
      "Présentation publique des scènes le dimanche",
    ],
    sessions: [
      {
        id: "stage-2025-01-24",
        label: "Session week-end : 24 & 25 janvier 2025",
        startDate: "2025-01-24",
        endDate: "2025-01-25",
      },
      {
        id: "stage-2025-02-07",
        label: "Session week-end : 7 & 8 février 2025",
        startDate: "2025-02-07",
        endDate: "2025-02-08",
      },
      {
        id: "stage-2025-03-14",
        label: "Session week-end : 14 & 15 mars 2025",
        startDate: "2025-03-14",
        endDate: "2025-03-15",
      },
      {
        id: "stage-2025-03-28",
        label: "Session week-end : 28 & 29 mars 2025",
        startDate: "2025-03-28",
        endDate: "2025-03-29",
      },
      {
        id: "stage-2025-06-06",
        label: "Session week-end : 6 & 7 juin 2025",
        startDate: "2025-06-06",
        endDate: "2025-06-07",
      },
      {
        id: "stage-2025-06-27",
        label: "Session week-end : 27 & 28 juin 2025",
        startDate: "2025-06-27",
        endDate: "2025-06-28",
      },
      {
        id: "stage-2025-07-18",
        label: "Session week-end : 18 & 19 juillet 2025",
        startDate: "2025-07-18",
        endDate: "2025-07-19",
      },
      {
        id: "stage-2025-08-08",
        label: "Session week-end : 8 & 9 août 2025",
        startDate: "2025-08-08",
        endDate: "2025-08-09",
      },
    ],
  },
];
