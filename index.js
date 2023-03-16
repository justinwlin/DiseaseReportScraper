const fs = require("fs");
var axios = require("axios");
const path = require("path");

// write data out to csv files. takes in a json object
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

// get data from a single event
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
      console.log("Country: ", country);
      [species, deaths, cases, isWild] = getQuantitativeData(
        report.quantitativeData.totals
      );

      // complie the event specific data into an object
      const event_specific_data = {
        country,
        species,
        deaths,
        cases,
        isWild,
      };
      // write
      // appendToCSV(eventSpecificPath, event_specific_data);
    })
    .catch(function (error) {
      console.log(error);
    });
}

// getting data for indiidual outbreaks
function getOutbreakData(path, outbreaks) {
  for (let i = 0; i < 2; i++) {
    // for (let i = 0; i < outbreaks.length; i++) {
    curr = outbreaks[i];
    id = curr.id;
    location = curr.location;
    location = location.replace(/,/g, "");
    longitude = curr.longitude;
    latitude = curr.latitude;
    start = new Date(curr.startDate).toLocaleDateString("en-US");
    end = new Date(curr.endDate).toLocaleDateString("en-US");
    epiUnit = curr.epiUnitType;
    // make another request to get the death and cases using the id
    // var config = {
    //   method: "get",
    //   url: `https://wahis.woah.org/api/v1/pi/review/event/4898/outbreak/${id}}/all-information?language=en`,
    //   headers: {},
    // };

    // axios(config)
    //   .then(function (response) {
    //     console.log(JSON.stringify(response.data));
    //   })
    //   .catch(function (error) {
    //     console.log(error);
    //   });

    // convert the fields into an object
    const data = {
      location,
      longitude,
      latitude,
      start,
      end,
      epiUnit,
    };
    // writing to csv
    // appendToCSV(path, data);
  }
}

// get deaths and case data from an individual outbreak
function getDeath(id) {
  var config = {
    method: "get",
    url: `https://wahis.woah.org/api/v1/pi/review/event/4898/outbreak/${id}}/all-information?language=en`,
    headers: {},
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
}

// might need to remove as we are now getting
// death cases and potentially animal type
// from individual outbreaks
function getQuantitativeData(quantitativeData) {
  species = [];
  deaths = 0;
  cases = 0;
  const isWildValues = quantitativeData.map((item) => {
    return item.isWild ? "wild" : "domestic";
  });
  const reducedIsWild =
    isWildValues.includes("wild") && isWildValues.includes("domestic")
      ? "both"
      : isWildValues[0];

  for (let i = 0; i < quantitativeData.length; i++) {
    curr = quantitativeData[i];
    species.push(curr.speciesName);
    deaths += curr.deaths;
    cases += curr.cases;
  }
  // Join species
  species = species.join("; ");
  // return back to the parent function to write to the event specific csv
  return [species, deaths, cases, reducedIsWild];
}

// making request to get a list of qualified events
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

// read through the event entries and generate csv
function readCSV() {
  fs.readFile("data.csv", "utf8", (err, data) => {
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
      getData(eventId);
    }
  });
}

// Generates the CSV
// makeRequest();

// Reads the CSV
// readCSV();

getDeath(113869);
