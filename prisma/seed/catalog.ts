import { INE_MUNICIPALITIES_2026 } from "./municipalities.js";

export type MunicipalityCatalogEntry = {
  id: string;
  name: string;
  province: string;
  autonomousCommunity: string;
  verifiedIne: boolean;
};

const VERIFIED_MUNICIPALITIES: readonly MunicipalityCatalogEntry[] = INE_MUNICIPALITIES_2026.map(
  ([id, name, province, autonomousCommunity]) => ({
    id,
    name,
    province,
    autonomousCommunity,
    verifiedIne: true,
  }),
);

export function municipalityCatalog(count: number): MunicipalityCatalogEntry[] {
  if (count > VERIFIED_MUNICIPALITIES.length) {
    throw new RangeError(`The local INE catalog supports at most ${VERIFIED_MUNICIPALITIES.length} municipalities`);
  }
  return VERIFIED_MUNICIPALITIES.slice(0, count);
}
