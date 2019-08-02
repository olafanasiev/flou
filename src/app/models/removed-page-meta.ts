import {Page} from "./page";
import {ConnectionMeta} from "./connection-meta";

export interface RemovedPageMeta {
  page: Page;
  inputConnections: ConnectionMeta[];
}
