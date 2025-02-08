export const component_file_reader = {
	template: `
		<div><textarea id="paste_area" :placeholder="placeholder" @paste="handle_paste" v-model="input" rows="10" cols="50" :class="{ red_error: is_error }"></textarea></div>
	`,
	data() {
		return {
			input: null,
			placeholder: "Focus here and paste a .tds file from clipboard",
			is_error: false
		};
	},
	methods: {
		handle_paste(event) {
			const items = Array.from(event.clipboardData.items);

			const fileItems = items.filter(item => item.kind === "file").map(item => item.getAsFile());

			if (fileItems.length == 0) {
				this.placeholder = "No file detected. Please paste a .tds file.";
				this.is_error = true;
				return;
			} else if (fileItems.length > 1) {
				this.placeholder = "Please paste only one file.";
				this.is_error = true;
				return;
			}

			this.read_and_parse_file(fileItems[0]);
		},
		async read_and_parse_file(file) {
			try {
				const decompressedText = await this.decompress_gzip(file);

				const dataset = JSON.parse(decompressedText);
				dataset.name = file.name?.replace(/\.[^/.]+$/, "") ?? "test file";

				dataset.var_full_label = {};

				for (const var_name of dataset.var_list) {
					dataset.var_full_label[var_name] = (var_name in dataset.var_labels) ? `${var_name}|${dataset.var_labels[var_name]}` : var_name;
				}

				dataset.weight = dataset.data[dataset.weight];

				this.$emit("file-read", dataset);
			} catch (error) {
				this.is_error = true;
				this.placeholder = `Error processing the file: ${error.message}`;
			}
		},
		async decompress_gzip(file) {
			try {
				const stream = file.stream().pipeThrough(new DecompressionStream('gzip'));
				const decompressedResponse = new Response(stream);
				const decompressedText = await decompressedResponse.text();
				return decompressedText;
			} catch (error) {
				throw new Error("Decompression failed. The file may not be a valid gzip-compressed file.");
			}
		},
		async load_temp_tds_file(file_name) {
			try {
				const response = await fetch(file_name);
				if (!response.ok) throw new Error("File not found");

				const blob = await response.blob();
				this.read_and_parse_file(blob);
			} catch (error) {
				this.is_error = true;
				this.placeholder = `Error loading the .tds file: ${error.message}`;
			}
		}
	},
	mounted() {
		// debug
		// this.load_temp_tds_file("./10540-9.tds");
	},
	watch: {
		input: function() {
			this.input = null;
		}
	}
};
