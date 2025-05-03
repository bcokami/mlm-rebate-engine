import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to upload files" },
        { status: 401 }
      );
    }

    // Check if the authenticated user is an admin
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    // Process the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Please upload a JPEG, PNG, WebP, or GIF image." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit" },
        { status: 400 }
      );
    }

    // Create a unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Define the upload directory and ensure it exists
    const uploadDir = join(process.cwd(), "public", "uploads");
    
    try {
      // Convert the file to a Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Write the file to the uploads directory
      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      
      // Return the file URL
      const fileUrl = `/uploads/${fileName}`;
      
      return NextResponse.json({ 
        success: true, 
        url: fileUrl,
        message: "File uploaded successfully" 
      });
    } catch (error) {
      console.error("Error saving file:", error);
      return NextResponse.json(
        { error: "Failed to save the uploaded file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to process file upload" },
      { status: 500 }
    );
  }
}
