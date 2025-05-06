const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create directories if they don't exist
const productDir = path.join(__dirname, '../public/images/products/biogen-extreme');
if (!fs.existsSync(productDir)) {
  fs.mkdirSync(productDir, { recursive: true });
}

// Function to create a product image
function createProductImage() {
  try {
    // Create a canvas for the main product image
    const canvas = createCanvas(800, 800);
    const ctx = canvas.getContext('2d');
    
    // Fill background with gradient (light blue)
    ctx.fillStyle = '#e3f2fd';
    ctx.fillRect(0, 0, 800, 800);
    
    // Draw product bottle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(350, 200);
    ctx.lineTo(350, 600);
    ctx.arc(400, 600, 50, Math.PI, 0, false);
    ctx.lineTo(450, 200);
    ctx.closePath();
    ctx.fill();
    
    // Draw bottle cap
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.arc(400, 200, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw product label
    ctx.fillStyle = '#2196f3';
    ctx.beginPath();
    ctx.rect(350, 300, 100, 200);
    ctx.fill();
    
    // Add product name
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('BIOGEN', 400, 350);
    ctx.fillText('EXTREME', 400, 380);
    
    // Add product description
    ctx.font = '14px Arial';
    ctx.fillText('CONCENTRATE', 400, 410);
    ctx.fillText('ORGANIC', 400, 440);
    ctx.fillText('ENZYME', 400, 470);
    
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
    
    // Draw grass
    lifestyleCtx.fillStyle = '#81c784';
    lifestyleCtx.beginPath();
    lifestyleCtx.rect(0, 600, 800, 200);
    lifestyleCtx.fill();
    
    // Draw product bottle (smaller)
    lifestyleCtx.fillStyle = '#fff';
    lifestyleCtx.beginPath();
    lifestyleCtx.moveTo(375, 350);
    lifestyleCtx.lineTo(375, 550);
    lifestyleCtx.arc(400, 550, 25, Math.PI, 0, false);
    lifestyleCtx.lineTo(425, 350);
    lifestyleCtx.closePath();
    lifestyleCtx.fill();
    
    // Draw bottle cap
    lifestyleCtx.fillStyle = '#e0e0e0';
    lifestyleCtx.beginPath();
    lifestyleCtx.arc(400, 350, 15, 0, Math.PI * 2);
    lifestyleCtx.fill();
    
    // Draw product label
    lifestyleCtx.fillStyle = '#2196f3';
    lifestyleCtx.beginPath();
    lifestyleCtx.rect(375, 400, 50, 100);
    lifestyleCtx.fill();
    
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
      benefitsCtx.fillText('• ' + benefit, 200, 200 + index * 60);
    });
    
    // Save the benefits image
    const benefitsBuffer = benefitsCanvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(productDir, 'biogen-extreme-benefits.jpg'), benefitsBuffer);
    console.log('Benefits image created successfully');
    
    console.log('All product images created successfully');
  } catch (error) {
    console.error('Error creating product images:', error);
  }
}

// Run the function
createProductImage();
