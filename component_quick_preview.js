// Import utils
import { sum, round } from "./utils.js";

function calc_weighted_counts(data, row_values) {
	data = data.filter(a => a.value.length > 0);
	const total_sum = sum(data.map(a => a.weight));

	if (total_sum == 0) {
		return { total: 0, counts: row_values.map(() => NaN) };
	} else {
		const counts = row_values.map(x => sum(data.filter(a => a.value.includes(x)).map(a => a.weight)));

		return { total: total_sum, counts: counts };
	}
}

function calc_weighted_mean(data) {
	data = data.filter(a => a.value !== null);
	const total_sum = sum(data.map(a => a.weight));

	if (total_sum == 0) {
		return { total: 0, mean: NaN };
	} else {
		const mean = sum(data.map(a => a.value * a.weight)) / total_sum;
		return { total: total_sum, mean: mean };
	}
}

export const component_quick_preview = {
	template: "#qtable-template",
	props: ["variables"],
	inject: ["dataset_ref"],
	computed: {
		dataset() {
			return this.dataset_ref();
		},
		qtable() {
			if (this.variables.length !== 1) return null;

			const var_name = this.variables[0];
			const type = this.dataset.var_type[var_name];
			const vec = this.dataset.data[var_name];
			const weights = this.dataset.weight;

			const data = weights.map((_, i) => ({"value": vec[i], "weight": weights[i]}));

			let qtable = {};
			qtable.name = this.dataset.var_full_label[var_name];
			qtable.type = type;
			qtable.table_type = type == "numeric" ? "mean" : "categorical";

			if (type == "single" || type == "multiple") {
				const row_values = Object.keys(this.dataset.val_labels[var_name]).map(Number);

				const result = calc_weighted_counts(data, row_values, type);

				const rows = row_values.map((code, index) => ({
					code: code,
					label: this.dataset.val_labels[var_name][code],
					percent: round(result.counts[index] / result.total * 100, 1),
					count: round(result.counts[index])
				}));

				qtable.total = round(result.total);
				qtable.data = rows;
			} else if (type == "numeric") {
				const result = calc_weighted_mean(data);

				qtable.total = round(result.total);
				qtable.mean = round(result.mean, 1);
			}

			return qtable;
		}
	}
};
