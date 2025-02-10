import "./exceljs.min.js";

export async function export_table(table_data, name) {
	let workbook = new ExcelJS.Workbook();
	let worksheet = workbook.addWorksheet("Sheet 1");

	worksheet.properties.defaultRowHeight = 14;

	table_data.col_header[0].forEach((_, i) => worksheet.getColumn(i + 1).width = 11);
	worksheet.getColumn(2).width = 4;
	worksheet.getColumn(3).width = 26;
	worksheet.getColumn(4).width = 8;

	function add_row_to_worksheet(row_array, row_id, is_col_header = false) {
		let row = worksheet.addRow([]);

		row_array.forEach((cell_data, i) => {
			let cell = row.getCell(i + 1);

			const value = is_col_header ? cell_data : cell_data.value;
			if (value !== "") {
				if (!isNaN(value)) {
					cell.value = Number(value);
					cell.numFmt = value.toString().includes(".") ? "0.0" : "0";
				} else {
					cell.value = value;
				}
			}

			cell.font = { name: "Arial", size: 10 };

			cell.border = {};
			if (row_id == 0) cell.border.top = { style: "thin" };
			if (!is_col_header && row_id == table_data.table.length - 1) cell.border.bottom = { style: "thin" };
			if (i == 3 || i == row_array.length - 1) cell.border.right = { style: "thin" };
			if (i == 0 || table_data.col_header[0][i] != "") cell.border.left = { style: "thin" };

			const make_fill = hex => ({ type: "pattern", pattern: "solid", fgColor: { argb: "FF" + hex } });

			if (is_col_header) cell.fill = cell.fill = make_fill("EFEFEC");
			if (cell_data.style) {
				const style_val = Array.isArray(cell_data.style) ? cell_data.style : [cell_data.style];
				if (style_val.includes("header") && !style_val.includes("bleak")) cell.fill = make_fill("EFEFEC");
				if (style_val.includes("header") && style_val.includes("bleak")) cell.fill = make_fill("F9F9F6");
				if (style_val.includes("bleak")) cell.font.color = { argb: "A6A6A6" };
				if (style_val.includes("p")) cell.fill = make_fill("90EE90");
				if (style_val.includes("n")) cell.fill = make_fill("F08080");
			}
		});
	}

	table_data.col_header.forEach((x, row_id) => add_row_to_worksheet(x, row_id, true))
	table_data.table.forEach((x, row_id) => add_row_to_worksheet(x, row_id));

	const blob = await workbook.xlsx.writeBuffer();
	let link = document.createElement("a");
	link.href = URL.createObjectURL(new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
	const formattedDate = new Date().toISOString().slice(0, 16).replace("T", " ").replace(":", "");
	link.download = `${name} table ${formattedDate}.xlsx`;
	link.click();
}
