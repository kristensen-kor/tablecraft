// worker.js

self.addEventListener("message", function(e) {
	const { row_vars, col_vars, dataset } = e.data;

	let total_ticks = 0;
	row_vars.forEach(row_var => {
		col_vars.forEach(col_var => {
			total_ticks += Object.keys(dataset.val_labels[col_var]).length;
		});
	});
	self.postMessage({ type: "start", total_ticks: total_ticks });

	const result = calc_table(row_vars, col_vars, dataset);
	self.postMessage({ type: "result", result });
});

const sum = xs => xs.reduce((a, b) => a + b, 0);
const round = (x, y = 0) => Number(x.toFixed(y));

function sign_pct_vec(n1, p1_array, n2, p2_array, sig = 0.05, min_base = 10) {
	return p1_array.map((p1, i) => {
		const p2 = p2_array[i];
		if (n1 <= min_base || n2 <= min_base || p1 == p2) return "";
		const p = (p1 * n1 + p2 * n2) / (n1 + n2);
		const x = Math.abs(p1 - p2) / Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
		if (x < 1.96) return "";
		return (p2 > p1) ? "p" : "n";
	});
}

function pt(t, df) {
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
		const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
		const ser = 1.000000000190015 + 76.18009172947146 / (x + 1) - 86.50532032941677 / (x + 2) + 24.01409824083091 / (x + 3) - 1.231739572450155 / (x + 4) + 0.001208650973866179 / (x + 5) - 5.395239384953e-6 / (x + 6);
		return Math.log(2.5066282746310005 * ser / x) - tmp;
	}

	function incomplete_beta(x, a, b) {
		let beta = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));

		if (x < (a + 1) / (a + b + 2)) {
			return beta * betacf(x, a, b) / a;
		} else {
			return 1 - beta * betacf(1 - x, b, a) / b;
		}
	}

	const df2 = df / 2;
	const sqrt_term = Math.sqrt(t * t + df);
	return incomplete_beta((t + sqrt_term) / (2 * sqrt_term), df2, df2);
}

function sign_mean(n1, p1, sd1, n2, p2, sd2, sig = 0.05, minBase = 10) {
	if (n1 <= minBase || n2 <= minBase || p1 === p2) return "";
	let s1 = Math.pow(sd1, 2) / n1;
	let s2 = Math.pow(sd2, 2) / n2;
	let df = Math.pow(s1 + s2, 2) / (Math.pow(s1, 2) / (n1 - 1) + Math.pow(s2, 2) / (n2 - 1));
	let t = (p1 - p2) / Math.sqrt(s1 + s2);
	let pvalue = pt(-Math.abs(t), df) * 2;
	if (pvalue > sig) return "";
	return p2 > p1 ? "p" : "n";
}

function calc_weighted_mean(data) {
	data = data.filter(a => a.value !== null);
	const total = sum(data.map(a => a.weight));

	if (total == 0) {
		return { total: 0, mean: NaN, sd: NaN };
	} else {
		const mean = sum(data.map(a => a.value * a.weight)) / total;
		const sd = Math.sqrt(sum(data.map(a => a.weight * Math.pow(a.value - mean, 2))) / (total - 1));
		return { total, mean, sd };
	}
}

function calc_weighted_percentages(data, row_values) {
	data = data.filter(a => a.value.length > 0);
	const total = sum(data.map(a => a.weight));

	if (total == 0) {
		return { total: 0, percentages: row_values.map(() => NaN) };
	} else {
		const percentages = row_values.map(x => sum(data.filter(a => a.value.includes(x)).map(a => a.weight)) / total);

		return { total, percentages };
	}
}

function calc_table(row_vars, col_vars, dataset) {
	let all_results = {};
	row_vars.forEach(row_var => {
		all_results[row_var] = {};
		col_vars.forEach(col_var => {
			all_results[row_var][col_var] = {};
		});
	});

	let col_vars_values = [];
	col_vars.forEach(col_var => {
		Object.keys(dataset.val_labels[col_var]).map(Number).forEach(col_value => {
			col_vars_values.push({col_var, col_value})
		});
	});


	col_vars_values.forEach(cv => {
		const { col_var, col_value } = cv;
		const col_vec = dataset.data[col_var];

		row_vars.forEach(row_var => {
			const row_vec = dataset.data[row_var];
			const row_type = dataset.var_type[row_var];

			let data = dataset.weight.map((_, i) => ({
				value: row_vec[i],
				col_filter: col_vec[i],
				weight: dataset.weight[i]
			}));

			data = data.filter(a => a.col_filter.includes(col_value));

			if (row_type == "numeric") {
				all_results[row_var][col_var][col_value] = calc_weighted_mean(data);
			} else {
				const row_values = Object.keys(dataset.val_labels[row_var]).map(Number);
				all_results[row_var][col_var][col_value] = calc_weighted_percentages(data, row_values);
			}

			self.postMessage({ type: "tick" });
		});
	});


	col_vars_values = col_vars_values.filter(cv => {
		const { col_var, col_value } = cv;
		const all_zero = row_vars.every(row_var => all_results[row_var][col_var][col_value].total == 0);
		if (all_zero) {
			row_vars.forEach(row_var => {
				delete all_results[row_var][col_var][col_value];
			});
		}
		return !all_zero;
	});


	col_vars_values.forEach((cv, i) => {
		if (i == 0) return;

		const { col_var, col_value } = cv;
		row_vars.forEach(row_var => {
			const x1 = all_results[row_var][col_vars_values[0].col_var][col_vars_values[0].col_value];
			const x2 = all_results[row_var][col_var][col_value];

			if (dataset.var_type[row_var] != "numeric") {
				all_results[row_var][col_var][col_value].sigs = sign_pct_vec(x1.total, x1.percentages, x2.total, x2.percentages);
			} else {
				all_results[row_var][col_var][col_value].sig = sign_mean(x1.total, x1.mean, x1.sd, x2.total, x2.mean, x2.sd);
			}

		});
	});


	let globalHeader1 = ["", "", "", ""];
	let globalHeader2 = ["", "", "", ""];
	let globalHeader3 = ["", "", "", ""];

	col_vars_values.forEach(cv => {
		const { col_var, col_value } = cv;
		globalHeader1.push(col_var);
		globalHeader2.push(dataset.var_labels[col_var] ?? col_var);
		globalHeader3.push(dataset.val_labels[col_var][col_value]);
	});

	let table_col_header = [globalHeader1, globalHeader2, globalHeader3];

	for (let i = table_col_header[0].length; i > 4; i--) {
		if (table_col_header[0][i] == table_col_header[0][i - 1]) {
			table_col_header[0][i] = "";
			table_col_header[1][i] = "";
		}
	}


	const wrap = x => ({ value: x });

	let table = [];

	row_vars.forEach(row_var => {
		const row_type = dataset.var_type[row_var];

		let sectionHeader = [row_var, "", dataset.var_labels[row_var] ?? row_var, "total"].map(x => ({ value: x, style: "header" }));
		col_vars_values.forEach(cv => {
			const res = all_results[row_var][cv.col_var][cv.col_value];
			const total = res.total;
			sectionHeader.push({ value: round(total), style: total <= 10 ? ["header", "bleak"] : "header" });
		});
		table.push(sectionHeader);

		if (row_type == "numeric") {
			let row = ["", "", "", "mean"].map(wrap);
			col_vars_values.forEach(cv => {
				const res = all_results[row_var][cv.col_var][cv.col_value];
				row.push({ value: res.total == 0 ? "" : round(res.mean, 1).toFixed(1), style: res.total <= 10 ? "bleak" : res.sig ?? "" });
			});
			table.push(row);
		} else {
			Object.keys(dataset.val_labels[row_var]).forEach((code, idx) => {
				let row = ["", code, dataset.val_labels[row_var][code], dataset.var_type[row_var]].map(wrap);
				col_vars_values.forEach(cv => {
					const res = all_results[row_var][cv.col_var][cv.col_value];
					if (res.total == 0) {
						row.push({ value: "" });
					} else {
						row.push({ value: round(res.percentages[idx] * 100, 1).toFixed(1), style: res.total <= 10 ? "bleak" : res.sigs?.[idx] ?? "" });
					}
				});
				table.push(row);
			});
		}
	});

	return { col_header: table_col_header, table };
}

