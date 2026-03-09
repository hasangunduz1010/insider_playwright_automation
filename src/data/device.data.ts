// Device.ts

export class Device {
    private static readonly _values: Device[] = [];

    static readonly ALL = new Device(0, "All");
    static readonly DESKTOP = new Device(1, "Desktop");
    static readonly MOBILE = new Device(2, "Mobile");
    static readonly TABLET = new Device(3, "Tablet");
    static readonly MOBILE_APP = new Device(4, "MobileApp");

    private constructor(
        private readonly value: number,
        private readonly deviceName: string
    ) {
        Device._values.push(this);
    }

    /** Get Device by numeric value */
    static getDevice(value: number): Device | null {
        return Device._values.find(d => d.value === value) ?? null;
    }

    /** Return numeric value as string (like Java toString) */
    toString(): string {
        return String(this.value);
    }

    /** Get numeric value */
    getValue(): number {
        return this.value;
    }

    /** Get human-readable device name */
    getDeviceName(): string {
        return this.deviceName;
    }

    /** Get all enum-like values */
    static values(): Device[] {
        return [...Device._values];
    }

    /** Get all device names */
    static names(): string[] {
        return Device._values.map(d => d.deviceName);
    }
}
