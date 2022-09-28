import { Incident } from "@prisma/client";
import { Err, Result } from "oxide.ts";
import { prisma } from "../../../shared/database";
import { ToCreate } from "../../../shared/utils/types";
import { IncidentRepository } from "../../domain";

class IncidentPrismaRepository implements IncidentRepository {
  async createIncident(incident: ToCreate<Incident>): Promise<Result<Incident, Error>> {
    const monitor = await prisma.monitor.findFirst({ where: { id: incident.monitorId } });

    if (!monitor) {
      return Err(new Error("Monitor not exists"));
    }

    return Result(await prisma.incident.create({ data: incident }));
  }
}

export const incidentPrismaRepository = new IncidentPrismaRepository();
