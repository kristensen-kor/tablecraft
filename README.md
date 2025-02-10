# Tablecraft  

**Tablecraft** is a web-based application for processing and analyzing tabular datasets. It allows users to **upload datasets, configure table calculations, and generate structured output**. The app provides an intuitive interface for selecting variables, applying transformations, and exporting results—all while ensuring smooth performance with a **Web Worker** for background computations.  

Try it live at: [kristensen-kor.github.io/tablecraft](https://kristensen-kor.github.io/tablecraft)  

---

## 🚀 Features  

### **1. Load Data Instantly** 📂  
The **File Reader** component provides multiple ways to upload datasets, making the process flexible and user-friendly.  

✔ **Paste & Go** – Users can **paste a `.tds` file** directly into a text box for automatic detection and processing.  
✔ **File Upload Support** – Users can **click "Choose File"** to manually select a `.tds` file from their computer.  
✔ **Preloaded Example Dataset** – A **"Load Example Dataset"** button allows users to instantly try the app with sample data (`General Social Survey 2000`).  

---

### **2. Configure Table Structure** 📊  
The **Controls** component allows users to **select variables, assign them to rows and columns, and run calculations**.  

✔ **Variable Selection** – Search for variables, multi-select, and assign them to rows or columns with keyboard shortcuts.  
✔ **Row & Column Assignment** – Organize variables into a table structure; only categorical variables can be used in columns.  
✔ **Quick Preview** – Instantly see a summary of selected variables before running calculations.  
✔ **One-Click Calculation** – Generate tables with a single button, enabled only when both rows and columns are selected.  

### **3. Quick Variable Preview** 🔍  
The **Quick Preview** component provides an **at-a-glance summary of a selected variable**, helping users understand distributions before running a full calculation.  

✔ Supports both **categorical and numeric** variables.  
✔ Displays **percentages, counts, and mean values** for quick validation.  

### **4. Advanced Table Calculations** ⚙️  
The **Table Calculation Engine** runs **weighted computations** in a **Web Worker**, ensuring smooth performance.  

✔ **Computes means and categorical distributions** based on selected variables.  
✔ **Applies statistical significance testing** to highlight meaningful differences.  
✔ **Formats tables dynamically**, removing empty columns and applying styles for better readability.  
✔ **Real-time progress updates** show the status of ongoing calculations.  

### **5. Export Data to Excel** 📥  
The **Table Export** feature allows users to **download results as a structured Excel file**.  

✔ **Automatic Formatting** – Proper column widths, numeric precision, and structured layout.  
✔ **Conditional Styling** – Highlights significant values and dims low counts.  
✔ **One-Click Download** – Saves as `.xlsx`, ready for further analysis in Excel or other spreadsheet tools.  

---

## 🔧 How to Use  

1️⃣ **Upload a `.tds` file** using one of the following methods:  
   - **Paste from clipboard** into the File Reader text box.  
   - **Click "Choose File"** and select a `.tds` file from your computer.  
   - **Load an example dataset** by clicking the **"Load Example Dataset"** button.  

2️⃣ **Select variables** from the list and assign them to **rows and columns**.  
3️⃣ **Preview selected variables** to verify the data structure.  
4️⃣ **Click "Calc"** to generate the table.  
5️⃣ **Download results** as an **Excel file** for further analysis.  

---

## 📦 Built With  

- **Vue.js** – Reactive UI components  
- **Web Workers** – Background calculations without UI lag  
- **ExcelJS** – Structured table exports to Excel  
- **Custom Components** – Modular design for easy extensibility  
