// FilterComponent.js

import { sum } from "../utils.js";
import { evaluate_filter } from "./filter_engine.js";

// scoped styles
const styles = {
	dummy: { visibility: "hidden" },
	flexCol: { flex: 1 }
}

export default {
	template: `
		<flex-row gap="0.5rem">
			<button class="dummy" :style="styles.dummy">></button>
			<flex-col gap="0.5rem" :style="styles.flexCol">
				<h3>Filter</h3>
				<input type="text" :class="{ filter_changed: applied_filter != filter_string }" v-model="filter_string" @keydown.enter="apply" placeholder="Enter condition here...">
				<flex-col gap="0.5rem">
					<flex-row gap="0.25rem" justify="space-between">
						<flex-row gap="0.25rem">
							<button @click="apply">Apply</button>
							<button @click="reset">Reset</button>
							<button @click="cancel" v-show="applied_filter != filter_string">Cancel</button>
						</flex-row>
						<span :class="{ filter_active: is_filter_active }">N = {{ n }}</span>
					</flex-row>
					<span :class="{ error: is_error }" v-show="is_error">{{ error_message }}</span>
				</flex-col>
			</flex-col>
		</flex-row>
	`,
	inject: ["dataset_ref"],
	data() {
		return {
			filter_string: "",
			mask: [],
			applied_filter: "",
			is_filter_active: false,
			is_error: false,
			error_message: "",
			styles
		};
	},
	computed: {
		dataset() {
			return this.dataset_ref();
		},
		n() {
			return sum(this.dataset.weight.filter((_, i) => this.mask[i]));
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
