import { Incident } from "@prisma/client";

export function getBeatIncidentTemplate(incident: Incident) {
  const template: any = {
    text: "A new incident occurred in `" + incident.monitor_name + "`",
    attachments: [
      {
        color: incident.active ? "#a31c2c" : "#59c427",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: incident.monitor_name + " incident",
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: "*Title*\n" + incident.title,
              },
              {
                type: "mrkdwn",
                text: "*Description*\n" + incident.description,
              },
              {
                type: "mrkdwn",
                text: "*URL*\n" + incident.monitor_url,
              },
            ],
          },
        ],
      },
    ],
  };

  if (!incident.active) {
    template.attachments[0].blocks[1].fields.push({
      type: "mrkdwn",
      text: "*Duration*\n" + incident.duration + " seconds",
    });
  }

  if (incident.screenshot_url) {
    template.attachments[0].blocks.push({
      type: "image",
      image_url: "https://i.postimg.cc/2SJzRpj9/c126e66a-fbd4-4c55-8427-9ef645222934.png",
      alt_text: "incident",
    });
  }

  return template;
}
