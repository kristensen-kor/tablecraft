// Import custom elements
import "./custom_elements.js";

// Load worker
const worker = new Worker("worker.js", { type: "module" });

// Import vue.js and exceljs
import { createApp, toRaw } from "https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.esm-browser.js";
import "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";

// Import utils
import { sum, round } from "./utils.js";

// Import the components
import { component_file_reader } from "./component_file_reader.js";
import { component_controls } from "./component_controls.js";



const app_config = {
	data() {
		return {
			dataset: null,
			calculating_table: false,
			table_data: null,
			progress: {
				current: 0,
				total: 0
			}
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
			this.calculating_table = true;
			this.progress.current = 0;
			this.progress.total = 0;
			worker.postMessage({ row_vars: toRaw(row_vars), col_vars: toRaw(col_vars), dataset: toRaw(this.dataset) });
		},
		reset_table() {
			this.table_data = null;
		},
		async download() {
			let table = document.getElementById("export_table");
			let workbook = new ExcelJS.Workbook();
			let worksheet = workbook.addWorksheet("Sheet 1");

			let rows = table.rows;
			for (let i = 0; i < rows.length; i++) {
				let row = worksheet.addRow([]);
				let cells = rows[i].cells;

				for (let j = 0; j < cells.length; j++) {
					let htmlCell = cells[j];
					let cell = row.getCell(j + 1);


					const value = htmlCell.innerText.trim();

					if (value !== "") {
						if (!isNaN(value)) {
							cell.value = Number(value);
							cell.numFmt = value.includes(".") ? "0.0" : "0";
						} else {
							cell.value = value;
						}
					}

					const style = window.getComputedStyle(htmlCell);
					const bgColor = style.backgroundColor;
					const fontColor = style.color;

					const rgbToHex = (rgb) => rgb.match(/\d+/g).slice(0, 3).map((x) => ("0" + parseInt(x).toString(16)).slice(-2)).join("").toUpperCase();

					if (bgColor && bgColor !== "rgba(0, 0, 0, 0)") {
						cell.fill = {
							type: "pattern",
							pattern: "solid",
							fgColor: { argb: rgbToHex(bgColor) }
						};
					}

					if (fontColor) cell.font = { color: { argb: rgbToHex(fontColor) } };

					cell.font.name = "Arial";
					cell.font.size = 10;

					cell.border = {};
					if (i == 0) cell.border.top = { style: "thin" };
					if (j == 0) cell.border.left = { style: "thin" };
					if (i == rows.length - 1) cell.border.bottom = { style: "thin" };
					if (j == cells.length - 1) cell.border.right = { style: "thin" };
					if (i == 2) cell.border.bottom = { style: "thin" };
					if (j == 3) cell.border.right = { style: "thin" };
					if (rows[0].cells[j].innerText != "") cell.border.left = { style: "thin" };
				}
			}

			const blob = await workbook.xlsx.writeBuffer();
			let link = document.createElement("a");
			link.href = URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
			const formattedDate = new Date().toISOString().slice(0, 16).replace("T", " ").replace(":", "");
			link.download = `${this.dataset.name} table ${formattedDate}.xlsx`;
			link.click();
		}
	},
	mounted() {
		worker.addEventListener("message", (e) => {
			const data = e.data;
			if (data.type == "start") {
				this.progress.total = data.total_ticks;
			} else if (data.type == "tick") {
				this.progress.current++;
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
