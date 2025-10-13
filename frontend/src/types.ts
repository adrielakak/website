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
