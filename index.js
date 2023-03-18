const fs = require("fs");
var axios = require("axios");
const path = require("path");

function removeCommasFromStrings(obj) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].replace(/,/g, "");
    }
  }
  return obj;
}

function appendToCSV(filePath, data) {
  const directory = path.dirname(filePath);
  const csvRow = Object.values(data).join(",");
  const csvData = `${csvRow}\n`;

  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(filePath)) {
    // file does not exist, so append headers along with data
    const csvHeaders = Object.keys(data).join(",");
    const csvHeaderRow = `${csvHeaders}\n${csvData}`;

    fs.writeFileSync(filePath, csvHeaderRow);
  } else {
    // file exists, so only append data
    fs.appendFileSync(filePath, csvData);
  }

  console.log(`Successfully appended to CSV file at ${filePath}`);
}

function getData(eventNumber) {
  const eventSpecificPath = `./data/${eventNumber}-event-specific.csv`;
  const outbreakSpecificPath = `./data/${eventNumber}-outbreak-specific.csv`;
  var config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://wahis.woah.org/api/v1/pi/review/event/${eventNumber}/all-information?language=en`,
    headers: {
      authority: "wahis.woah.org",
      accept: "application/json",
      "accept-language": "en",
      "access-control-allow-headers":
        "X-Requested-With, Content-Type, Origin, Authorization, Accept,Client-Security-Token, Accept-Encoding, accept-language, type, authorizationToken, methodArn",
      "access-control-allow-methods": "POST, GET, OPTIONS, DELETE, PUT",
      "access-control-allow-origin": "*",
      authorizationtoken: "",
      "cache-control": "no-cache",
      clientid: "OIEwebsite",
      "content-type": "application/json",
      dnt: "1",
      env: "PRD",
      expires: "Sat, 01 Jan 2000 00:00:00 GMT",
      pragma: "no-cache",
      referer: "https://wahis.woah.org/",
      "sec-ch-ua":
        '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "security-token": "",
      token: "#PIPRD202006#",
      type: "REQUEST",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      userid: "",
      "x-content-type-options": "nosniff",
      "x-frame-options": "sameorigin",
    },
  };

  axios(config)
    .then(function (response) {
      report = response.data;

      // outbreak specific data
      getOutbreakData(outbreakSpecificPath, report.outbreaks);

      console.log("====================================");
      // event specific data
      country = report.event.country.name;

      const [wildData, domesticData] = getQuantitativeData(
        report.quantitativeData.totals
      );

      // Inside getData function
      if (wildData) {
        const cleanedWildData = removeCommasFromStrings({
          ...wildData,
          country,
          eventID: eventNumber,
        });

        appendToCSV(eventSpecificPath, cleanedWildData);
      }

      if (domesticData) {
        const cleanedDomesticData = removeCommasFromStrings({
          ...domesticData,
          country,
          eventID: eventNumber,
        });
        appendToCSV(eventSpecificPath, cleanedDomesticData);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

function getOutbreakData(path, outbreaks) {
  for (let i = 0; i < outbreaks.length; i++) {
    curr = outbreaks[i];
    location = curr.location.replace(/,/g, "");
    longitude = curr.longitude;
    latitude = curr.latitude;
    start = new Date(curr.startDate).toLocaleDateString("en-US");
    end = new Date(curr.endDate).toLocaleDateString("en-US");
    epiUnit = curr.epiUnitType;

    // Inside getOutbreakData function
    const data = {
      ...curr,
      location,
      longitude,
      latitude,
      start,
      end,
      epiUnit,
      eventID: eventNumber, // Add the event ID here
    };
    const cleanedData = removeCommasFromStrings(data);
    appendToCSV(path, cleanedData);
  }
}

function getQuantitativeData(quantitativeData) {
  let wildData = { isWild: "wild" };
  let domesticData = { isWild: "domestic" };

  for (let i = 0; i < quantitativeData.length; i++) {
    curr = quantitativeData[i];
    const dataObj = {
      ...curr,
      species: curr.speciesName,
      deaths: curr.deaths,
      cases: curr.cases,
      // Add any other required parameters here
    };

    if (curr.isWild) {
      wildData = { ...dataOb, ...wildData };
    } else {
      domesticData = { ...dataObj, ...domesticData };
    }
  }

  return [
    wildData.species ? wildData : null,
    domesticData.species ? domesticData : null,
  ];
}

async function makeRequest() {
  for (let i = 0; i < 5; i++) {
    var data = JSON.stringify({
      eventIds: [],
      reportIds: [],
      countries: [],
      firstDiseases: [],
      secondDiseases: [558, 557, 560, 889, 559],
      typeStatuses: [],
      reasons: [],
      eventStatuses: [],
      reportTypes: [],
      reportStatuses: [],
      eventStartDate: {
        from: "2020-12-31T16:00:00.000Z",
        to: "2022-12-31T15:59:59.000Z",
      },
      submissionDate: null,
      animalTypes: [],
      sortColumn: null,
      sortOrder: null,
      pageSize: 100,
      pageNumber: i,
    });

    console.log("On loop...", i);

    var config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://wahis.woah.org/api/v1/pi/event/filtered-list?language=en",
      headers: {
        authority: "wahis.woah.org",
        accept: "application/json",
        "accept-language": "en",
        "access-control-allow-headers":
          "X-Requested-With, Content-Type, Origin, Authorization, Accept,Client-Security-Token, Accept-Encoding, accept-language, type, authorizationToken, methodArn",
        "access-control-allow-methods": "POST, GET, OPTIONS, DELETE, PUT",
        "access-control-allow-origin": "*",
        authorizationtoken: "",
        "cache-control": "no-cache",
        clientid: "OIEwebsite",
        "content-type": "application/json",
        dnt: "1",
        env: "PRD",
        expires: "Sat, 01 Jan 2000 00:00:00 GMT",
        origin: "https://wahis.woah.org",
        pragma: "no-cache",
        referer: "https://wahis.woah.org/",
        "sec-ch-ua":
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "sec-gpc": "1",
        "security-token": "",
        token: "#PIPRD202006#",
        type: "REQUEST",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        userid: "",
        "x-content-type-options": "nosniff",
        "x-frame-options": "sameorigin",
      },
      data: data,
    };
    await axios(config)
      .then(function (response) {
        responseData = response.data;
        listOfEvents = responseData.list;
        console.log(listOfEvents);
        listOfEvents.map((obj) => {
          reportId = obj.reportId;
          eventId = obj.eventId;
          subType = obj.subType;
          console.log("eventId", eventId);
          // Write to a CSV file
          fs.appendFile(
            "data.csv",
            `${eventId}, ${reportId}, ${subType} \n`,
            (err) => {
              if (err) throw err;
              console.log("Data added to CSV file successfully!");
            }
          );
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}

function readCSV() {
  fs.readFile("data.csv", "utf8", (err, data) => {
    if (err) throw err;
    const rows = data
      .trim()
      .split("\n")
      .map((row) => row.split(","));
    // const headers = rows.shift();
    for (let i = 0; i < 5; i++) {
      row = rows[i];
      const eventId = row[0];
      console.log(eventId);
      getData(eventId);
    }
  });
}

// Generates the CSV
// makeRequest();

// Reads the CSV
readCSV();
