import { Connection } from "./connection";
import { Page } from "./page";

export interface PageItem {
    type: string;
    title: string;
    position: number;
    htmlId: string;
    outputConnections: Connection[];
    page: Page;
}
