import {LabelMeta} from './label-meta';

export interface ConnectionMeta {
    id: string;
    sourceEndpointId: string;
    targetEndpointId: string;
    labelMeta: LabelMeta;
}
