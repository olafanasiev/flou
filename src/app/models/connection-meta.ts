import {Strings} from "../shared/app.const";
import {LabelMeta} from "./label-meta";

export interface ConnectionMeta {
    sourceEndpointId: string,
    targetEndpointId: string,
    label: LabelMeta
}
