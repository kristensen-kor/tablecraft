// FilterHelpComponent.js

import { fetch_template, load_CSS } from "../utils.js";

load_CSS("./components/FilterHelpComponent.css");

export default {
	template: await fetch_template("./components/FilterHelpComponent.html"),
	mounted() {
		this.handle_keydown = e => {
			if (e.key == "Escape") this.$emit("close");
		};

		window.addEventListener("keydown", this.handle_keydown);
	},
	beforeUnmount() {
		window.removeEventListener("keydown", this.handle_keydown);
	}
};
