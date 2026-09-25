export function anyGreaterThan(requests: Set<number>, floor: number): boolean {
  for (const f of requests) {
    if (f > floor) return true;
  }
  return false;
}

export function anyLessThan(requests: Set<number>, floor: number): boolean {
  for (const f of requests) {
    if (f < floor) return true;
  }
  return false;
}
