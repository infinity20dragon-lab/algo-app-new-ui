import { NextResponse } from "next/server";
import { createPoEController } from "@/lib/poe/controller";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ipAddress, password, type = "netgear_gs308ep" } = body;

    if (!ipAddress) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Create controller and test connection
    const controller = createPoEController(type, {
      ipAddress,
      password,
    });

    const isOnline = await controller.testConnection();

    return NextResponse.json({
      success: true,
      isOnline,
      ipAddress,
      message: isOnline ? "Switch is reachable" : "Switch is not reachable",
    });

  } catch (error) {
    console.error("PoE test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to test PoE switch" },
      { status: 500 }
    );
  }
}
