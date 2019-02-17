export class ConnectionMeta {
    source: string;
    target: string;
    label: string = "new connection"
    constructor(source, target) {
        this.source = source;
        this.target = target;
    }
}
