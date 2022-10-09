import { Heartbeat, Monitor } from "@prisma/client";
import axios, { AxiosRequestConfig } from "axios";
import debug from "debug";
import dayjs from "dayjs";
import colors from "colors";

import { prisma } from "../shared/database";
import { heartbeatEvent } from "../shared/events/heartbeatEvent";
import { HeartbeatStatus } from "../shared/utils/constants";
import { ToCreate } from "../shared/utils/types";

colors.enable();

const logger = debug("api:modules:heartbeat:HeartbeatLoop");

export class HeartbeatLoop {
  static init() {
    heartbeatEvent.initializeNewBeatLoopSubject.subscribe((monitor) => new HeartbeatLoop(monitor));
  }

  public previusBeat: Heartbeat | undefined | null;

  public retries: number = 0;

  constructor(private monitor: Monitor) {
    logger(`[Monitor: "${this.monitor.name}"] New HeartbeatLoop created`);

    this.start();
  }

  async start() {
    this.previusBeat = await prisma.heartbeat.findFirst({ where: { monitorId: this.monitor.id } });

    this.loop();
  }

  async loop() {
    logger(
      `[Monitor: "${this.monitor.name}"]`.black.bgYellow,
      `Trying to create a heartbeat, attempt ${this.retries}`
    );

    const beat = this.getInitialBeat();

    const startTime = dayjs().valueOf();

    try {
      const response = await this.runHttpRequest();

      beat.message = `${response.status} ${response.statusText}`;

      beat.ping = dayjs().valueOf() - startTime;

      beat.status = HeartbeatStatus.UP;

      logger(
        `[Monitor: "${this.monitor.name}"] Status`,
        `[${beat.message}]`.black.bgGreen,
        "successfully obtained with a ping of",
        `${beat.ping}ms`.black.bgGreen
      );
    } catch (error: any) {
      if (this.retries < this.monitor.maxretries) {
        const ping = dayjs().valueOf() - startTime;

        logger(
          `[Monitor: "${this.monitor.name}"] Status`,
          `[${error?.response?.status} ${error?.response?.statusText}]`.black.bgRed,
          "fail obtained with a ping of",
          `${ping}ms`.black.bgRed
        );

        this.retries += 1;

        setTimeout(() => this.loop(), 2000);

        return;
      } else {
        beat.message = error?.message;

        beat.status = HeartbeatStatus.DOWN;
      }
    }

    let beatCreated;

    if (this.previusBeat) {
      beatCreated = await prisma.heartbeat.update({
        where: { id: this.previusBeat.id },
        data: beat,
      });
    } else {
      beatCreated = await prisma.heartbeat.create({ data: beat });
    }

    heartbeatEvent.hearbeatCreated(beatCreated, this.previusBeat ?? undefined);

    this.previusBeat = beatCreated;

    this.retries = 0;

    logger(
      `[Monitor: "${this.monitor.name}"]`.black.bgBlue,
      "Heartbeat created with",
      beatCreated.status === HeartbeatStatus.DOWN
        ? beatCreated.status.toUpperCase().black.bgRed
        : beatCreated.status.toUpperCase().black.bgGreen,
      `status and id ${beatCreated.id}`
    );

    setTimeout(() => this.loop(), this.monitor.interval);
  }

  getInitialBeat() {
    let beat: ToCreate<Heartbeat> = {
      monitorId: this.monitor.id,
      status: HeartbeatStatus.DOWN,
      message: null,
      ping: 0,
      duration: 0,
    };

    if (this.previusBeat?.duration) {
      beat.duration = dayjs().diff(dayjs(this.previusBeat.createdAt), "second");
    } else {
      beat.duration = 0;
    }

    return beat;
  }

  async runHttpRequest() {
    const options: AxiosRequestConfig = {
      url: this.monitor.url,
      method: (this.monitor.method || "get").toLowerCase(),
      ...(this.monitor.body ? { data: JSON.parse(this.monitor.body) } : {}),
      timeout: this.monitor.interval * 1000 * 0.8,
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "User-Agent": "StatusAgain/" + "0.1",
        ...(this.monitor.headers ? JSON.parse(this.monitor.headers) : {}),
      },
      validateStatus: (status) => {
        return checkStatusCode(status, this.monitor.accepted_statuscodes.split(";"));
      },
    };

    return axios.request(options);
  }
}

function checkStatusCode(status: number, acceptedCodes: string[]) {
  if (!Array.isArray(acceptedCodes)) {
    return false;
  }

  for (const acceptedCode of acceptedCodes) {
    const codeRange = acceptedCode.split("-").map((code) => parseInt(code));
    if (codeRange.length === 1) {
      if (status === codeRange[0]) {
        return true;
      }
    } else if (codeRange.length === 2) {
      if (status >= codeRange[0] && status <= codeRange[1]) {
        return true;
      }
    } else {
      throw new Error("Invalid status code range");
    }
  }

  return false;
}
