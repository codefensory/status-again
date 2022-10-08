import { Incident } from "@prisma/client";

export function getBeatIncidentTemplate(incident: Incident) {
  const template: any = {
    text: "New incident created",
    attachments: [
      {
        color: "#a31c2c",
        blocks: [
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
            ],
          },
        ],
      },
    ],
  };

  if (!incident.active) {
    template.attachments[0].blocks[0].fields.push({
      type: "mrkdwn",
      text: "*Duration*\n" + incident.duration + " seconds",
    });

    template.attachments[0].color = "#59c427";
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
