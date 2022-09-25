import { Heartbeat, Incident } from "@prisma/client";
import { filter } from "rxjs";
import { heartbeatEvent } from "../shared/events";
import { HeartbeatStatus, IncidentTypes } from "../shared/utils/constants";
import puppeter from "puppeteer";
import { prisma } from "../shared/database";
import { ToCreate } from "../shared/utils/types";
import { v4 as uuidV4 } from "uuid";
import dayjs from "dayjs";

type IncidentByMonitor = {
  [key: string]: {
    currentIncident: Incident | null;
    verifingUp: boolean;
  };
};

export class IncidentsImpl {
  static incidentsByMonitor: IncidentByMonitor;

  static async init() {
    const activeIncidents = await prisma.incident.findMany({
      where: { active: true },
    });

    for (let incident of activeIncidents) {
      this.incidentsByMonitor[incident.monitorId] = {
        currentIncident: incident,
        verifingUp: false,
      };
    }

    heartbeatEvent.hearbeatCreatedSubject
      .pipe(
        filter(
          (heartbeat) =>
            heartbeat.beat.status === HeartbeatStatus.DOWN &&
            heartbeat.previusBeat?.status === HeartbeatStatus.UP
        )
      )
      .subscribe(({ beat }) => this.createDownIncident(beat));

    heartbeatEvent.hearbeatCreatedSubject
      .pipe(filter((heartbeat) => heartbeat.beat.status === HeartbeatStatus.UP))
      .subscribe((heartbeat) => this.closeIncident(heartbeat.beat));
  }

  private static async closeIncident(beat: Heartbeat) {
    const incident = this.incidentsByMonitor[beat.monitorId ?? -1];

    if (incident?.currentIncident) {
      if (incident.verifingUp) {
        const duration = dayjs().diff(
          dayjs(incident.currentIncident.createdAt),
          "second"
        );

        await prisma.incident.update({
          where: { id: incident.currentIncident.id },
          data: {
            active: false,
            duration,
          },
        });

        incident.verifingUp = false;

        incident.currentIncident = null;
      } else {
        incident.verifingUp = true;
      }
    }
  }

  private static async createDownIncident(beat: Heartbeat) {
    const type = IncidentTypes.PAGE_DOWN;
    const title = "Page down";

    const monitor = await prisma.monitor.findFirst({
      where: {
        id: beat.monitorId ?? -1,
      },
    });

    if (monitor) {
      const incidentToCreate: ToCreate<Incident> = {
        type,
        active: true,
        duration: null,
        title,
        heartbeatId: beat.id,
        screenshot_url: null,
        monitorId: monitor.id,
      };

      const incident = await prisma.incident.create({ data: incidentToCreate });

      this.incidentsByMonitor[monitor.id] = {
        currentIncident: incident,
        verifingUp: false,
      };

      this.takePageScreenshot(monitor.url, incident.id);
    }
  }

  private static async takePageScreenshot(url: string, incidentId: number) {
    return puppeter
      .launch({
        defaultViewport: {
          width: 1366,
          height: 768,
        },
      })
      .then(async (browser) => {
        const page = await browser.newPage();
        await page.goto(url);

        const screenshot_url = "./" + uuidV4() + ".png";

        await page.screenshot({ path: screenshot_url });
        await browser.close();

        await prisma.incident.update({
          where: { id: incidentId },
          data: { screenshot_url },
        });
      });
  }
}
