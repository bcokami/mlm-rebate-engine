import { NextRequest, NextResponse } from "next/server";
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Create a simple SVG logo
    const svgLogo = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="90" fill="#4CAF50" />
      <circle cx="100" cy="100" r="70" fill="#388E3C" />
      <path d="M100,30 Q130,60 100,90 Q70,60 100,30" fill="#8BC34A" />
      <path d="M60,70 Q90,100 60,130 Q30,100 60,70" fill="#8BC34A" />
      <path d="M140,70 Q170,100 140,130 Q110,100 140,70" fill="#8BC34A" />
      <path d="M100,110 Q130,140 100,170 Q70,140 100,110" fill="#8BC34A" />
      <circle cx="100" cy="100" r="25" fill="#FFEB3B" />
      <text x="100" y="190" font-family="Arial" font-size="16" text-anchor="middle" fill="white">EXTREME LIFE</text>
    </svg>
    `;

    // Save the SVG to a file
    const publicDir = path.join(process.cwd(), 'public');
    fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgLogo);

    return NextResponse.json({ success: true, message: "Logo generated successfully" });
  } catch (error) {
    console.error("Error generating logo:", error);
    return NextResponse.json(
      { error: "Failed to generate logo" },
      { status: 500 }
    );
  }
}
