const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function extract() {
  const filePath = path.join(__dirname, 'temp_excel', 'Copy of Copy of vinayaga traders all products edit.xlsx');
  const outDir = path.join(__dirname, 'public', 'images', 'products');
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  const products = [];
  const images = worksheet.getImages();
  console.log(`Found ${images.length} images.`);

  // Map images by row index
  const imagesByRow = {};
  for (const img of images) {
    const row = img.range.tl.nativeRow;
    imagesByRow[row] = img;
  }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    // Columns are Name, Quantity, Price. Usually A, B, C but let's check values.
    const name = row.getCell(1).text || row.getCell(2).text; // Adjust if needed
    // Let's just iterate over cells to find the text.
    let values = [];
    row.eachCell((cell) => {
      if (cell.text) values.push(cell.text);
    });

    if (values.length === 0) return;

    let imgFileName = null;
    const imgObj = imagesByRow[rowNumber - 1]; // nativeRow is 0-indexed
    if (imgObj) {
      const imgData = workbook.model.media.find(m => m.index === imgObj.imageId);
      if (imgData) {
        const ext = imgData.extension || 'png';
        imgFileName = `prod_${rowNumber}.${ext}`;
        fs.writeFileSync(path.join(outDir, imgFileName), imgData.buffer);
      }
    }

    products.push({
      row: rowNumber,
      values: values,
      image: imgFileName ? `/images/products/${imgFileName}` : null
    });
  });

  fs.writeFileSync('extracted_products.json', JSON.stringify(products, null, 2));
  console.log(`Extracted ${products.length} products to extracted_products.json`);
}

extract().catch(console.error);
