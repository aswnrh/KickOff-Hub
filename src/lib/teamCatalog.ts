export interface CatalogTeam {
  code: string;
  name: string;
  icon: string;
}

const crest = (id: number) => `https://crests.football-data.org/${id}.png`;

export const TEAM_CATALOG: CatalogTeam[] = [
  { code: "ARS", name: "Arsenal", icon: crest(57) },
  { code: "AVL", name: "Aston Villa", icon: crest(58) },
  { code: "CHE", name: "Chelsea", icon: crest(61) },
  { code: "EVE", name: "Everton", icon: crest(62) },
  { code: "LIV", name: "Liverpool", icon: crest(64) },
  { code: "MCI", name: "Manchester City", icon: crest(65) },
  { code: "MUN", name: "Manchester United", icon: crest(66) },
  { code: "NEW", name: "Newcastle United", icon: crest(67) },
  { code: "TOT", name: "Tottenham Hotspur", icon: crest(73) },
  { code: "WOL", name: "Wolverhampton Wanderers", icon: crest(76) },
  { code: "ATM", name: "Atletico Madrid", icon: crest(78) },
  { code: "BAR", name: "Barcelona", icon: crest(81) },
  { code: "RMA", name: "Real Madrid", icon: crest(86) },
  { code: "RSO", name: "Real Sociedad", icon: crest(92) },
  { code: "VIL", name: "Villarreal", icon: crest(94) },
  { code: "VAL", name: "Valencia", icon: crest(95) },
  { code: "MIL", name: "AC Milan", icon: crest(98) },
  { code: "ROM", name: "AS Roma", icon: crest(100) },
  { code: "INT", name: "Inter Milan", icon: crest(108) },
  { code: "JUV", name: "Juventus", icon: crest(109) },
  { code: "LAZ", name: "Lazio", icon: crest(110) },
  { code: "NAP", name: "Napoli", icon: crest(113) },
  { code: "B04", name: "Bayer Leverkusen", icon: crest(3) },
  { code: "BVB", name: "Borussia Dortmund", icon: crest(4) },
  { code: "BAY", name: "Bayern Munich", icon: crest(5) },
  { code: "STU", name: "VfB Stuttgart", icon: crest(10) },
  { code: "BMG", name: "Borussia Monchengladbach", icon: crest(18) },
  { code: "SGE", name: "Eintracht Frankfurt", icon: crest(19) },
  { code: "PSG", name: "Paris Saint-Germain", icon: crest(524) },
  { code: "MAR", name: "Marseille", icon: crest(516) },
  { code: "LYO", name: "Lyon", icon: crest(523) },
  { code: "NIC", name: "Nice", icon: crest(522) },
  { code: "SCP", name: "Sporting CP", icon: crest(498) },
  { code: "POR", name: "FC Porto", icon: crest(503) },
  { code: "BEN", name: "Benfica", icon: crest(1903) },
  { code: "AJX", name: "Ajax", icon: crest(678) },
  { code: "PSV", name: "PSV Eindhoven", icon: crest(674) },
  { code: "FEY", name: "Feyenoord", icon: crest(675) },
  { code: "GAL", name: "Galatasaray", icon: crest(610) },
  { code: "FEN", name: "Fenerbahce", icon: crest(611) },
  { code: "BES", name: "Besiktas", icon: crest(613) },
];

export function getCatalogTeamByName(name: string) {
  return TEAM_CATALOG.find((team) => team.name === name);
}
