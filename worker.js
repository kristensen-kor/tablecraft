// worker.js

import { sum, round, calc_weighted_mean, calc_weighted_percentages, sign_pct_vec, sign_mean } from "./utils.js";

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
			let row = ["", "", "", "mean"].map(x => ({ value: x }));
			col_vars_values.forEach(cv => {
				const res = all_results[row_var][cv.col_var][cv.col_value];
				row.push({ value: res.total == 0 ? "" : round(res.mean, 1).toFixed(1), style: res.total <= 10 ? "bleak" : res.sig ?? "" });
			});
			table.push(row);
		} else {
			Object.keys(dataset.val_labels[row_var]).forEach((code, idx) => {
				let row = ["", code, dataset.val_labels[row_var][code], dataset.var_type[row_var]].map(x => ({ value: x }));
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

