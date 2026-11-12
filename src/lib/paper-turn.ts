// A paper leaf is a connected ribbon of narrow 3D strips. The changing tangent
// bends the sheet while preserving the width of each strip (no scale-to-zero).
export const PAPER_STRIPS = 16;
export const PAPER_TURN_MS = 860;
export function paperGeometry(
  progress: number,
  width: number,
  backwardPortrait = false,
) {
  const clamped = Math.max(0, Math.min(1, progress));
  const eased = clamped * clamped * (3 - 2 * clamped);
  const phase = backwardPortrait ? 1 - eased : eased;
  const baseAngle = Math.PI * phase;
  const curl = Math.sin(Math.PI * phase) * 0.82;
  const stripWidth = width / PAPER_STRIPS;
  let x = 0;
  let z = 0;
  return Array.from({ length: PAPER_STRIPS }, (_, index) => {
    const angle =
      baseAngle + curl * Math.sin((Math.PI * (index + 0.5)) / PAPER_STRIPS);
    const strip = { x, z, angle, width: stripWidth };
    x += Math.cos(angle) * stripWidth;
    z += Math.sin(angle) * stripWidth;
    return strip;
  });
}
