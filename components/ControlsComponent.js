// ControlsComponent.js

import { fetch_template, load_CSS } from "../utils.js";

import QuickPreview from "./QuickPreview.js";
import GenericSelector from "./GenericSelector.js";
import FilterComponent from "./FilterComponent.js";

load_CSS("./components/ControlsComponent.css");

export default {
	template: await fetch_template("./components/ControlsComponent.html"),
	components: {
		QuickPreview,
		GenericSelector,
		FilterComponent
	},
	props: ["var_list", "var_full_label", "var_type"],
	data() {
		return {
			selected_variables: [],
			rows: [],
			cols: [],
			filter_mask: [],
			search_term: "",
			selectedRows: [],
			selectedCols: []
		};
	},
	computed: {
		filtered_var_list() {
			if (!this.search_term) return this.var_list;

			const term = this.search_term.toLowerCase();
			return this.var_list.filter(variable => this.var_full_label[variable].toLowerCase().includes(term));
		}
	},
	methods: {
		clear_variables() {
			this.selected_variables = [];
		},
		clear_search() {
			this.search_term = "";
		},
		add_row(variable) {
			this.$refs.rows_selector.add_items([variable]);
		},
		add_to_rows() {
			this.$refs.rows_selector.add_items(this.selected_variables);
		},
		add_to_columns() {
			this.$refs.cols_selector.add_items(this.selected_variables.filter(a => this.var_type[a] != "numeric"));
		},
		calc_table() {
			this.$emit("calc-table-event", this.rows, this.cols, this.filter_mask);
		}
	}
};
