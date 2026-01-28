import { NextRequest, NextResponse } from "next/server";
import type { AlgoAuthMethod } from "@/lib/algo/types";

interface PagingZoneRequest {
  ipAddress: string;
  password: string;
  authMethod: AlgoAuthMethod;
  zone: number; // 1-50
}

export async function POST(request: NextRequest) {
  try {
    const body: PagingZoneRequest = await request.json();
    const { ipAddress, password, authMethod, zone } = body;

    if (!ipAddress || !password || zone === undefined) {
      return NextResponse.json(
        { error: "ipAddress, password, and zone are required" },
        { status: 400 }
      );
    }

    if (zone < 1 || zone > 50) {
      return NextResponse.json(
        { error: "Zone must be between 1 and 50" },
        { status: 400 }
      );
    }

    // Build the form data for zone change
    // Based on the web interface POST to /control/shmcast.lua
    const formData = new URLSearchParams();

    // Keep device in transmitter mode (mode 1)
    formData.append("mcast.mode", "1");

    // Set the transmit zone
    formData.append("mcast.tx.fixed", String(zone));

    // Required fields from the web interface
    formData.append("mcast.polycom.mode", "0");
    formData.append("mcast.zones.exp", "0");
    formData.append("mcast.polycom.zone", "224.0.1.116:5001");
    formData.append("mcast.groups.select", "0");
    formData.append("mcast.polycom.default", "1");
    formData.append("mcast.zones.select", "0");
    formData.append("mcast.zones.tone", "Default");
    formData.append("mcast.dtmf.fixed", "0");
    formData.append("save", "Save");

    // Add all paging groups (enabled)
    for (let i = 1; i <= 25; i++) {
      formData.append(`pbgroup${i}`, "1");
    }

    // Add all transmit zones (enabled)
    for (let i = 10; i <= 50; i++) {
      formData.append(`txzone${i}`, "1");
    }

    // Add common receive zones
    formData.append("rxzone1", "1");
    formData.append("rxzone8", "1");
    formData.append("rxzone9", "1");

    // Add groups
    formData.append("group1", "1");
    formData.append("group24", "1");
    formData.append("group25", "1");

    // Make the request to the Algo device
    const algoUrl = `http://${ipAddress}/control/shmcast.lua`;

    console.log(`[Zone API] Changing zone to ${zone} for ${ipAddress}`);
    console.log(`[Zone API] Request URL: ${algoUrl}`);
    console.log(`[Zone API] Form data:`, formData.toString());

    // Create auth header
    const auth = Buffer.from(`admin:${password}`).toString('base64');

    const response = await fetch(algoUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${auth}`,
      },
      body: formData.toString(),
    });

    console.log(`[Zone API] Response status: ${response.status}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[Zone API] Error response:`, responseText);
      throw new Error(`Algo device returned ${response.status}: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log(`[Zone API] Success response:`, responseText.substring(0, 200));

    return NextResponse.json({
      success: true,
      ipAddress,
      zone,
      message: `Paging device set to transmit on zone ${zone}`,
    });
  } catch (error) {
    console.error("Paging zone control error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to change paging zone" },
      { status: 500 }
    );
  }
}
