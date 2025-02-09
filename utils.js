export const sum = xs => xs.reduce((a, b) => a + b, 0);

export const round = (x, y = 0) => Number(x.toFixed(y));

function betacf(x, a, b) {
	const fpmin = 1e-30;
	const qab = a + b;
	const qap = a + 1;
	const qam = a - 1;
	let c = 1;
	let d = Math.max(1 - qab * x / qap, fpmin);
	let h = 1 / d;

	for (let m = 1; m <= 100; m++) {
		const m2 = 2 * m;
		const num_term1 = m * (b - m) * x / ((qam + m2) * (a + m2));
		d = Math.max(1 + num_term1 / d, fpmin);
		c = Math.max(1 + num_term1 / c, fpmin);
		h *= c / d;
		const num_term2 = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
		d = Math.max(1 + num_term2 / d, fpmin);
		c = Math.max(1 + num_term2 / c, fpmin);
		const delta = c / d;
		h *= delta;
		if (Math.abs(delta - 1.0) < 3e-7) break;
	}

	return h;
}

function lgamma(x) {
	const ser = 1.000000000190015 + 76.18009172947146 / (x + 1) - 86.50532032941677 / (x + 2) + 24.01409824083091 / (x + 3) - 1.231739572450155 / (x + 4) + 0.001208650973866179 / (x + 5) - 5.395239384953e-6 / (x + 6);
	return Math.log(2.5066282746310005 * ser / x) - (x + 5.5 - (x + 0.5) * Math.log(x + 5.5));
}

function incomplete_beta(x, a, b) {
	const beta = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));

	if (x < (a + 1) / (a + b + 2)) {
		return beta * betacf(x, a, b) / a;
	} else {
		return 1 - beta * betacf(1 - x, b, a) / b;
	}
}

function pt(t, df) {
	const df2 = df / 2;
	const sqrt_term = Math.sqrt(t * t + df);
	return incomplete_beta((t + sqrt_term) / (2 * sqrt_term), df2, df2);
}

export const sign_pct_vec = (n1, p1_array, n2, p2_array, sig = 0.05, min_base = 10) => {
	return p1_array.map((p1, i) => {
		const p2 = p2_array[i];
		if (n1 <= min_base || n2 <= min_base || p1 == p2) return "";
		const p = (p1 * n1 + p2 * n2) / (n1 + n2);
		const x = Math.abs(p1 - p2) / Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
		if (x < 1.96) return ""; // only sig = 0.05 supported for now
		return (p2 > p1) ? "p" : "n";
	});
};

export const sign_mean = (n1, p1, sd1, n2, p2, sd2, sig = 0.05, minBase = 10) => {
	if (n1 <= minBase || n2 <= minBase || p1 === p2) return "";
	let s1 = Math.pow(sd1, 2) / n1;
	let s2 = Math.pow(sd2, 2) / n2;
	let df = Math.pow(s1 + s2, 2) / (Math.pow(s1, 2) / (n1 - 1) + Math.pow(s2, 2) / (n2 - 1));
	let t = (p1 - p2) / Math.sqrt(s1 + s2);
	let pvalue = pt(-Math.abs(t), df) * 2;
	if (pvalue > sig) return "";
	return p2 > p1 ? "p" : "n";
};

export const calc_weighted_nominal = (data, row_values) => {
	data = data.filter(a => a.value.length > 0);
	const total = sum(data.map(a => a.weight));

	if (total == 0) {
		const nan_vec = row_values.map(() => NaN);
		return { total: 0, counts: nan_vec, percentages: nan_vec };
	} else {
		const counts = row_values.map(x => sum(data.filter(a => a.value.includes(x)).map(a => a.weight)));
		const percentages = counts.map(x => x / total);

		return { total, counts, percentages };
	}
};

export const calc_weighted_mean = (data) => {
	data = data.filter(a => a.value !== null);
	const total = sum(data.map(a => a.weight));

	if (total == 0) {
		return { total: 0, mean: NaN, sd: NaN };
	} else {
		const mean = sum(data.map(a => a.value * a.weight)) / total;
		const sd = Math.sqrt(sum(data.map(a => a.weight * Math.pow(a.value - mean, 2))) / (total - 1));
		return { total, mean, sd };
	}
};
