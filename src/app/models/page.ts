import { PageItem } from './page-item';
import { ConnectionMeta } from './connection-meta';

export interface Page {
    endpointId: string,
    width: number,
    x: number,
    y: number,
    title: string,
    items: PageItem[],
    isActive: boolean,
}
