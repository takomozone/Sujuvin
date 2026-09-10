export type Point = [number, number];
const distance = (a: Point, b: Point) =>
  Math.hypot(
    (b[0] - a[0]) * 111320,
    (b[1] - a[1]) * 111320 * Math.cos(((a[0] + b[0]) * Math.PI) / 360),
  );
const mix = (a: Point, b: Point, t: number): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

// Round only a few metres around each junction, keeping the car on the road.
export function prepareRoute(input: Point[]) {
  const points = input.filter((p, i) => !i || distance(input[i - 1], p) > 0.01);
  const route: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1],
      b = points[i],
      c = points[i + 1];
    const radius = Math.min(8, distance(a, b) * 0.25, distance(b, c) * 0.25);
    const entry = mix(b, a, radius / distance(a, b)),
      exit = mix(b, c, radius / distance(b, c));
    route.push(entry);
    for (let step = 1; step <= 12; step++) {
      const t = step / 12;
      route.push(mix(mix(entry, b, t), mix(b, exit, t), t));
    }
  }
  if (points.length > 1) route.push(points[points.length - 1]);
  const lengths = route.slice(1).map((p, i) => distance(route[i], p));
  const total = lengths.reduce((a, b) => a + b, 0);
  function position(metres: number) {
    let remaining = Math.max(0, Math.min(total, metres)),
      at = 0;
    while (at < lengths.length - 1 && remaining > lengths[at])
      remaining -= lengths[at++];
    return {
      point: lengths.length
        ? mix(
            route[at],
            route[at + 1],
            lengths[at] ? remaining / lengths[at] : 0,
          )
        : route[0],
      at,
    };
  }
  return {
    route,
    sample(progress: number) {
      const metres = Math.max(0, Math.min(1, progress)) * total;
      const { point, at } = position(metres);
      const before = position(metres - 0.5).point,
        after = position(metres + 0.5).point;
      const heading =
        (Math.atan2(
          (after[1] - before[1]) * Math.cos((point[0] * Math.PI) / 180),
          after[0] - before[0],
        ) *
          180) /
        Math.PI;
      return { point, at, heading };
    },
  };
}
export function nearestHeading(previous: number, next: number) {
  return previous + ((((next - previous + 540) % 360) + 360) % 360) - 180;
}
