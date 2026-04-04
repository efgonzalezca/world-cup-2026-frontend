import type { DiscriminatedPoints } from '../types';

export function calculatePoints(
  predLocal: number,
  predVisitor: number,
  realLocal: number,
  realVisitor: number,
): DiscriminatedPoints & { total: number } {
  let resultPoints = 0;
  let localScorePoints = 0;
  let visitorScorePoints = 0;
  let exactScoreBonus = 0;
  let drawBonus = 0;

  const predResult = Math.sign(predLocal - predVisitor);
  const realResult = Math.sign(realLocal - realVisitor);
  if (predResult === realResult) resultPoints = 2;

  if (predLocal === realLocal) localScorePoints = 1;
  if (predVisitor === realVisitor) visitorScorePoints = 1;

  const isExact = predLocal === realLocal && predVisitor === realVisitor;
  if (isExact) exactScoreBonus = 3;

  // Draw bonus: both predicted and real are draws, but NOT exact score
  const predIsDraw = predLocal === predVisitor;
  const realIsDraw = realLocal === realVisitor;
  if (predIsDraw && realIsDraw && !isExact) drawBonus = 1;

  return {
    resultPoints,
    localScorePoints,
    visitorScorePoints,
    exactScoreBonus,
    drawBonus,
    total: resultPoints + localScorePoints + visitorScorePoints + exactScoreBonus + drawBonus,
  };
}

export const PHASE_LABELS: Record<string, string> = {
  group: 'Fase de Grupos',
  round_of_32: 'Dieciseisavos',
  round_of_16: 'Octavos de Final',
  quarter: 'Cuartos de Final',
  semi: 'Semifinales',
  third_place: 'Tercer Puesto',
  final: 'Final',
};
