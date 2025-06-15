// GenericSelector.js

export default {
	template: "#generic-selector-template",
	props: ["title", "default_item"],
	data() {
		return {
			items: [],
			selected: []
		};
	},
	computed: {
		can_move_up() {
			return this.selected.length != 0 && this.items[0] != this.selected[0];
		},
		can_move_down() {
			return this.selected.length != 0 && this.items.at(-1) != this.selected.at(-1);
		}
	},
	methods: {
		reset() {
			this.items = this.default_item ? [this.default_item] : [];
		},
		add_items(new_items) {
			this.items = [...new Set([...this.items, ...new_items])];
		},
		remove_item(item) {
			const index = this.items.indexOf(item);
			if (index !== -1) this.items.splice(index, 1);
			if (this.items.length === 0) this.reset();
		},
		remove_selected_items() {
			this.items = this.items.filter(col => !this.selected.includes(col));
			if (this.items.length === 0) this.reset();
		},
		move_up() {
			if (!this.can_move_up) return;
			const selected_set = new Set(this.selected)
			const indices = this.items.map((item, idx) => selected_set.has(item) ? idx : -1).filter(idx => idx !== -1)

			for (const i of indices) {
				if (!selected_set.has(this.items[i - 1])) [this.items[i - 1], this.items[i]] = [this.items[i], this.items[i - 1]]
			}
		},
		move_down() {
			if (!this.can_move_down) return;
			const selected_set = new Set(this.selected)
			const indices = this.items.map((item, idx) => selected_set.has(item) ? idx : -1).filter(idx => idx !== -1).reverse()

			for (const i of indices) {
				if (!selected_set.has(this.items[i + 1])) [this.items[i + 1], this.items[i]] = [this.items[i], this.items[i + 1]]
			}
		}
	},
	watch: {
		items(value) {
			this.$emit("update:items", value);
		}
	},
	mounted() {
		this.reset();
	}
};
