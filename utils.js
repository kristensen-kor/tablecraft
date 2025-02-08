export const sum = xs => xs.reduce((a, b) => a + b, 0);

export const round = (x, y = 0) => Number(x.toFixed(y));
