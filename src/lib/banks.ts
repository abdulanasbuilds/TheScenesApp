/** Payout destinations supported by Paystack, grouped for the payout setup UI. */

export type Bank = { code: string; name: string };

export const NG_BANKS: Bank[] = [
  { code: "044", name: "Access Bank" }, { code: "023", name: "Citibank Nigeria" },
  { code: "050", name: "EcoBank Nigeria" }, { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" }, { code: "214", name: "First City Monument Bank (FCMB)" },
  { code: "058", name: "Guaranty Trust Bank (GTB)" }, { code: "030", name: "Heritage Bank" },
  { code: "301", name: "Jaiz Bank" }, { code: "082", name: "Keystone Bank" },
  { code: "526", name: "Moniepoint MFB" }, { code: "627", name: "Kuda MFB" },
  { code: "090", name: "Opay" }, { code: "305", name: "PalmPay" },
  { code: "076", name: "Polaris Bank" }, { code: "039", name: "Stanbic IBTC" },
  { code: "232", name: "Sterling Bank" }, { code: "032", name: "Union Bank" },
  { code: "033", name: "United Bank for Africa (UBA)" }, { code: "215", name: "Unity Bank" },
  { code: "035", name: "Wema Bank" }, { code: "057", name: "Zenith Bank" },
];

export const GH_BANKS: Bank[] = [
  { code: "GCB", name: "GCB Bank" }, { code: "ABSA", name: "Absa Bank Ghana" },
  { code: "CAL", name: "CalBank" }, { code: "ECO", name: "Ecobank Ghana" },
  { code: "FID", name: "Fidelity Bank Ghana" }, { code: "STB", name: "Stanbic Bank Ghana" },
];

export const KE_BANKS: Bank[] = [
  { code: "KCB", name: "KCB Bank Kenya" }, { code: "EQTY", name: "Equity Bank" },
  { code: "COOP", name: "Co-operative Bank" }, { code: "ABSA-KE", name: "Absa Bank Kenya" },
  { code: "NCBA", name: "NCBA Bank" },
];

export const ZA_BANKS: Bank[] = [
  { code: "FNB", name: "First National Bank" }, { code: "ABSA-ZA", name: "Absa" },
  { code: "SBSA", name: "Standard Bank" }, { code: "NED", name: "Nedbank" },
  { code: "CAP", name: "Capitec" },
];

export type Country = {
  code: string;
  name: string;
  currency: string;
  banks: Bank[];
  /** Empty array = mobile money not available in this country. */
  mobileMoney: string[];
};

export const PAYOUT_COUNTRIES: Country[] = [
  { code: "NG", name: "Nigeria",      currency: "NGN", banks: NG_BANKS, mobileMoney: [] },
  { code: "GH", name: "Ghana",        currency: "GHS", banks: GH_BANKS, mobileMoney: ["MTN Mobile Money", "Vodafone Cash", "AirtelTigo Money"] },
  { code: "KE", name: "Kenya",        currency: "KES", banks: KE_BANKS, mobileMoney: ["M-Pesa", "Airtel Money"] },
  { code: "ZA", name: "South Africa", currency: "ZAR", banks: ZA_BANKS, mobileMoney: [] },
];

export function getCountry(code: string): Country {
  return PAYOUT_COUNTRIES.find((c) => c.code === code) ?? PAYOUT_COUNTRIES[0];
}
