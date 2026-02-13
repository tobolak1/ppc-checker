import { Finding } from "./runner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkBilling(account: any): Promise<Finding[]> {
  if (!account.credentials) return [];

  // Checks ready for API:
  // bill-low-balance: Kredit < 500 Kc / 20 EUR
  // bill-payment-fail: Posledni platba selhala
  // bill-card-expiring: Karta expiruje do 14 dni
  // bill-no-backup: Jedina platebni metoda
  // bill-budget-depleted: 90%+ budgetu spotrebovano pred 14:00
  // bill-sklik-credit: Sklik kredit pod limit

  return [];
}
