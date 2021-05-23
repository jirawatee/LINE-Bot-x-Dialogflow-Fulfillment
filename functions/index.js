"use strict";

const { WebhookClient, Payload } = require("dialogflow-fulfillment");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const region = "asia-northeast1";
const runtimeOpts = {timeoutSeconds: 8, memory: "1GB", minInstances: 1};

exports.fulfillment = functions.region(region).runWith(runtimeOpts).https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });

  functions.logger.debug(`HEADERS: ${JSON.stringify(request.headers)}`);
  functions.logger.debug(`BODY: ${JSON.stringify(request.body)}`);

  async function bodyMassIndex(agent) {
    const weight = agent.parameters.weight;
    const height = agent.parameters.height / 100;
    const bmi = (weight / (height * height)).toFixed(2);

    let result = "none";
    let pkgId = "1";
    let stkId = "1";

    if (bmi < 18.5) {
      pkgId = "11538";
      stkId = "51626519";
      result = "xs";
    } else if (bmi >= 18.5 && bmi < 23) {
      pkgId = "11537";
      stkId = "52002741";
      result = "s";
    } else if (bmi >= 23 && bmi < 25) {
      pkgId = "11537";
      stkId = "52002745";
      result = "m";
    } else if (bmi >= 25 && bmi < 30) {
      pkgId = "11537";
      stkId = "52002762";
      result = "l";
    } else if (bmi >= 30) {
      pkgId = "11538";
      stkId = "51626513";
      result = "xl";
    }

    const payloadJson = {
      "type": "sticker",
      "packageId": pkgId,
      "stickerId": stkId
    };

    const payload = new Payload(agent.LINE, payloadJson, { sendAsMessage: true, rawPayload: false });

    const doc = await admin.firestore().collection("bmi").doc(result).get();
    agent.add(doc.data().description);
    agent.add(payload);

    /* const snapshot = await admin.database().ref("bmi").child(result).once("value");
    agent.add(snapshot.val());
    agent.add(payload); */
  }

  const intentMap = new Map();
  intentMap.set("BMI - custom - yes", bodyMassIndex);
  agent.handleRequest(intentMap);
});
