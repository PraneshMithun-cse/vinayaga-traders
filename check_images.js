const ExcelJS = require('exceljs');
const path = require('path');

async function check() {
  const filePath = path.join(__dirname, 'public', 'Copy of Copy of vinayaga traders all products edit.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  const images = worksheet.getImages();
  console.log(`Total images found: ${images.length}`);
  
  // Print the first 20 images' ranges
  images.slice(0, 20).forEach((img, i) => {
    console.log(`Image ${i}: tl.nativeRow=${img.range.tl.nativeRow}, tl.nativeCol=${img.range.tl.nativeCol}`);
  });
}
check().catch(console.error);
