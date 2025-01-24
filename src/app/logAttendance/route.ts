import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const SPREADSHEET_ID = "1kT9nImqCIGiev4BS6mCgJA4mEitm8CnX9fohgECTl_M";
const RANGE = "Sheet1!A1:D1";

export async function POST(req: NextRequest) {
  // Add CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Allow all origins, change '*' to a specific domain for security
    "Access-Control-Allow-Methods": "POST, OPTIONS", // Allowed HTTP methods
    "Access-Control-Allow-Headers": "Content-Type, Authorization", // Allowed headers
  };

  // Handle preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, employeeId, timeIn, timeOut } = body;

    // Authenticate with Google API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.SERVICE_ACCOUNT_KEY || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, employeeId, timeIn, timeOut]],
      },
    });

    // Return success response with CORS headers
    return new NextResponse(
      JSON.stringify({ message: "Attendance logged successfully" }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Google Sheets API error:", error);
    // Return error response with CORS headers
    return new NextResponse(
      JSON.stringify({ message: "Failed to log attendance", error: error }),
      { status: 500, headers: corsHeaders }
    );
  }
}
