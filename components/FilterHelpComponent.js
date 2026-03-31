// FilterHelpComponent.js

import { fetch_template, load_CSS } from "../utils.js";

load_CSS("./components/FilterHelpComponent.css");

export default {
	template: await fetch_template("./components/FilterHelpComponent.html"),
	data() {
		return {
			basic_comparisons: [
				["text", "Match exact value"],
				["code", "gender == 2"],
				["text", "Match not equal to"],
				["code", "gender != 1"],
				["text", "Match any of several values"],
				["code", "brands == 3, 5"],
				["text", "Match a range of values"],
				["code", "brands == 5-12"],
				["text", "Combine lists and ranges"],
				["code", "brands == 1-3, 5, 10-19"],
				["text", "Compare numeric values"],
				["code", "age > 30"],
				["code", "age <= 65"],
				["text", "Match missing values"],
				["code", "brands_P6M == null"],
				["text", "Exclude missing values"],
				["code", "brands_P6M != null"]
			],
			logical_operations:[
				["text", "Combine conditions (logical AND)"],
				["code", "age > 30 && gender == 1"],
				["text", "Match either condition (logical OR)"],
				["code", "gender == 1 || age < 25"],
				["code", "gender == 1 | age < 25"],
				["text", "Group conditions"],
				["code", "(age > 30 && gender == 1) || age < 25"],
				["text", "Negate a condition (logical NOT)"],
				["code", "!(age > 30 && gender == 1) || age < 25"]
			],
			alternative_syntax:[
				["text", "\"=\" works the same as \"==\""],
				["code", "gender = 2"],
				["text", "\"..\" and \":\" work the same as \"-\" for ranges"],
				["code", "brands == 5..12"],
				["code", "brands == 5:12"],
				["text", "R-style single \"&\" or \"|\""],
				["code", "age > 30 & gender == 1"],
				["code", "gender == 1 | age < 25"]
			]
		};
	},
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
