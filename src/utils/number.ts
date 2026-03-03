export function formatNumber(num: number, decimals = 2): string {
    return num.toFixed(decimals);
}

export function formatCurrency(num: number, symbol = '¥'): string {
    return `${symbol}${num.toFixed(2)}`;
}

export function formatPercent(num: number, decimals = 2): string {
    return `${(num * 100).toFixed(decimals)}%`;
}

export function formatPercentValue(num: number, decimals = 2): string {
    return `${num.toFixed(decimals)}%`;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals = 2): number {
    const num = Math.random() * (max - min) + min;
    return parseFloat(num.toFixed(decimals));
}

export function sum(arr: number[]): number {
    return arr.reduce((acc, val) => acc + val, 0);
}

export function average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return sum(arr) / arr.length;
}

export function median(arr: number[]): number {
    if (arr.length === 0) return 0;

    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function standardDeviation(arr: number[]): number {
    if (arr.length === 0) return 0;

    const avg = average(arr);
    const squareDiffs = arr.map((value) => Math.pow(value - avg, 2));
    const avgSquareDiff = average(squareDiffs);

    return Math.sqrt(avgSquareDiff);
}
