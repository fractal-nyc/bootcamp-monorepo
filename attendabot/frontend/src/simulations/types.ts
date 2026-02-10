export interface Entity {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Step {
  from: string;
  to: string;
  label: string;
  description: string;
  payload?: string;
  color?: string;
}

export interface AuthFlow {
  id: string;
  title: string;
  subtitle: string;
  entities: Entity[];
  steps: Step[];
  pros: string[];
  cons: string[];
}
