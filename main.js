// Import custom elements
import "./custom_elements.js";

// Load worker
const worker = new Worker("worker.js", { type: "module" });

// Import vue.js and exceljs
import { createApp, toRaw } from "./vue.esm-browser.js";

// Import utils
import { sum, round } from "./utils.js";

// Import the components
import { component_file_reader } from "./component_file_reader.js";
import { component_controls } from "./component_controls.js";
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
		handleFileRead(dataset) {
			this.dataset = dataset;
		},
		read_new_dataset() {
			this.dataset = null;
		},
		calc_table(row_vars, col_vars) {
			this.progress = 0;
			this.calculating_table = true;
			worker.postMessage({ row_vars: toRaw(row_vars), col_vars: toRaw(col_vars), dataset: toRaw(this.dataset) });
		},
		reset_table() {
			this.table_data = null;
		},
		async download() {
			await export_table(this.table_data, this.dataset.name);
		}
	},
	mounted() {
		worker.addEventListener("message", (e) => {
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
	// },
	components: {
		"file-reader": component_file_reader,
		"controls": component_controls
	}
};

const app = createApp(app_config).mount("#app");
