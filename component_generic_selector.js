export const component_generic_selector = {
	template: "#generic-selector-template",
	props: ["title", "comp_class", "ref_items", "def_item"],
	data() {
		return {
			def_items: this.def_item ? [this.def_item] : [],
			selected: []
		};
	},
	computed: {
		items: {
			get() {
				return this.ref_items;
			},
			set(newItems) {
				this.$emit("update:ref_items", newItems);
			}
		}
	},
	methods: {
		reset() {
			this.items = this.def_items;
		},
		remove_item(item) {
			const index = this.items.indexOf(item);
			if (index !== -1) this.items.splice(index, 1);
			if (this.items.length === 0) this.items = this.def_items;
		},
		remove_selected_items() {
			this.items = this.items.filter(col => !this.selected.includes(col));
			if (this.items.length === 0) this.items = this.def_items;
		},
		moveUp() {
			let arr = this.items;
			let selectedSet = new Set(this.selected);
			let i = 0;
			while (i < arr.length) {
				if (selectedSet.has(arr[i])) {
					let start = i;
					while (i < arr.length && selectedSet.has(arr[i])) {
						i++;
					}
					let end = i - 1;
					if (start > 0 && !selectedSet.has(arr[start - 1])) {
						const temp = arr[start - 1];
						arr.splice(start - 1, 1);
						arr.splice(end, 0, temp);
						i = start;
					}
				} else {
					i++;
				}
			}
		},
		moveDown() {
			let arr = this.items;
			let selectedSet = new Set(this.selected);
			let i = arr.length - 1;
			while (i >= 0) {
				if (selectedSet.has(arr[i])) {
					let end = i;
					while (i >= 0 && selectedSet.has(arr[i])) {
						i--;
					}
					let start = i + 1;
					if (end < arr.length - 1 && !selectedSet.has(arr[end + 1])) {
						const temp = arr[end + 1];
						arr.splice(end + 1, 1);
						arr.splice(start, 0, temp);
						i = start - 1;
					}
				} else {
					i--;
				}
			}
		}
	}
};
