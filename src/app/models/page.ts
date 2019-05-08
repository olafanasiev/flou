import { PageItem } from './page-item';

export interface Page {
    endpointId: string;
    width: number;
    x: number;
    y: number;
    title: string;
    items: PageItem[];
    isActive: boolean;
}
