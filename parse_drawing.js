const fs = require('fs');
const path = require('path');

const drawingPath = path.join(__dirname, 'temp_excel', 'xl', 'drawings', 'drawing1.xml');
const relsPath = path.join(__dirname, 'temp_excel', 'xl', 'drawings', '_rels', 'drawing1.xml.rels');
const mediaDir = path.join(__dirname, 'temp_excel', 'xl', 'media');
const outDir = path.join(__dirname, 'public', 'images', 'products');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Parse rels
const relsContent = fs.readFileSync(relsPath, 'utf8');
const relRegex = /Id="([^"]+)"\s+Type="[^"]*image"[^>]*Target="([^"]+)"/g;
const rIdToTarget = {};
let relMatch;
while ((relMatch = relRegex.exec(relsContent)) !== null) {
  rIdToTarget[relMatch[1]] = relMatch[2].replace('../media/', '');
}

// Parse drawing
const drawingContent = fs.readFileSync(drawingPath, 'utf8');
// Each image is typically in a <xdr:twoCellAnchor> or <xdr:oneCellAnchor> block
// We can split by <xdr:from> or <xdr:pic> and find the nearest <xdr:row> and r:embed
const blocks = drawingContent.split(/<xdr:(?:two|one)CellAnchor/);
const rowToImage = {};

for (let i = 1; i < blocks.length; i++) {
  const block = blocks[i];
  
  // Get row from <xdr:from>
  const fromMatch = block.match(/<xdr:from>.*?<xdr:row>(\d+)<\/xdr:row>.*?<\/xdr:from>/s);
  if (!fromMatch) continue;
  const row = parseInt(fromMatch[1], 10);
  
  // Get rId from <xdr:pic> -> <a:blip r:embed="rIdX"
  const blipMatch = block.match(/<a:blip[^>]+r:embed="([^"]+)"/);
  if (!blipMatch) continue;
  const rId = blipMatch[1];
  
  const targetImage = rIdToTarget[rId];
  if (targetImage) {
    const srcPath = path.join(mediaDir, targetImage);
    if (fs.existsSync(srcPath)) {
      const ext = path.extname(targetImage);
      // Native row is 0-indexed in Excel (row 1 is <xdr:row>0</xdr:row>)
      const newImgName = `prod_row_${row}${ext}`;
      const destPath = path.join(outDir, newImgName);
      fs.copyFileSync(srcPath, destPath);
      rowToImage[row] = `/images/products/${newImgName}`;
    }
  }
}

console.log(`Successfully mapped ${Object.keys(rowToImage).length} images.`);
fs.writeFileSync('row_image_map.json', JSON.stringify(rowToImage, null, 2));
