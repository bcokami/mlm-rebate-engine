const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Create directories if they don't exist
const productDir = path.join(__dirname, '../public/images/products/shield-soap');
if (!fs.existsSync(productDir)) {
  fs.mkdirSync(productDir, { recursive: true });
}

// Function to create a product image based on the provided image
async function createProductImage() {
  try {
    // Create a canvas for the main product image
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    
    // Fill background with ocean/water gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#1e90ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // Add water ripple effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 10; i++) {
      const y = 100 + i * 50;
      ctx.beginPath();
      ctx.moveTo(0, y);
      
      for (let x = 0; x < 800; x += 20) {
        const height = 5 * Math.sin((x + i * 20) / 50);
        ctx.lineTo(x, y + height);
      }
      
      ctx.stroke();
    }
    
    // Add title text
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('BIOGEN', 400, 60);
    ctx.fillText('SHIELD', 400, 100);
    ctx.fillText('HERBAL CARE SOAP', 400, 140);
    
    // Draw left soap box
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.roundRect(200, 200, 150, 200, 10);
    ctx.fill();
    
    // Draw left soap label
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(210, 210, 130, 180, 5);
    ctx.fill();
    
    // Add left soap branding
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#4caf50';
    ctx.textAlign = 'center';
    ctx.fillText('Shield', 275, 270);
    
    ctx.font = '16px Arial';
    ctx.fillText('HERBAL CARE', 275, 295);
    ctx.fillText('SOAP', 275, 315);
    
    // Draw right soap box
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.roundRect(450, 200, 150, 200, 10);
    ctx.fill();
    
    // Draw right soap label
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(460, 210, 130, 180, 5);
    ctx.fill();
    
    // Add right soap branding
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#4caf50';
    ctx.textAlign = 'center';
    ctx.fillText('Shield', 525, 270);
    
    ctx.font = '16px Arial';
    ctx.fillText('HERBAL CARE', 525, 295);
    ctx.fillText('SOAP', 525, 315);
    
    // Add Extreme Life logo to both boxes
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#000';
    
    ctx.textAlign = 'center';
    ctx.fillText('EXTREME LIFE', 275, 230);
    ctx.fillText('EXTREME LIFE', 525, 230);
    
    // Add left side text
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('WHITENS, RENEWS', 50, 450);
    ctx.fillText('& NOURISH SKIN', 50, 475);
    
    // Add right side text
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText('*BODY ODOR REMOVER', 750, 400);
    ctx.fillText('*DEODORIZER', 750, 425);
    ctx.fillText('*FEMININE WASH', 750, 450);
    ctx.fillText('*ANTI-BACTERIAL', 750, 475);
    
    // Save the main product image
    const mainBuffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(productDir, 'shield-soap-main.jpg'), mainBuffer);
    console.log('Main product image created successfully');
    
    // Create benefits image
    const benefitsCanvas = createCanvas(800, 600);
    const benefitsCtx = benefitsCanvas.getContext('2d');
    
    // Fill background
    benefitsCtx.fillStyle = '#e8f5e9';
    benefitsCtx.fillRect(0, 0, 800, 600);
    
    // Add title
    benefitsCtx.font = 'bold 36px Arial';
    benefitsCtx.fillStyle = '#4caf50';
    benefitsCtx.textAlign = 'center';
    benefitsCtx.fillText('Biogen Shield Benefits', 400, 60);
    
    // Draw soap box (small, on the side)
    benefitsCtx.fillStyle = '#4caf50';
    benefitsCtx.beginPath();
    benefitsCtx.roundRect(100, 100, 100, 120, 5);
    benefitsCtx.fill();
    
    // Draw soap label
    benefitsCtx.fillStyle = '#fff';
    benefitsCtx.beginPath();
    benefitsCtx.roundRect(110, 110, 80, 100, 3);
    benefitsCtx.fill();
    
    // Add soap branding (smaller)
    benefitsCtx.font = 'bold 16px Arial';
    benefitsCtx.fillStyle = '#4caf50';
    benefitsCtx.textAlign = 'center';
    benefitsCtx.fillText('Shield', 150, 150);
    
    benefitsCtx.font = '10px Arial';
    benefitsCtx.fillText('HERBAL CARE', 150, 165);
    benefitsCtx.fillText('SOAP', 150, 180);
    
    // Add benefits text
    benefitsCtx.font = 'bold 24px Arial';
    benefitsCtx.fillStyle = '#4caf50';
    benefitsCtx.textAlign = 'left';
    
    const benefits = [
      'Whitens & renews skin',
      'Removes body odor',
      'Natural deodorizer',
      'Feminine wash',
      'Anti-bacterial protection',
      'Made with natural herbs'
    ];
    
    benefits.forEach((benefit, index) => {
      benefitsCtx.fillText('• ' + benefit, 250, 150 + index * 50);
    });
    
    // Add usage instructions
    benefitsCtx.font = 'bold 20px Arial';
    benefitsCtx.fillStyle = '#4caf50';
    benefitsCtx.textAlign = 'center';
    benefitsCtx.fillText('HOW TO USE:', 400, 450);
    
    benefitsCtx.font = '18px Arial';
    benefitsCtx.fillText('For Body: Lather on wet skin, massage gently, and rinse thoroughly.', 400, 480);
    benefitsCtx.fillText('For Feminine Wash: Use as directed by healthcare professional.', 400, 510);
    benefitsCtx.fillText('For best results, use daily.', 400, 540);
    
    // Save the benefits image
    const benefitsBuffer = benefitsCanvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(productDir, 'shield-soap-benefits.jpg'), benefitsBuffer);
    console.log('Benefits image created successfully');
    
    // Create packaging image
    const packagingCanvas = createCanvas(800, 600);
    const packagingCtx = packagingCanvas.getContext('2d');
    
    // Fill background
    packagingCtx.fillStyle = '#f5f5f5';
    packagingCtx.fillRect(0, 0, 800, 600);
    
    // Add title
    packagingCtx.font = 'bold 36px Arial';
    packagingCtx.fillStyle = '#4caf50';
    packagingCtx.textAlign = 'center';
    packagingCtx.fillText('Biogen Shield Packaging', 400, 60);
    
    // Draw front of box
    packagingCtx.fillStyle = '#4caf50';
    packagingCtx.beginPath();
    packagingCtx.roundRect(150, 150, 200, 300, 10);
    packagingCtx.fill();
    
    // Draw front label
    packagingCtx.fillStyle = '#fff';
    packagingCtx.beginPath();
    packagingCtx.roundRect(160, 160, 180, 280, 5);
    packagingCtx.fill();
    
    // Add front branding
    packagingCtx.font = 'bold 10px Arial';
    packagingCtx.fillStyle = '#000';
    packagingCtx.textAlign = 'center';
    packagingCtx.fillText('EXTREME LIFE', 250, 180);
    
    packagingCtx.font = 'bold 28px Arial';
    packagingCtx.fillStyle = '#4caf50';
    packagingCtx.fillText('Shield', 250, 220);
    
    packagingCtx.font = '18px Arial';
    packagingCtx.fillText('HERBAL CARE', 250, 250);
    packagingCtx.fillText('SOAP', 250, 275);
    
    // Draw soap bar
    packagingCtx.fillStyle = '#8bc34a';
    packagingCtx.beginPath();
    packagingCtx.roundRect(450, 200, 200, 100, 20);
    packagingCtx.fill();
    
    packagingCtx.fillStyle = '#689f38';
    packagingCtx.font = 'bold 24px Arial';
    packagingCtx.textAlign = 'center';
    packagingCtx.fillText('Shield', 550, 260);
    
    // Add packaging details
    packagingCtx.font = '16px Arial';
    packagingCtx.fillStyle = '#333';
    packagingCtx.textAlign = 'left';
    
    packagingCtx.fillText('Net Weight: 135g', 450, 350);
    packagingCtx.fillText('Ingredients:', 450, 380);
    packagingCtx.font = '14px Arial';
    packagingCtx.fillText('Natural herbal extracts, coconut oil,', 450, 400);
    packagingCtx.fillText('glycerin, purified water, natural', 450, 420);
    packagingCtx.fillText('fragrance, vitamin E', 450, 440);
    
    // Add barcode
    packagingCtx.fillStyle = '#000';
    for (let i = 0; i < 30; i++) {
      const x = 500 + i * 3;
      const height = 30 + Math.random() * 20;
      packagingCtx.fillRect(x, 480, 2, height);
    }
    
    packagingCtx.font = '10px Arial';
    packagingCtx.textAlign = 'center';
    packagingCtx.fillText('8 809123 456789', 550, 530);
    
    // Save the packaging image
    const packagingBuffer = packagingCanvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(productDir, 'shield-soap-packaging.jpg'), packagingBuffer);
    console.log('Packaging image created successfully');
    
    console.log('All product images created successfully');
  } catch (error) {
    console.error('Error creating product images:', error);
  }
}

// Run the function
createProductImage();
