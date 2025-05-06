const fs = require('fs');
const path = require('path');
const https = require('https');
const { createCanvas, loadImage } = require('canvas');

// Create directories if they don't exist
const productDir = path.join(__dirname, '../public/images/products/veggie-coffee');
if (!fs.existsSync(productDir)) {
  fs.mkdirSync(productDir, { recursive: true });
}

// Function to create a product image based on the provided image
async function createProductImage() {
  try {
    // Create a canvas for the main product image
    const canvas = createCanvas(800, 800);
    const ctx = canvas.getContext('2d');
    
    // Fill background with mountain scene (light green gradient)
    const gradient = ctx.createLinearGradient(0, 0, 0, 800);
    gradient.addColorStop(0, '#e8f5e9');
    gradient.addColorStop(1, '#c8e6c9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);
    
    // Draw mountains in background
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(200, 150);
    ctx.lineTo(400, 250);
    ctx.lineTo(600, 100);
    ctx.lineTo(800, 200);
    ctx.lineTo(800, 800);
    ctx.lineTo(0, 800);
    ctx.closePath();
    ctx.fill();
    
    // Draw product box
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.roundRect(250, 350, 300, 200, 10);
    ctx.fill();
    
    // Draw product label
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(270, 370, 260, 160, 5);
    ctx.fill();
    
    // Add product name
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#2e7d32';
    ctx.textAlign = 'center';
    ctx.fillText('Health', 400, 410);
    ctx.fillText('Veggie Coffee', 400, 445);
    
    // Add "124 in 1" text
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#d32f2f';
    ctx.fillText('124 in 1', 400, 480);
    
    // Add product image (coffee cup icon)
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.arc(400, 520, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Add title text
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Veggie Coffee', 400, 150);
    ctx.fillText('124 in 1', 400, 200);
    
    // Add left side text
    ctx.font = '16px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('Substitute', 50, 150);
    ctx.fillText('food for', 50, 170);
    ctx.fillText('daily intake', 50, 190);
    ctx.fillText('that taste', 50, 210);
    ctx.fillText('like natural', 50, 230);
    ctx.fillText('flavor of', 50, 250);
    ctx.fillText('coffee but', 50, 270);
    ctx.fillText('do not', 50, 290);
    ctx.fillText('contain', 50, 310);
    ctx.fillText('caffeine at', 50, 330);
    ctx.fillText('all.', 50, 350);
    
    // Add right side text
    ctx.font = '16px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText('DIRECTION', 750, 150);
    ctx.fillText('FOR', 750, 170);
    ctx.fillText('DETOXIFICATION:', 750, 190);
    ctx.fillText('TAKE BEFORE', 750, 210);
    ctx.fillText('MEAL', 750, 230);
    ctx.fillText('*TO MAINTAIN', 750, 260);
    ctx.fillText('GOOD HEALTH-', 750, 280);
    ctx.fillText('TAKE DURING', 750, 300);
    ctx.fillText('MEAL', 750, 320);
    ctx.fillText('*TO GAIN', 750, 350);
    ctx.fillText('WEIGHT-TAKE', 750, 370);
    ctx.fillText('AFTER MEAL', 750, 390);
    
    // Save the main product image
    const mainBuffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(productDir, 'veggie-coffee-main.jpg'), mainBuffer);
    console.log('Main product image created successfully');
    
    // Create lifestyle image
    const lifestyleCanvas = createCanvas(800, 800);
    const lifestyleCtx = lifestyleCanvas.getContext('2d');
    
    // Fill background with nature scene
    lifestyleCtx.fillStyle = '#e8f5e9';
    lifestyleCtx.fillRect(0, 0, 800, 800);
    
    // Draw mountains
    lifestyleCtx.fillStyle = '#81c784';
    lifestyleCtx.beginPath();
    lifestyleCtx.moveTo(0, 200);
    lifestyleCtx.lineTo(200, 100);
    lifestyleCtx.lineTo(400, 180);
    lifestyleCtx.lineTo(600, 80);
    lifestyleCtx.lineTo(800, 150);
    lifestyleCtx.lineTo(800, 800);
    lifestyleCtx.lineTo(0, 800);
    lifestyleCtx.closePath();
    lifestyleCtx.fill();
    
    // Draw table
    lifestyleCtx.fillStyle = '#8d6e63';
    lifestyleCtx.beginPath();
    lifestyleCtx.rect(150, 500, 500, 30);
    lifestyleCtx.fill();
    
    // Draw product box
    lifestyleCtx.fillStyle = '#4caf50';
    lifestyleCtx.beginPath();
    lifestyleCtx.roundRect(200, 400, 150, 100, 5);
    lifestyleCtx.fill();
    
    // Draw product label
    lifestyleCtx.fillStyle = '#fff';
    lifestyleCtx.beginPath();
    lifestyleCtx.roundRect(210, 410, 130, 80, 3);
    lifestyleCtx.fill();
    
    // Add product name (smaller)
    lifestyleCtx.font = 'bold 14px Arial';
    lifestyleCtx.fillStyle = '#2e7d32';
    lifestyleCtx.textAlign = 'center';
    lifestyleCtx.fillText('Health', 275, 430);
    lifestyleCtx.fillText('Veggie Coffee', 275, 450);
    lifestyleCtx.fillStyle = '#d32f2f';
    lifestyleCtx.fillText('124 in 1', 275, 470);
    
    // Draw coffee cup
    lifestyleCtx.fillStyle = '#8d6e63';
    lifestyleCtx.beginPath();
    lifestyleCtx.roundRect(450, 400, 80, 100, 5);
    lifestyleCtx.fill();
    
    lifestyleCtx.fillStyle = '#5d4037';
    lifestyleCtx.beginPath();
    lifestyleCtx.roundRect(460, 410, 60, 80, 3);
    lifestyleCtx.fill();
    
    // Draw coffee
    lifestyleCtx.fillStyle = '#795548';
    lifestyleCtx.beginPath();
    lifestyleCtx.roundRect(465, 415, 50, 70, 2);
    lifestyleCtx.fill();
    
    // Draw steam
    lifestyleCtx.strokeStyle = '#e0e0e0';
    lifestyleCtx.lineWidth = 2;
    lifestyleCtx.beginPath();
    lifestyleCtx.moveTo(480, 410);
    lifestyleCtx.bezierCurveTo(470, 390, 490, 380, 480, 360);
    lifestyleCtx.stroke();
    
    lifestyleCtx.beginPath();
    lifestyleCtx.moveTo(490, 410);
    lifestyleCtx.bezierCurveTo(500, 390, 480, 380, 500, 360);
    lifestyleCtx.stroke();
    
    // Add title
    lifestyleCtx.font = 'bold 36px Arial';
    lifestyleCtx.fillStyle = '#2e7d32';
    lifestyleCtx.textAlign = 'center';
    lifestyleCtx.fillText('Veggie Coffee Lifestyle', 400, 100);
    
    // Add usage instructions
    lifestyleCtx.font = 'bold 24px Arial';
    lifestyleCtx.fillStyle = '#fff';
    lifestyleCtx.textAlign = 'center';
    lifestyleCtx.fillText('Before Meals: Detoxification', 400, 250);
    lifestyleCtx.fillText('During Meals: Health Maintenance', 400, 300);
    lifestyleCtx.fillText('After Meals: Weight Management', 400, 350);
    
    // Save the lifestyle image
    const lifestyleBuffer = lifestyleCanvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(productDir, 'veggie-coffee-lifestyle.jpg'), lifestyleBuffer);
    console.log('Lifestyle image created successfully');
    
    // Create benefits image
    const benefitsCanvas = createCanvas(800, 800);
    const benefitsCtx = benefitsCanvas.getContext('2d');
    
    // Fill background
    benefitsCtx.fillStyle = '#e8f5e9';
    benefitsCtx.fillRect(0, 0, 800, 800);
    
    // Add title
    benefitsCtx.font = 'bold 36px Arial';
    benefitsCtx.fillStyle = '#2e7d32';
    benefitsCtx.textAlign = 'center';
    benefitsCtx.fillText('Veggie Coffee Benefits', 400, 100);
    
    // Draw product box (small, on the side)
    benefitsCtx.fillStyle = '#4caf50';
    benefitsCtx.beginPath();
    benefitsCtx.roundRect(100, 150, 100, 70, 5);
    benefitsCtx.fill();
    
    // Draw product label
    benefitsCtx.fillStyle = '#fff';
    benefitsCtx.beginPath();
    benefitsCtx.roundRect(105, 155, 90, 60, 3);
    benefitsCtx.fill();
    
    // Add product name (smaller)
    benefitsCtx.font = 'bold 10px Arial';
    benefitsCtx.fillStyle = '#2e7d32';
    benefitsCtx.textAlign = 'center';
    benefitsCtx.fillText('Health', 150, 170);
    benefitsCtx.fillText('Veggie Coffee', 150, 185);
    benefitsCtx.fillStyle = '#d32f2f';
    benefitsCtx.fillText('124 in 1', 150, 200);
    
    // Add benefits text
    benefitsCtx.font = 'bold 24px Arial';
    benefitsCtx.fillStyle = '#2e7d32';
    benefitsCtx.textAlign = 'left';
    
    const benefits = [
      'Caffeine-free coffee alternative',
      '124 natural ingredients',
      'Supports detoxification',
      'Maintains good health',
      'Aids in weight management',
      'Natural coffee flavor'
    ];
    
    benefits.forEach((benefit, index) => {
      benefitsCtx.fillText('• ' + benefit, 250, 200 + index * 60);
    });
    
    // Add usage instructions
    benefitsCtx.font = 'bold 20px Arial';
    benefitsCtx.fillStyle = '#2e7d32';
    benefitsCtx.textAlign = 'center';
    benefitsCtx.fillText('DIRECTIONS FOR USE:', 400, 600);
    
    benefitsCtx.font = '18px Arial';
    benefitsCtx.fillText('For Detoxification: Take before meals', 400, 640);
    benefitsCtx.fillText('For Health Maintenance: Take during meals', 400, 670);
    benefitsCtx.fillText('For Weight Management: Take after meals', 400, 700);
    
    // Save the benefits image
    const benefitsBuffer = benefitsCanvas.toBuffer('image/jpeg');
    fs.writeFileSync(path.join(productDir, 'veggie-coffee-benefits.jpg'), benefitsBuffer);
    console.log('Benefits image created successfully');
    
    console.log('All product images created successfully');
  } catch (error) {
    console.error('Error creating product images:', error);
  }
}

// Run the function
createProductImage();
