import { ConnectionMeta } from "./connectionMeta";

export interface PageItem {
    type: string;
    title: string;
    position: number;
    htmlId: string;
    created: number;
    outputConnections: ConnectionMeta[];
}
