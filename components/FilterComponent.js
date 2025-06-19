// FilterComponent.js

import { load_CSS, sum, round } from "../utils.js";
import { evaluate_filter } from "./filter_engine.js";

load_CSS("./components/FilterComponent.css");

export default {
	template: "#filter-selector-template",
	inject: ["dataset_ref"],
	data() {
		return {
			closed: true,
			filter_string: "",
			mask: [],
			applied_filter: "",
			is_filter_active: false,
			is_error: false,
			error_message: ""
		};
	},
	computed: {
		dataset() {
			return this.dataset_ref();
		},
		n() {
			return round(sum(this.dataset.weight.filter((_, i) => this.mask[i])));
		}
	},
	methods: {
		reset() {
			this.is_error = false;
			this.is_filter_active = false;
			this.filter_string = "";
			this.applied_filter = "";
			this.mask = Array(this.dataset.weight.length).fill(true);
		},
		cancel() {
			this.is_error = false;
			this.filter_string = this.applied_filter;
		},
		apply() {
			this.is_error = false;

			if (this.filter_string.length == 0) {
				this.reset();
			} else {
				try {
					this.mask = evaluate_filter(this.filter_string, this.dataset);
					this.is_filter_active = true;
					this.applied_filter = this.filter_string;
				} catch (error) {
					this.is_error = true;
					this.error_message = error.message;
				}
			}
		}
	},
	watch: {
		mask: {
			handler: function(value) {
				this.$emit("update:mask", value);
			},
			immediate: true
		}
	},
	mounted() {
		this.reset();
	}
};
