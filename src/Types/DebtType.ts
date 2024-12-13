// Types/DebtTypes.ts
export interface Debt {
  debtID: string;
  clientID: string;
  total: number;
  dateDebt: string;
  lastDatePayee: string;
  status: string;
  avance: number;
  rest: number;
  productIds: string[];
}

export interface CreateDebt {
  clientID: string;
  total: number;
  dateDebt: string;
  lastDatePayee: string;
  status: string;
  avance: number;
  rest: number;
  productIds: string[];
}
