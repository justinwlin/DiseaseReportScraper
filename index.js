const fs = require("fs");
var axios = require("axios");
const path = require("path");

const OUTPUT_PATH = `./data/data.csv`;

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

async function getData(eventNumber) {
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

  try {
    const response = await axios(config);
    report = response.data;
    // event specific data
    country = report.event.country.name;
    const event_obj_arr = getQuantitativeData(
      country,
      report.quantitativeData.totals
    );

    // loop through the event_obj_arr
    for (let i = 0; i < event_obj_arr.length; i++) {
      // extract curr event obj
      const event_specific_data = event_obj_arr[i];
      // outbreak specific data
      for (let i = 0; i < report.outbreaks.length; i++) {
        await getOutbreakData(
          event_specific_data,
          eventNumber,
          report.outbreaks[i]
        );
      }
    }
  } catch (error) {
    console.log("in get data, error caught");
  }
}

async function getSpeciesData(eventNumber, outbreakNumber) {
  try {
    var config = {
      method: "get",
      url: `https://wahis.woah.org/api/v1/pi/review/event/${eventNumber}/outbreak/${outbreakNumber}/all-information?language=en`,
      headers: {},
    };

    const response = await axios(config);

    species = response.data.speciesQuantities;
    wild_species = [];
    domestic_species = [];
    wild_death = 0;
    domestic_death = 0;
    wild_cases = 0;
    domestic_cases = 0;

    for (let i = 0; i < species.length; i++) {
      curr = species[i].totalQuantities;
      isWild = curr.isWild;
      curr_name = curr.speciesName;
      curr_death = curr.deaths;
      curr_cases = curr.cases;

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

    const wild_data = {
      species: wild_species.join(";"),
      death: wild_death,
      cases: wild_cases,
      "animale type": "wild",
    };

    const domestic_data = {
      species: domestic_species.join(";"),
      death: domestic_death,
      cases: domestic_cases,
      "animale type": "domestic",
    };

    return [wild_data, domestic_data];
  } catch (error) {
    console.log("in get species data, error caught");
  }
}

async function getOutbreakData(eventData, eventNumber, outbreak) {
  let location = outbreak.location;
  // remove the commas in the location name
  location = location.replace(/,/g, "");
  const longitude = outbreak.longitude;
  const latitude = outbreak.latitude;
  const start = new Date(outbreak.startDate).toLocaleDateString("en-US");
  const end = new Date(outbreak.endDate).toLocaleDateString("en-US");
  const epiUnit = outbreak.epiUnitType;
  // convert the fields into an object
  const data = {
    location,
    longitude,
    latitude,
    start,
    end,
    epiUnit,
  };

  const id = outbreak.id;
  try {
    const data_arr = await getSpeciesData(eventNumber, id);
    const wild_data = data_arr[0];
    const domestic_data = data_arr[1];

    // if wild species is not empty, create an object
    if (wild_data.species.length > 0) {
      const wild_obj = {
        ...eventData,
        ...data,
        ...wild_data,
        event_id: eventNumber,
        outbreak_id: id,
      };

      // write to csv
      await appendToCSV(OUTPUT_PATH, wild_obj);
    }
    if (domestic_data.species.length > 0) {
      const domestic_obj = {
        ...eventData,
        ...data,
        ...domestic_data,
        event_id: eventNumber,
        outbreak_id: id,
      };

      // write to csv
      await appendToCSV(OUTPUT_PATH, domestic_obj);
    }
  } catch (err) {
    // console.log(err);
    console.log("in get outbreak data, error caught");
  }
}

function getQuantitativeData(country, quantitativeData) {
  const total = [];

  for (let i = 0; i < quantitativeData.length; i++) {
    const curr_obj = {};
    const curr = quantitativeData[i];
    curr_obj.country = country;
    total.push(curr_obj);
  }

  return total;
}

async function makeRequest() {
  for (let i = 0; i < 5; i++) {
    const data = JSON.stringify({
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
    try {
      const response = await axios.post(
        "https://wahis.woah.org/api/v1/pi/event/filtered-list?language=en",
        {
          data: data,
        },
        {
          ...config,
          headers: {
            "Content-Type": "application/json",
          },
          maxBodyLength: Infinity,
        }
      );
      const responseData = response.data;
      const listOfEvents = responseData.list;
      console.log(listOfEvents);
      listOfEvents.map((obj) => {
        const reportId = obj.reportId;
        const eventId = obj.eventId;
        const subType = obj.subType;
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
    } catch (error) {
      console.log("in make request, error caught");
      console.log(error);
    }
  }
}

async function readCSV() {
  try {
    const data = await fs.promises.readFile("eventids.csv", "utf8");
    const rows = data
      .trim()
      .split("\n")
      .map((row) => row.split(","));
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const eventId = row[0];
      console.log(eventId);
      // getData(eventId);
      await getData(eventId);
    }
  } catch (err) {
    console.error("Error reading CSV file:", err);
  }
}

// Generates the CSV
// makeRequest();

// Reads the CSV
readCSV();
// getData(4733);
// running single test case
// getData(4512);

// getSpeciesData(4895, 113772);
