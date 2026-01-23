import { NextResponse } from "next/server";
import { getPoESwitch, getPoEDevice, updatePoEDevice, updatePoESwitch } from "@/lib/firebase/firestore";
import { createPoEController } from "@/lib/poe/controller";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceId, enabled } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID is required" },
        { status: 400 }
      );
    }

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Enabled must be a boolean" },
        { status: 400 }
      );
    }

    // Get PoE device
    const poeDevice = await getPoEDevice(deviceId);
    if (!poeDevice) {
      return NextResponse.json(
        { error: "PoE device not found" },
        { status: 404 }
      );
    }

    // Get PoE switch
    const poeSwitch = await getPoESwitch(poeDevice.switchId);
    if (!poeSwitch) {
      return NextResponse.json(
        { error: "PoE switch not found" },
        { status: 404 }
      );
    }

    // Create controller and toggle port
    const controller = createPoEController(poeSwitch.type, {
      ipAddress: poeSwitch.ipAddress,
      password: poeSwitch.password,
    });

    await controller.togglePort(poeDevice.portNumber, enabled);

    // Update device state in Firestore
    await updatePoEDevice(deviceId, {
      isEnabled: enabled,
      lastToggled: new Date(),
      isOnline: true,
    });

    // Update switch online status
    await updatePoESwitch(poeDevice.switchId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    return NextResponse.json({
      success: true,
      deviceId,
      enabled,
      portNumber: poeDevice.portNumber,
    });

  } catch (error) {
    console.error("PoE toggle error:", error);

    // Mark switch as offline if it's a timeout/connection error
    const errorMessage = error instanceof Error ? error.message : "Failed to toggle PoE device";
    if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT") || errorMessage.includes("ECONNREFUSED")) {
      try {
        const poeDevice = await getPoEDevice(deviceId);
        if (poeDevice) {
          await updatePoESwitch(poeDevice.switchId, {
            isOnline: false,
          });
        }
      } catch (updateError) {
        console.error("Failed to update switch offline status:", updateError);
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
