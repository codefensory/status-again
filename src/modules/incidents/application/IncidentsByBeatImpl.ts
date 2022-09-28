import fs from "fs";
import { Heartbeat, Incident } from "@prisma/client";
import { filter } from "rxjs";
import { heartbeatEvent } from "../../shared/events";
import { HeartbeatStatus, IncidentTypes } from "../../shared/utils/constants";
import puppeter from "puppeteer";
import { prisma } from "../../shared/database";
import { ToCreate } from "../../shared/utils/types";
import { v4 as uuidV4 } from "uuid";
import dayjs from "dayjs";
import debug from "debug";

const logger = debug("api:modules:incidents:IncidentsImpl");

type IncidentByMonitor = {
  [key: string]: {
    currentIncident: Incident | null;
    verifingUp: boolean;
  };
};

export class IncidentsByBeatImpl {
  incidentsByMonitor: IncidentByMonitor = {};

  async init() {
    logger("Incidents system started");

    const activeIncidents = await prisma.incident.findMany({
      where: { active: true },
    });

    for (let incident of activeIncidents) {
      logger(`[${incident.title}] Use as current incident`);

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

  private async closeIncident(beat: Heartbeat) {
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

        logger(
          `[${incident.currentIncident.title}] Incident closed in ${duration} seconds`
        );

        incident.verifingUp = false;

        incident.currentIncident = null;
      } else {
        logger(`[${incident.currentIncident.title}] Verifing`);
        incident.verifingUp = true;
      }
    }
  }

  private async createDownIncident(beat: Heartbeat) {
    const incident = this.incidentsByMonitor[beat.monitorId ?? -1];

    if (incident?.currentIncident) {
      if (incident.verifingUp) {
        incident.verifingUp = false;

        logger(`[Incident: ${incident.currentIncident.title}] Verify fail`);
      }
      return;
    }

    logger(`[MonitorId: ${beat.monitorId}] Trying to create incident`);

    const monitor = await prisma.monitor.findFirst({
      where: {
        id: beat.monitorId ?? -1,
      },
    });

    if (monitor) {
      const incidentToCreate: ToCreate<Incident> = {
        type: IncidentTypes.PAGE_DOWN,
        active: true,
        duration: null,
        title: monitor.name + " monitor is DOWN",
        description: beat.message,
        screenshot_url: null,
        monitorId: monitor.id,
      };

      const incident = await prisma.incident.create({ data: incidentToCreate });

      logger(`[${incident.title}] Incident created`);

      this.incidentsByMonitor[monitor.id] = {
        currentIncident: incident,
        verifingUp: false,
      };

      this.takePageScreenshot(monitor.url, incident.id);
    } else {
      logger(`[MonitorId: ${beat.monitorId}] monitor not found`);
    }
  }

  private async takePageScreenshot(url: string, incidentId: number) {
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

        const folder = "./public/screenshots/";

        const screenshot_url = folder + uuidV4() + ".png";

        if (!fs.existsSync(folder)) {
          fs.mkdirSync(folder, { recursive: true });
        }

        await page.screenshot({ path: screenshot_url });

        await browser.close();

        await prisma.incident.update({
          where: { id: incidentId },
          data: { screenshot_url },
        });

        logger(`[${url}] Screenshot created`);
      });
  }
}
