import { Monitor } from "@prisma/client";
import debug from "debug";
import { prisma } from "../modules/shared/database";
import { ToCreate } from "../modules/shared/utils/types";

const logger = debug("dates:fakeDates");

const fakeMonitors: ToCreate<Monitor>[] = [
  {
    name: "riqra upgrade to next",
    type: "http",
    url: "https://storefront-upgrade-next-u8rgdf.herokuapp.com/",
    headers: null,
    body: null,
    method: "GET",
    interval: 4000,
    maxretries: 3,
    retryInterval: 4000,
    active: true,
    accepted_statuscodes: "0-204,404",
  },
  {
    name: "riqra staging",
    type: "http",
    url: "https://storefront-upgrade-next-u8rgdf.herokuapp.com/",
    headers: null,
    body: null,
    method: "GET",
    interval: 10000,
    retryInterval: 1000,
    maxretries: 3,
    active: true,
    accepted_statuscodes: "0-204,404",
  },
];

export const generateMonitorsData = async () => {
  logger("starting generate monitors");

  logger("delete all monitors");

  await prisma.monitor.deleteMany();

  for (let monitor of fakeMonitors) {
    logger("creating", monitor.name);

    await prisma.monitor.create({ data: monitor });
  }
};
