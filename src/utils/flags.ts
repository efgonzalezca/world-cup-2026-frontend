/**
 * Maps FIFA team codes to ISO 3166-1 alpha-2 country codes
 * Used with the flag-icons CSS library: className={`fi fi-${getCountryCode(teamId)}`}
 * Official FIFA World Cup 2026 — 48 teams
 */
const TEAM_TO_ISO: Record<string, string> = {
  // Group A
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz',
  // Group B
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  // Group C
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct',
  // Group D
  USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  // Group E
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  // Group F
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  // Group G
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
  // Group H
  ESP: 'es', CPV: 'cv', SAU: 'sa', URU: 'uy',
  // Group I
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  // Group J
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  // Group K
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  // Group L
  ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
};

export function getCountryCode(teamId: string | null): string | null {
  if (!teamId) return null;
  return TEAM_TO_ISO[teamId] || null;
}

export function getFlagClass(teamId: string | null, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const code = getCountryCode(teamId);
  if (!code) return '';
  return `fi fis fi-${code}`;
}
