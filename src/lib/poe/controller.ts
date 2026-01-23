/**
 * PoE Switch Controller Library
 * Handles communication with PoE switches to control port power
 */

import crypto from 'crypto';

export interface PoESwitchCredentials {
  ipAddress: string;
  password: string;
}

export interface PoEPortConfig {
  portNumber: number; // Physical port 1-8
  enabled: boolean;
}

/**
 * MD5 hash function
 */
function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Merge two strings by interleaving characters (from login.js)
 * Used for Netgear switch password encryption
 */
function merge(str1: string, str2: string): string {
  const arr1 = str1.split('');
  const arr2 = str2.split('');
  let result = '';
  let index1 = 0;
  let index2 = 0;

  while (index1 < arr1.length || index2 < arr2.length) {
    if (index1 < arr1.length) {
      result += arr1[index1];
      index1++;
    }
    if (index2 < arr2.length) {
      result += arr2[index2];
      index2++;
    }
  }

  return result;
}

/**
 * Netgear GS308EP Controller
 */
export class NetgearGS308EPController {
  private ipAddress: string;
  private password: string;

  constructor(credentials: PoESwitchCredentials) {
    this.ipAddress = credentials.ipAddress;
    this.password = credentials.password;
  }

  /**
   * Get the rand value from the login page
   */
  private async getRandValue(): Promise<string> {
    const response = await fetch(`http://${this.ipAddress}/login.cgi`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch login page: ${response.status}`);
    }

    const html = await response.text();

    // Extract rand from HTML: <input type=hidden id='rand' value='374961091' disabled>
    const randMatch = html.match(/id='rand'\s+value='([^']+)'/);
    if (!randMatch) {
      throw new Error('Rand value not found in login page');
    }

    return randMatch[1];
  }

  /**
   * Login to the switch and get SID cookie
   */
  private async login(): Promise<string> {
    // Get rand value
    const rand = await this.getRandValue();

    // Merge password with rand, then hash
    const merged = merge(this.password, rand);
    const hashedPassword = md5(merged);

    const response = await fetch(`http://${this.ipAddress}/login.cgi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': `http://${this.ipAddress}`,
        'Referer': `http://${this.ipAddress}/login.cgi`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      body: `password=${hashedPassword}`,
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    // Extract SID cookie
    const cookies = response.headers.get('set-cookie');
    if (!cookies) {
      throw new Error('No cookies received from login');
    }

    const sidMatch = cookies.match(/SID=([^;]+)/);
    if (!sidMatch) {
      throw new Error('SID cookie not found');
    }

    return `SID=${sidMatch[1]}`;
  }

  /**
   * Get hash token from PoE config page
   */
  private async getHashToken(sidCookie: string): Promise<string> {
    const response = await fetch(`http://${this.ipAddress}/PoEPortConfig.cgi`, {
      method: 'GET',
      headers: {
        'Cookie': sidCookie,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get PoE config page: ${response.status}`);
    }

    const html = await response.text();

    // Extract hash from HTML: <input type=hidden name='hash' id='hash' value="...">
    const hashMatch = html.match(/name='hash'[^>]*value="([^"]+)"/);
    if (!hashMatch) {
      throw new Error('Hash token not found in HTML');
    }

    return hashMatch[1];
  }

  /**
   * Toggle a PoE port on or off
   */
  async togglePort(portNumber: number, enabled: boolean): Promise<void> {
    // Validate port number
    if (portNumber < 1 || portNumber > 8) {
      throw new Error(`Invalid port number: ${portNumber}. Must be 1-8.`);
    }

    // Login to get SID cookie
    const sidCookie = await this.login();

    // Get hash token
    const hash = await this.getHashToken(sidCookie);

    // Port number is 0-indexed in the API (physical port 1 = portID 0)
    const portID = portNumber - 1;

    // Build form data
    const formData = new URLSearchParams({
      hash: hash,
      ACTION: 'Apply',
      portID: portID.toString(),
      ADMIN_MODE: enabled ? '1' : '0', // 1 = Enable, 0 = Disable
      PORT_PRIO: '0',
      POW_MOD: '3',
      POW_LIMT_TYP: '2',
      POW_LIMT: '30.0',
      DETEC_TYP: '2',
      DISCONNECT_TYP: '2',
    });

    const response = await fetch(`http://${this.ipAddress}/PoEPortConfig.cgi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': sidCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to toggle port: ${response.status}`);
    }
  }

  /**
   * Enable a PoE port
   */
  async enablePort(portNumber: number): Promise<void> {
    return this.togglePort(portNumber, true);
  }

  /**
   * Disable a PoE port
   */
  async disablePort(portNumber: number): Promise<void> {
    return this.togglePort(portNumber, false);
  }

  /**
   * Get status of all PoE ports
   */
  async getPortStatuses(): Promise<Array<{ port: number; enabled: boolean }>> {
    // Login to get SID cookie
    const sidCookie = await this.login();

    // Get PoE config page
    const response = await fetch(`http://${this.ipAddress}/PoEPortConfig.cgi`, {
      method: 'GET',
      headers: {
        'Cookie': sidCookie,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get PoE config page: ${response.status}`);
    }

    const html = await response.text();

    // Parse HTML to extract port statuses
    // Look for patterns like: <input type="hidden" class="port" value="2"> and <input type="hidden" class="hidPortPwr" id="hidPortPwr" value="0">
    const portStatuses: Array<{ port: number; enabled: boolean }> = [];

    // Find all port list items
    const portMatches = html.matchAll(/<li class="poe_port_list_item[^>]*>[\s\S]*?<input type="hidden" class="port" value="(\d+)"[\s\S]*?<input type="hidden" class="hidPortPwr"[^>]*value="(\d+)"/g);

    for (const match of portMatches) {
      const portNumber = parseInt(match[1]);
      const enabled = match[2] === '1'; // 1 = enabled, 0 = disabled

      portStatuses.push({
        port: portNumber,
        enabled: enabled,
      });
    }

    // Sort by port number
    portStatuses.sort((a, b) => a.port - b.port);

    return portStatuses;
  }

  /**
   * Get status of a specific port
   */
  async getPortStatus(portNumber: number): Promise<boolean> {
    const statuses = await this.getPortStatuses();
    const portStatus = statuses.find(s => s.port === portNumber);
    if (!portStatus) {
      throw new Error(`Port ${portNumber} not found`);
    }
    return portStatus.enabled;
  }

  /**
   * Test connection to the switch
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getRandValue();
      return true;
    } catch (error) {
      console.error('Switch connection test failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create a controller for any PoE switch type
 */
export function createPoEController(type: string, credentials: PoESwitchCredentials) {
  switch (type) {
    case 'netgear_gs308ep':
      return new NetgearGS308EPController(credentials);
    default:
      throw new Error(`Unsupported PoE switch type: ${type}`);
  }
}
