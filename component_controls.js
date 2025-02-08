// Import the components
import { component_quick_preview } from "./component_quick_preview.js";
import { component_generic_selector } from "./component_generic_selector.js";

export const component_controls = {
	template: "#controls-template",
	components: {
		"quick_preview": component_quick_preview,
		"component_generic_selector": component_generic_selector
	},
	props: ["var_list", "var_full_label", "var_type"],
	data() {
		return {
			quick_preview_visible: true,
			selectedVariables: [],
			rows: [],
			cols: ["total"],
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
		switch_quick_preview() {
			this.quick_preview_visible = !this.quick_preview_visible;
		},
		clear_variables() {
			this.selectedVariables = [];
		},
		clear_search() {
			this.search_term = "";
		},
		add_row (variable) {
			this.rows = [...new Set([...this.rows, variable])];
		},
		addToRows() {
			this.rows = [...new Set([...this.rows, ...this.selectedVariables])];
		},
		addToColumns() {
			const vars_to_add = this.selectedVariables.filter(a => this.var_type[a] != "numeric");
			this.cols = [...new Set([...this.cols, ...vars_to_add])];
		},
		calc_table() {
			this.$emit("calc-table-event", this.rows, this.cols);
		}
	}
};
