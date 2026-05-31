/** Minimum monthly income as a multiple of monthly rent (e.g. 3 = 3× rent). */
export const INCOME_RENT_RATIO_MIN = 3;

export type IncomeScreeningResult = {
  meetsRequirement: boolean;
  ratio: number | null;
  message: string;
};

export function evaluateIncomeVsRent(
  incomeCents: number | null | undefined,
  monthlyRentCents: number
): IncomeScreeningResult {
  if (!incomeCents || incomeCents <= 0) {
    return {
      meetsRequirement: false,
      ratio: null,
      message: "Income not provided",
    };
  }

  if (monthlyRentCents <= 0) {
    return {
      meetsRequirement: true,
      ratio: null,
      message: "Rent not set",
    };
  }

  const ratio = incomeCents / monthlyRentCents;
  const meetsRequirement = ratio >= INCOME_RENT_RATIO_MIN;

  return {
    meetsRequirement,
    ratio,
    message: meetsRequirement
      ? `Income is ${ratio.toFixed(1)}× rent (meets ${INCOME_RENT_RATIO_MIN}× rule)`
      : `Income is ${ratio.toFixed(1)}× rent (below ${INCOME_RENT_RATIO_MIN}× rule)`,
  };
}
