import type { DocumentRow } from "@/lib/queries/documents";

const ID_PATTERNS =
  /\b(id|ine|passport|credential|identification|license|licencia|pasaporte)\b/i;
const INCOME_PATTERNS =
  /\b(income|pay|payroll|stub|recibo|nomina|n[oó]mina|bank|statement|comprobante|salary|sueldo)\b/i;

export const SCREENING_DOC_REQUIREMENTS = [
  {
    key: "id",
    label: "Government ID",
    hint: "INE, passport, or driver's license",
    test: (name: string) => ID_PATTERNS.test(name),
  },
  {
    key: "income",
    label: "Income proof",
    hint: "Pay stub, bank statement, or employment letter",
    test: (name: string) => INCOME_PATTERNS.test(name),
  },
] as const;

export type ScreeningDocStatus = {
  complete: boolean;
  items: {
    key: string;
    label: string;
    hint: string;
    satisfied: boolean;
  }[];
};

export function getScreeningDocumentStatus(
  documents: Pick<DocumentRow, "name">[]
): ScreeningDocStatus {
  const items = SCREENING_DOC_REQUIREMENTS.map((req) => ({
    key: req.key,
    label: req.label,
    hint: req.hint,
    satisfied: documents.some((doc) => req.test(doc.name)),
  }));

  return {
    complete: items.every((item) => item.satisfied),
    items,
  };
}

export function hasRequiredScreeningDocuments(
  documents: Pick<DocumentRow, "name">[]
): boolean {
  return getScreeningDocumentStatus(documents).complete;
}
