const XLSX = require('xlsx');
const path = require('path');
const filePath = path.join(__dirname, 'public', 'Copy of Copy of vinayaga traders all products edit.xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(JSON.stringify(data[0], null, 2));
