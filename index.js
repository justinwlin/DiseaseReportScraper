const fs = require("fs");
var axios = require("axios");
const path = require("path");

const eventSpecificPath = `./data/events.csv`;
const outbreakSpecificPath = `./data/outbreaks.csv`;

function removeCommasFromStrings(obj) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].replace(/,/g, "").replace(/\n|\r/g, "");
    }
  }
  return obj;
}

function appendToCSV(csvPath, data) {
  const directory = path.dirname(csvPath);
  const csvRow = Object.values(data).join(",");
  const csvData = `${csvRow}\n`;

  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(csvPath)) {
    // file does not exist, so append headers along with data
    const csvHeaders = Object.keys(data).join(",");
    const csvHeaderRow = `${csvHeaders}\n${csvData}`;

    fs.writeFileSync(csvPath, csvHeaderRow);
  } else {
    // file exists, so only append data
    fs.appendFileSync(csvPath, csvData);
  }

  // console.log(`Successfully appended to CSV file at ${csvPath}`);
}

async function getData(eventNumber) {
  // const eventSpecificPath = `./data/${eventNumber}-event-specific.csv`;
  // const outbreakSpecificPath = `./data/${eventNumber}-outbreak-specific.csv`;
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

  return await axios(config)
    .then(function (response) {
      report = response.data;

      // outbreak specific data
      getOutbreakData(outbreakSpecificPath, report.outbreaks, eventNumber);

      // console.log("====================================");
      // event specific data
      country = report.event.country.name;
      startDate = report.event.startedOn;
      endDate = report.event.endedOn;

      const cleanedDomesticData = removeCommasFromStrings({
        country,
        eventID: eventNumber,
        startDate,
        endDate,
      });
      appendToCSV(eventSpecificPath, cleanedDomesticData);
    })
    .catch(function (error) {
      console.log(error);
    });
}

async function getOutbreakData(path, outbreaks, eventNumber) {
  for (let i = 0; i < outbreaks.length; i++) {
    const curr = outbreaks[i];
    const outbreakId = curr.id;
    await getSpeciesData(eventNumber, outbreakId)
      .then((data) => {
        const [wild, domestic] = data;
        const location = curr.location.replace(/,/g, "");
        const longitude = curr.longitude;
        const latitude = curr.latitude;
        const start = new Date(curr.startDate).toLocaleDateString("en-US");
        const end = new Date(curr.endDate).toLocaleDateString("en-US");
        const epiUnit = curr.epiUnitType;

        // create row for wild data if species name is not empty
        if (wild.species.trim() !== "") {
          const wildData = {
            location,
            longitude,
            latitude,
            start,
            end,
            epiUnit,
            eventID: eventNumber,
            "animal type": "wild",
            ...wild,
          };
          const cleanedWildData = removeCommasFromStrings(wildData);
          // console.log("Cleaned wild data: ", cleanedWildData);
          appendToCSV(path, cleanedWildData, true);
        }

        // create row for domestic data if species name is not empty
        if (domestic.species.trim() !== "") {
          const domesticData = {
            location,
            longitude,
            latitude,
            start,
            end,
            epiUnit,
            eventID: eventNumber,
            "animal type": "domestic",
            ...domestic,
          };
          const cleanedDomesticData = removeCommasFromStrings(domesticData);
          // console.log("Cleaned domestic data: ", cleanedDomesticData);
          appendToCSV(path, cleanedDomesticData, true);
        }
      })
      .catch((err) => {
        console.log("Error for, ", eventNumber, outbreakId);
      });
  }
}

async function getSpeciesData(eventNumber, outbreakNumber) {
  try {
    const config = {
      method: "get",
      url: `https://wahis.woah.org/api/v1/pi/review/event/${eventNumber}/outbreak/${outbreakNumber}/all-information?language=en`,
      headers: {},
    };

    const response = await axios(config);
    const species = response.data.speciesQuantities;
    let wild_species = [];
    let domestic_species = [];
    let wild_death = 0;
    let domestic_death = 0;
    let wild_cases = 0;
    let domestic_cases = 0;

    // for each object in species, get the species name
    for (let i = 0; i < species.length; i++) {
      const curr = species[i].totalQuantities;
      const isWild = curr.isWild;
      const curr_name = curr.speciesName;
      const curr_death = curr.deaths;
      const curr_cases = curr.cases;

      if (isWild) {
        wild_species.push(curr_name);
        wild_death += curr_death;
        wild_cases += curr_cases;
      } else {
        domestic_species.push(curr_name);
        domestic_death += curr_death;
        domestic_cases += curr_cases;
      }
    }

    // create an object with wild data
    const wild_data = {
      outbreakNumber: outbreakNumber,
      species: wild_species.join(";"),
      death: wild_death,
      cases: wild_cases,
      "animal type": "wild",
    };

    // create an object with domestic data
    const domestic_data = {
      outbreakNumber: outbreakNumber,
      species: domestic_species.join(";"),
      death: domestic_death,
      cases: domestic_cases,
      "animal type": "domestic",
    };

    return [wild_data, domestic_data];
  } catch (error) {
    console.log("in get species data, error caught");
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

    // console.log("Curr data: ", curr);

    if (curr.isWild) {
      wildData = { ...dataObj, ...wildData };
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
        // console.log(listOfEvents);
        listOfEvents.map((obj) => {
          reportId = obj.reportId;
          eventId = obj.eventId;
          subType = obj.subType;
          // console.log("eventId", eventId);
          // Write to a CSV file
          fs.appendFile(
            "data.csv",
            `${eventId}, ${reportId}, ${subType} \n`,
            (err) => {
              if (err) throw err;
              // console.log("Data added to CSV file successfully!");
            }
          );
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}

async function readCSV() {
  fs.readFile("data.csv", "utf8", async (err, data) => {
    if (err) throw err;
    const rows = data
      .trim()
      .split("\n")
      .map((row) => row.split(","));
    // const headers = rows.shift();
    for (let i = 0; i < rows.length; i++) {
      row = rows[i];
      const eventId = row[0];
      console.log(eventId);
      await getData(eventId);
    }
  });
}

// Generates the CSV
// makeRequest();

// Reads the CSV
readCSV();
