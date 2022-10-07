import { Monitor } from "@prisma/client";
import debug from "debug";
import { prisma } from "../modules/shared/database";
import { ToCreate } from "../modules/shared/utils/types";

const logger = debug("dates:fakeDates");

const fakeMonitors: ToCreate<Monitor>[] = [
  {
    name: "riqra",
    type: "http",
    url: "https://staging.riqra.com/",
    headers: null,
    body: null,
    method: "GET",
    interval: 20000,
    maxretries: 3,
    retryInterval: 1000,
    active: true,
    accepted_statuscodes: "0-204,404",
  },
  //{
    //name: "shopping cart",
    //type: "http",
    //url: "https://shopping-cart-apollo-production.up.railway.app/",
    //headers: null,
    //body: null,
    //method: "GET",
    //interval: 5000,
    //retryInterval: 1000,
    //maxretries: 3,
    //active: true,
    //accepted_statuscodes: "0-204,404",
  //},
];

export const generateMonitorsData = async () => {
  logger("starting generate monitors");

  for (let monitor of fakeMonitors) {
    logger("creating", monitor.name);

    await prisma.monitor.create({ data: monitor });
  }
};
