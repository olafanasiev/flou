import { Connection } from "./connection";

export interface PageItem {
    type: string;
    title: string;
    position: number;
    htmlId: string;
    outputConnections: Connection[];
}
