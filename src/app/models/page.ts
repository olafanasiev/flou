import { PageItem } from './page-item';

export interface Page {
    x: number;
    y: number;
    title: string;
    items: PageItem[];
}
