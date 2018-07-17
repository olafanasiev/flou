import { PageItem } from './page-item';

export interface Page {
    htmlId: string;
    x: number;
    y: number;
    title: string;
    items: PageItem[];
}
