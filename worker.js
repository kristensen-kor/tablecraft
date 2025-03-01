// worker.js

import { round, calc_weighted_mean, calc_weighted_nominal, sign_pct_vec, sign_mean } from "./utils.js";

function prepare_col_vars_values(col_vars, val_labels) {
	let res = [];
	col_vars.forEach(col_var => {
		Object.keys(val_labels[col_var]).map(Number).forEach(col_value => {
			res.push({col_var, col_value})
		});
	});
	return res;
}

self.addEventListener("message", function(e) {
	const { row_vars, col_vars, dataset } = e.data;

	let all_results = {};
	row_vars.forEach(row_var => {
		all_results[row_var] = {};
		col_vars.forEach(col_var => {
			all_results[row_var][col_var] = {};
		});
	});

	let col_vars_values = prepare_col_vars_values(col_vars, dataset.val_labels);

	// precompute indices for each col_var and each col_value.
	let col_indices = Object.fromEntries(col_vars.map(col_var => [col_var, {}]));
	col_vars_values.forEach(({ col_var, col_value }) => {
		col_indices[col_var][col_value] = [];

		dataset.data[col_var].forEach((val, i) => {
			if (val.includes(col_value)) col_indices[col_var][col_value].push(i);
		});
	});

	// precompute row_values.
	const precomputed_row_values = Object.fromEntries(row_vars.filter(row_var => dataset.var_type[row_var] != "numeric").map(row_var => [row_var, Object.keys(dataset.val_labels[row_var]).map(Number)]));

	const total_iterations = row_vars.length * col_vars_values.length;
	let current_iteration = 0;
	let last_progress = 0;

	col_vars_values.forEach(({ col_var, col_value }) => {
		const indices = col_indices[col_var][col_value];

		row_vars.forEach(row_var => {
			const row_vec = dataset.data[row_var];
			const row_type = dataset.var_type[row_var];

			let data = indices.map(i => ({
				value: row_vec[i],
				weight: dataset.weight[i]
			}));

			if (row_type == "numeric") {
				all_results[row_var][col_var][col_value] = calc_weighted_mean(data);
			} else {
				all_results[row_var][col_var][col_value] = calc_weighted_nominal(data, precomputed_row_values[row_var]);
			}

			current_iteration++;
			const progress = Math.floor((current_iteration / total_iterations) * 100);
			if (progress > last_progress) {
				self.postMessage({ type: "tick", progress });
				last_progress = progress;
			}
		});
	});

	// remove empty columns
	col_vars_values = col_vars_values.filter(({ col_var, col_value }) => row_vars.some(row_var => all_results[row_var][col_var][col_value].total > 0));

	// significance
	col_vars_values.forEach(({ col_var, col_value }, i) => {
		if (i == 0) return;

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

	col_vars_values.forEach(({ col_var, col_value }) => {
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
		let sectionHeader = [row_var, "", dataset.var_labels[row_var] ?? row_var, "total"].map(x => ({ value: x, style: "header" }));
		col_vars_values.forEach(({ col_var, col_value }) => {
			const res = all_results[row_var][col_var][col_value];
			const total = res.total;
			sectionHeader.push({ value: round(total), style: total <= 10 ? ["header", "bleak"] : "header" });
		});
		table.push(sectionHeader);

		if (dataset.var_type[row_var] == "numeric") {
			let row = ["", "", "", "mean"].map(x => ({ value: x }));
			col_vars_values.forEach(({ col_var, col_value }) => {
				const res = all_results[row_var][col_var][col_value];
				row.push({ value: res.total == 0 ? "" : round(res.mean, 1).toFixed(1), style: res.total <= 10 ? "bleak" : res.sig ?? "" });
			});
			table.push(row);
		} else {
			Object.keys(dataset.val_labels[row_var]).forEach((code, idx) => {
				let row = ["", code, dataset.val_labels[row_var][code], dataset.var_type[row_var]].map(x => ({ value: x }));
				col_vars_values.forEach(({ col_var, col_value }) => {
					const res = all_results[row_var][col_var][col_value];
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

	self.postMessage({ type: "result", result: { col_header: table_col_header, table } });
});
