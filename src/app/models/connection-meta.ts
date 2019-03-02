import {Strings} from "../shared/app.const";
import EMPTY = Strings.EMPTY;

export interface ConnectionMeta {
    sourceEndpointId: string,
    targetEndpointId: string,
    label: string
}
