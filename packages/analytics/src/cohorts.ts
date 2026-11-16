export type CohortOpportunity = {
  opportunityId: string;
  createdAt: Date;
  sqlAt: Date | null;
  altaAt: Date | null;
  eligible: boolean;
  contactType: "family" | "caregiver_job";
};

export type CohortMetric = {
  cohort: string;
  eligibleCreated: number;
  sql: number;
  matureSql: number;
  altasFromMatureSql: number;
  leadToSql: number | null;
  sqlToAlta: number | null;
  maturityDays: number;
  complete: boolean;
};

const MS_PER_DAY = 86_400_000;

function monthKey(value: Date): string {
  return `${String(value.getUTCFullYear())}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0
    ? null
    : Number((numerator / denominator).toFixed(4));
}

export function calculateMonthlyCohorts(
  opportunities: readonly CohortOpportunity[],
  asOf: Date,
  maturityDays = 90,
): CohortMetric[] {
  if (!Number.isInteger(maturityDays) || maturityDays < 0)
    throw new Error("maturityDays must be a non-negative integer");
  const maturityCutoff = new Date(asOf.getTime() - maturityDays * MS_PER_DAY);
  const cohorts = new Map<string, CohortOpportunity[]>();

  for (const opportunity of opportunities) {
    if (
      !opportunity.eligible ||
      opportunity.contactType !== "family" ||
      opportunity.createdAt > asOf
    )
      continue;
    const key = monthKey(opportunity.createdAt);
    const values = cohorts.get(key) ?? [];
    values.push(opportunity);
    cohorts.set(key, values);
  }

  return [...cohorts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([cohort, rows]) => {
      const sqlRows = rows.filter(
        (row) => row.sqlAt !== null && row.sqlAt <= asOf,
      );
      const matureSqlRows = sqlRows.filter(
        (row) => row.sqlAt !== null && row.sqlAt <= maturityCutoff,
      );
      const altas = matureSqlRows.filter(
        (row) => row.altaAt !== null && row.altaAt <= asOf,
      ).length;
      const cohortEnd = new Date(
        Date.UTC(
          Number(cohort.slice(0, 4)),
          Number(cohort.slice(5, 7)),
          0,
          23,
          59,
          59,
        ),
      );
      return {
        cohort,
        eligibleCreated: rows.length,
        sql: sqlRows.length,
        matureSql: matureSqlRows.length,
        altasFromMatureSql: altas,
        leadToSql: ratio(sqlRows.length, rows.length),
        sqlToAlta: ratio(altas, matureSqlRows.length),
        maturityDays,
        complete: cohortEnd <= maturityCutoff,
      };
    });
}
