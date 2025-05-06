const fs = require('fs');
const path = require('path');
const https = require('https');
const { createCanvas, loadImage } = require('canvas');

// Create directories if they don't exist
const productDir = path.join(__dirname, '../public/images/products/biogen-extreme');
if (!fs.existsSync(productDir)) {
  fs.mkdirSync(productDir, { recursive: true });
}

// Function to create a product image
async function createProductImage() {
  try {
    // Create a canvas for the main product image
    const canvas = createCanvas(800, 800);
    const ctx = canvas.getContext('2d');
    
    // Fill background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, '#e0f7fa');
    gradient.addColorStop(1, '#b2ebf2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);
    
    // Draw product bottle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(300, 200, 200, 400, 20);
    ctx.fill();
    
    // Draw bottle cap
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.roundRect(330, 170, 140, 50, 10);
    ctx.fill();
    
    // Draw product label
    ctx.fillStyle = '#2196f3';
    ctx.beginPath();
    ctx.roundRect(320, 300, 160, 200, 10);
    ctx.fill();
    
    // Add product name
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('BIOGEN', 400, 350);
    ctx.fillText('EXTREME', 400, 380);
    
    // Add product description
    ctx.font = '16px Arial';
    ctx.fillText('CONCENTRATE', 400, 410);
    ctx.fillText('ORGANIC', 400, 440);
    ctx.fillText('ENZYME', 400, 470);
    
    // Add water droplet logo
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(400, 320, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some decorative elements (flowers, nature elements)
    ctx.fillStyle = '#ffeb3b';
    for (let i = 0; i < 5; i++) {
      const x = 100 + Math.random() * 600;
      const y = 600 + Math.random() * 150;
      drawFlower(ctx, x, y, 15);
    }
    
    // Save the main product image
    const mainBuffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(productDir, 'biogen-extreme-main.jpg'), mainBuffer);
    console.log('Main product image created successfully');
    
    // Create lifestyle image
    const lifestyleCanvas = createCanvas(800, 800);
    const lifestyleCtx = lifestyleCanvas.getContext('2d');
    
    // Fill background with nature scene
    lifestyleCtx.fillStyle = '#e8f5e9';
    lifestyleCtx.fillRect(0, 0, 800, 800);
    
    // Draw some grass
    lifestyleCtx.fillStyle = '#81c784';
    lifestyleCtx.beginPath();
    lifestyleCtx.moveTo(0, 600);
    lifestyleCtx.lineTo(800, 650);
    lifestyleCtx.lineTo(800, 800);
    lifestyleCtx.lineTo(0, 800);
    lifestyleCtx.closePath();
    lifestyleCtx.fill();
    
    // Draw sun
    lifestyleCtx.fillStyle = '#ffeb3b';
    lifestyleCtx.beginPath();
    lifestyleCtx.arc(650, 150, 80, 0, Math.PI * 2);
    lifestyleCtx.fill();
    
    // Draw product bottle (smaller)
    lifestyleCtx.fillStyle = '#fff';
    lifestyleCtx.beginPath();
    lifestyleCtx.roundRect(350, 350, 100, 200, 10);
    lifestyleCtx.fill();
    
    // Draw bottle cap
    lifestyleCtx.fillStyle = '#e0e0e0';
    lifestyleCtx.beginPath();
    lifestyleCtx.roundRect(365, 335, 70, 25, 5);
    lifestyleCtx.fill();
    
    // Draw product label
    lifestyleCtx.fillStyle = '#2196f3';
    lifestyleCtx.beginPath();
    lifestyleCtx.roundRect(360, 400, 80, 100, 5);
    lifestyleCtx.fill();
    
    // Add product name (smaller)
    lifestyleCtx.font = 'bold 12px Arial';
    lifestyleCtx.fillStyle = '#fff';
    lifestyleCtx.textAlign = 'center';
    lifestyleCtx.fillText('BIOGEN', 400, 425);
    lifestyleCtx.fillText('EXTREME', 400, 440);
    
    // Draw glass of water
    lifestyleCtx.fillStyle = 'rgba(173, 216, 230, 0.7)';
    lifestyleCtx.beginPath();
    lifestyleCtx.moveTo(200, 400);
    lifestyleCtx.lineTo(170, 550);
    lifestyleCtx.lineTo(270, 550);
    lifestyleCtx.lineTo(240, 400);
    lifestyleCtx.closePath();
    lifestyleCtx.fill();
    
    // Draw glass outline
    lifestyleCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    lifestyleCtx.lineWidth = 2;
    lifestyleCtx.beginPath();
    lifestyleCtx.moveTo(200, 400);
    lifestyleCtx.lineTo(170, 550);
    lifestyleCtx.lineTo(270, 550);
    lifestyleCtx.lineTo(240, 400);
    lifestyleCtx.closePath();
    lifestyleCtx.stroke();
    
    // Draw flowers
    for (let i = 0; i < 10; i++) {
      const x = 50 + Math.random() * 700;
      const y = 600 + Math.random() * 150;
      drawFlower(lifestyleCtx, x, y, 10);
    }
    
    // Save the lifestyle image
    const lifestyleBuffer = lifestyleCanvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(productDir, 'biogen-extreme-lifestyle.jpg'), lifestyleBuffer);
    console.log('Lifestyle image created successfully');
    
    // Create benefits image
    const benefitsCanvas = createCanvas(800, 800);
    const benefitsCtx = benefitsCanvas.getContext('2d');
    
    // Fill background
    benefitsCtx.fillStyle = '#e1f5fe';
    benefitsCtx.fillRect(0, 0, 800, 800);
    
    // Draw product bottle (small, on the side)
    benefitsCtx.fillStyle = '#fff';
    benefitsCtx.beginPath();
    benefitsCtx.roundRect(100, 300, 80, 160, 8);
    benefitsCtx.fill();
    
    // Draw bottle cap
    benefitsCtx.fillStyle = '#e0e0e0';
    benefitsCtx.beginPath();
    benefitsCtx.roundRect(110, 285, 60, 20, 4);
    benefitsCtx.fill();
    
    // Draw product label
    benefitsCtx.fillStyle = '#2196f3';
    benefitsCtx.beginPath();
    benefitsCtx.roundRect(110, 340, 60, 80, 4);
    benefitsCtx.fill();
    
    // Add title
    benefitsCtx.font = 'bold 36px Arial';
    benefitsCtx.fillStyle = '#01579b';
    benefitsCtx.textAlign = 'center';
    benefitsCtx.fillText('Benefits', 400, 100);
    
    // Add benefits text
    benefitsCtx.font = 'bold 24px Arial';
    benefitsCtx.fillStyle = '#0277bd';
    benefitsCtx.textAlign = 'left';
    
    const benefits = [
      'Helps maintain acid-alkaline balance',
      'Oxygenates the cells',
      'Tasteless and odorless in water',
      'Gluten Free',
      'Vegan',
      'Contains essential minerals'
    ];
    
    benefits.forEach((benefit, index) => {
      benefitsCtx.fillText('• ' + benefit, 250, 200 + index * 60);
    });
    
    // Draw decorative elements
    for (let i = 0; i < 8; i++) {
      const x = 50 + Math.random() * 700;
      const y = 600 + Math.random() * 150;
      drawFlower(benefitsCtx, x, y, 12);
    }
    
    // Save the benefits image
    const benefitsBuffer = benefitsCanvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(productDir, 'biogen-extreme-benefits.jpg'), benefitsBuffer);
    console.log('Benefits image created successfully');
    
    console.log('All product images created successfully');
  } catch (error) {
    console.error('Error creating product images:', error);
  }
}

// Helper function to draw a simple flower
function drawFlower(ctx, x, y, size) {
  // Draw petals
  ctx.fillStyle = '#ffeb3b';
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.PI / 4) * i);
    ctx.beginPath();
    ctx.ellipse(0, size, size / 2, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // Draw center
  ctx.fillStyle = '#ff9800';
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

// Run the function
createProductImage();
