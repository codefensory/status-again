import { Stat } from "../../domain";

export interface CreateAppcrashIncidentDTO {
  type: string;
  title: string;
  error: string;
  stats: Stat[];
  attempt: number;
  monitorId: number;
}
