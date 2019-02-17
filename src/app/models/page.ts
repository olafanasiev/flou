import { PageItem } from './page-item';
import { ConnectionMeta } from './connectionMeta';

export interface Page {
    htmlId: string;
    width: number;
    x: number;
    y: number;
    title: string;
    items: PageItem[];
    isActive: boolean;
    inputConnections: ConnectionMeta[];
}
