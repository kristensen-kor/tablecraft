// QuickPreview.js

import { fetch_template, load_CSS, round, calc_weighted_nominal, calc_weighted_mean } from "../utils.js";

load_CSS("./components/QuickPreview.css");

export default {
	template: await fetch_template("./components/QuickPreview.html"),
	props: ["variables", "filter_mask"],
	inject: ["dataset_ref"],
	data() {
		return {
			closed: false
		};
	},
	computed: {
		dataset() {
			return this.dataset_ref();
		},
		qtable() {
			if (this.closed) return null;
			if (this.variables.length !== 1) return null;

			const var_name = this.variables[0];
			const type = this.dataset.var_type[var_name];
			const vec = this.dataset.data[var_name];
			const weights = this.dataset.weight;

			const data = [];
			for (let i = 0; i < weights.length; i++) {
				if (this.filter_mask[i]) data.push({value: vec[i], weight: weights[i]});
			}

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
					percent:  result.total == 0 ? "-" : (result.counts[i] == 0 ? 0 : (result.percentages[i] * 100).toFixed(1)),
					count: round(result.counts[i])
				}));

				qtable.total = round(result.total);
				qtable.data = rows;
			} else if (type == "numeric") {
				const result = calc_weighted_mean(data);

				qtable.total = round(result.total);
				qtable.mean = result.total == 0 ? "-" : round(result.mean, 1);
			}

			return qtable;
		}
	},
	methods: {
		copy() {
			if (!this.qtable) return;

			let text;

			if (this.qtable.table_type == "categorical") {
				let lines = [];
				lines.push(["", this.qtable.type, "%", "Count"].join("\t"));
				lines.push(["", "Total", "", this.qtable.total].join("\t"));

				for (const row of this.qtable.data) {
					lines.push([row.code, row.label, row.percent, row.count].join("\t"));
				}

				text = lines.join("\n");
			}

			if (this.qtable.table_type == "mean") {
				text = [
					["total", "mean"].join("\t"),
					[this.qtable.total, this.qtable.mean].join("\t")
				].join("\n");
			}

			text = this.qtable.name + "\n" + text;

			navigator.clipboard.writeText(text);
		}
	}
};
