export const component_file_reader = {
	template: `
		<div>
			<textarea id="paste_area" :placeholder="placeholder" @paste="handle_paste" v-model="input" rows="10" cols="50" :class="{ red_error: is_error }"></textarea>
			<br>
			<input type="file" @change="handle_file_input" accept=".tds">
			<br>
			<button @click="handle_load_example('./General Social Survey 2000.tds')">Load Example 'General Social Survey 2000' Dataset</button>
		</div>
	`,
	data() {
		return {
			input: null,
			placeholder: "Focus here and paste a .tds file from clipboard or click 'Choose File' to select one",
			is_error: false
		};
	},
	methods: {
		display_error(text) {
			this.placeholder = text;
			this.is_error = true;
		},
		handle_paste(event) {
			const items = Array.from(event.clipboardData.items);
			const files = items.filter(item => item.kind === "file").map(item => item.getAsFile());

			if (files.length == 0) {
				this.display_error("No file detected. Please paste a .tds file.");
				return;
			} else if (files.length > 1) {
				this.display_error("Please paste only one file.");
				return;
			}

			this.read_and_parse_file(files[0]);
		},
		handle_file_input(event) {
			const files = event.target.files;

			if (!files || files.length == 0) {
				this.display_error("No file selected. Please choose a .tds file.");
				return;
			} else if (files.length > 1) {
				this.display_error("Please choose only one file.");
				return;
			}

			this.read_and_parse_file(files[0]);
		},
		async handle_load_example(file_name) {
			try {
				const response = await fetch(file_name);
				if (!response.ok) throw new Error("File not found");

				const blob = await response.blob();
				this.read_and_parse_file(blob, file_name);
			} catch (error) {
				this.display_error(`Error loading the .tds file: ${error.message}`);
			}
		},
		async read_and_parse_file(file, file_name) {
			try {
				const stream = file.stream().pipeThrough(new DecompressionStream('gzip'));
				const decompressedResponse = new Response(stream);
				const decompressedText = await decompressedResponse.text();
				const dataset = JSON.parse(decompressedText);;
				dataset.name = (file_name !== undefined ? file_name.substr(2) : file.name).replace(/\.[^/.]+$/, "");
				dataset.var_full_label = {};

				for (const var_name of dataset.var_list) {
					dataset.var_full_label[var_name] = (var_name in dataset.var_labels) ? `${var_name}|${dataset.var_labels[var_name]}` : var_name;
				}

				dataset.weight = dataset.data[dataset.weight];
				this.$emit("file-read", dataset);
			} catch (error) {
				this.display_error(`Error processing the file: ${error.message}`);
			}
		}
	},
	mounted() {
		// debug
		// this.handle_load_example("./10540-9.tds");
	},
	watch: {
		input: function() {
			this.input = null;
		}
	}
};
