// Import utils
import { round, calc_weighted_nominal, calc_weighted_mean } from "./utils.js";

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

				const result = calc_weighted_nominal(data, row_values);

				const rows = row_values.map((code, i) => ({
					code: code,
					label: this.dataset.val_labels[var_name][code],
					percent: round(result.percentages[i] * 100, 1),
					count: round(result.counts[i])
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
