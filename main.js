import "./custom_elements.js";

const worker = new Worker("worker.js", { type: "module" });

import { createApp, toRaw } from "vue";

import FileReader from "./components/FileReader.js";
import ControlsComponent from "./components/ControlsComponent.js";
import { export_table } from "./export_table.js";

const app_config = {
	data() {
		return {
			dataset: null,
			calculating_table: false,
			table_data: null,
			progress: 0
		};
	},
	provide() {
		return {
			dataset_ref: () => this.dataset
		};
	},
	methods: {
		read_new_dataset() {
			this.table_data = null;
			this.dataset = null;
		},
		calc_table(row_vars, col_vars, filter_mask, filter_string) {
			this.progress = 0;
			this.calculating_table = true;
			worker.postMessage({ dataset: toRaw(this.dataset), row_vars: toRaw(row_vars), col_vars: toRaw(col_vars), filter_mask: toRaw(filter_mask), filter_string: toRaw(filter_string) });
		},
		reset_table() {
			this.table_data = null;
		},
		download() {
			export_table(this.table_data, this.dataset.name);
		}
	},
	mounted() {
		worker.addEventListener("message", e => {
			const data = e.data;
			if (data.type == "tick") {
				this.progress = data.progress;
			} else if (data.type == "result") {
				this.table_data = data.result;
				this.calculating_table = false;
			}
		});
	},
	// debug
	// watch: {
	// 	dataset(x) {
	// 		if (x !== null) this.calc_table(["REGION", "TYPE", "S4", "S4_1"], ["total", "REGION", "S8", "S4_1"]);
	// 	}
	// }
	components: {
		FileReader,
		ControlsComponent
	}
};

const app = createApp(app_config).mount("#app");
