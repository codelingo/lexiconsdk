export class KeyManager {
    trunk: number;
    num: number;

    constructor(trunkKey: string) {
        const parts = trunkKey.split("_").filter((item) => item.length > 0);
        switch (parts.length) {
            case 2:
                this.trunk = parseInt(parts[0]);
                this.num = parseInt(parts[1]);
                break;

            case 1:
                this.trunk = parseInt(parts[0]);
                this.num = 0;
                break;

            default:
                throw new Error(`invalid trunk key format: ${trunkKey}`);
        }
    }

    getKey(): string {
        this.num++;
        return `${this.trunk}_${this.num}`;
    }
}
