class FlexElement extends HTMLElement {
	static observedAttributes = ["justify", "align", "gap"];

	connectedCallback() {
		this.style.display = "flex";
		this.updateStyles();
	}

	attributeChangedCallback() {
		this.updateStyles();
	}

	updateStyles() {
		this.style.justifyContent = this.getAttribute("justify") ?? "";
		this.style.alignItems = this.getAttribute("align") ?? "";
		this.style.gap = this.getAttribute("gap") ?? "";
	}
}

class FlexRow extends FlexElement {
	connectedCallback() {
		super.connectedCallback();
		this.style.flexDirection = "row";
	}
}

class FlexCol extends FlexElement {
	connectedCallback() {
		super.connectedCallback();
		this.style.flexDirection = "column";
	}
}

customElements.define("flex-row", FlexRow);
customElements.define("flex-col", FlexCol);


class GridElement extends HTMLElement {
	static observedAttributes = ["gap", "template"];

	connectedCallback() {
		this.style.display = "grid";
		this.updateStyles();
	}

	attributeChangedCallback() {
		this.updateStyles();
	}

	updateStyles() {
		this.style.gap = this.getAttribute("gap") ?? "";
		const template = this.getAttribute("template") ?? "";
		if (template) {
			this.style[this.templateType] = template;
		} else {
			this.style.removeProperty(this.templateType);
		}
	}
}

class GridRows extends GridElement {
	templateType = "gridTemplateRows";
}

class GridCols extends GridElement {
	templateType = "gridTemplateColumns";
}

customElements.define("grid-rows", GridRows);
customElements.define("grid-cols", GridCols);
