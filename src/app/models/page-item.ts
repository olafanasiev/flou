import { ConnectionMeta } from "./connection-meta";

export interface PageItem {
    type: string;
    title: string;
    endpointId: string;
    created: number;
    connectionMeta: ConnectionMeta[];
}
