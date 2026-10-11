import type {
  FoundationObjectImportCellV010
} from "../../contracts/foundation-object/import.js";

export function createCounterpartyImportDemoRowsV010(
  count = 1000
): Array<Record<string, FoundationObjectImportCellV010>> {
  if (!Number.isInteger(count) || count < 1 || count > 10000) {
    throw new Error("COUNTERPARTY_DEMO_ROW_COUNT_INVALID");
  }
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const padded = String(number).padStart(6, "0");
    return {
      code: "DEMO-" + padded,
      displayName: "演示往来对象 " + padded,
      subjectType: number % 5 === 0 ? "PERSON" : "ORGANIZATION",
      countryOrRegion: number % 3 === 0 ? "日本" : "中国",
      email: "demo-" + padded + "@example.test",
      channelDepositGrade: number % 3 === 0
        ? "C"
        : number % 2 === 0
          ? "B"
          : "A"
    };
  });
}
