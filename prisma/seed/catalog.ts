export type MunicipalityCatalogEntry = {
  id: string;
  name: string;
  province: string;
  autonomousCommunity: string;
  verifiedIne: boolean;
};

const VERIFIED_MUNICIPALITIES: readonly MunicipalityCatalogEntry[] = [
  { id: "28079", name: "Madrid", province: "Madrid", autonomousCommunity: "Comunidad de Madrid", verifiedIne: true },
  { id: "08019", name: "Barcelona", province: "Barcelona", autonomousCommunity: "Cataluña", verifiedIne: true },
  { id: "46250", name: "València", province: "Valencia", autonomousCommunity: "Comunitat Valenciana", verifiedIne: true },
  { id: "41091", name: "Sevilla", province: "Sevilla", autonomousCommunity: "Andalucía", verifiedIne: true },
  { id: "50297", name: "Zaragoza", province: "Zaragoza", autonomousCommunity: "Aragón", verifiedIne: true },
  { id: "29067", name: "Málaga", province: "Málaga", autonomousCommunity: "Andalucía", verifiedIne: true },
  { id: "30030", name: "Murcia", province: "Murcia", autonomousCommunity: "Región de Murcia", verifiedIne: true },
  { id: "07040", name: "Palma", province: "Illes Balears", autonomousCommunity: "Illes Balears", verifiedIne: true },
  { id: "35016", name: "Las Palmas de Gran Canaria", province: "Las Palmas", autonomousCommunity: "Canarias", verifiedIne: true },
  { id: "48020", name: "Bilbao", province: "Bizkaia", autonomousCommunity: "País Vasco", verifiedIne: true },
  { id: "03014", name: "Alicante", province: "Alicante", autonomousCommunity: "Comunitat Valenciana", verifiedIne: true },
  { id: "14021", name: "Córdoba", province: "Córdoba", autonomousCommunity: "Andalucía", verifiedIne: true },
  { id: "47186", name: "Valladolid", province: "Valladolid", autonomousCommunity: "Castilla y León", verifiedIne: true },
  { id: "36057", name: "Vigo", province: "Pontevedra", autonomousCommunity: "Galicia", verifiedIne: true },
  { id: "33024", name: "Gijón", province: "Asturias", autonomousCommunity: "Principado de Asturias", verifiedIne: true },
  { id: "08101", name: "L'Hospitalet de Llobregat", province: "Barcelona", autonomousCommunity: "Cataluña", verifiedIne: true },
  { id: "01059", name: "Vitoria-Gasteiz", province: "Araba", autonomousCommunity: "País Vasco", verifiedIne: true },
  { id: "15030", name: "A Coruña", province: "A Coruña", autonomousCommunity: "Galicia", verifiedIne: true },
  { id: "18087", name: "Granada", province: "Granada", autonomousCommunity: "Andalucía", verifiedIne: true },
  { id: "31201", name: "Pamplona/Iruña", province: "Navarra", autonomousCommunity: "Comunidad Foral de Navarra", verifiedIne: true },
];

const SYNTHETIC_PROVINCES = [
  ["Provincia Sintética Norte", "Región Sintética Norte"],
  ["Provincia Sintética Centro", "Región Sintética Centro"],
  ["Provincia Sintética Este", "Región Sintética Este"],
  ["Provincia Sintética Sur", "Región Sintética Sur"],
] as const;

export function municipalityCatalog(count: number): MunicipalityCatalogEntry[] {
  if (count <= VERIFIED_MUNICIPALITIES.length) return VERIFIED_MUNICIPALITIES.slice(0, count);
  const result = [...VERIFIED_MUNICIPALITIES];
  for (let index = VERIFIED_MUNICIPALITIES.length; index < count; index += 1) {
    const province = SYNTHETIC_PROVINCES[index % SYNTHETIC_PROVINCES.length] as readonly [string, string];
    result.push({
      id: `SYN-${String(index - VERIFIED_MUNICIPALITIES.length + 1).padStart(4, "0")}`,
      name: `Municipio Sintético ${String(index - VERIFIED_MUNICIPALITIES.length + 1).padStart(3, "0")}`,
      province: province[0],
      autonomousCommunity: province[1],
      verifiedIne: false,
    });
  }
  return result;
}
