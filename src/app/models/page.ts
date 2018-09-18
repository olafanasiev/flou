import { PageItem } from './page-item';
import { Connection } from './connection';

export interface Page {
    htmlId: string;
    width: number;
    x: number;
    y: number;
    title: string;
    items: PageItem[];
    isActive: boolean;
    inputConnections: Connection[];
}
