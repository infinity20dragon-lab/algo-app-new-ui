import { NextResponse } from "next/server";
import { createPoEController } from "@/lib/poe/controller";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ipAddress, password, type = "netgear_gs308ep", switchId } = body;

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

    // Update switch status if switchId provided
    if (switchId && isOnline) {
      const { updatePoESwitch } = await import("@/lib/firebase/firestore");
      await updatePoESwitch(switchId, {
        isOnline: true,
        lastSeen: new Date(),
      });
    }

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
