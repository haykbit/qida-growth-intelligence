export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 0x9e3779b9;
  }

  next(): number {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    return this.state / 4_294_967_296;
  }

  integer(min: number, maxInclusive: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(maxInclusive) || maxInclusive < min) throw new Error("Invalid integer range");
    return min + Math.floor(this.next() * (maxInclusive - min + 1));
  }

  boolean(probability: number): boolean {
    return this.next() < Math.min(1, Math.max(0, probability));
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) throw new Error("Cannot pick from an empty collection");
    return values[this.integer(0, values.length - 1)] as T;
  }
}
