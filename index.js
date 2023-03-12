const fs = require("fs");
var axios = require("axios");

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
      [species, deaths, cases] = getQuantitativeData(
        report.quantitativeData.totals
      );

      // complie the event specific data into an object
      const event_specific_data = {
        country,
        species,
        deaths,
        cases,
      };
      // write
      fakeFunction(eventSpecificPath, event_specific_data);
    })
    .catch(function (error) {
      console.log(error);
    });
}

function getOutbreakData(path, outbreaks) {
  for (let i = 0; i < outbreaks.length; i++) {
    curr = outbreaks[i];
    location = curr.location;
    longitude = curr.longitude;
    latitude = curr.latitude;
    start = new Date(curr.startDate).toLocaleDateString("en-US");
    end = new Date(curr.endDate).toLocaleDateString("en-US");
    epiUnit = curr.epiUnitType;

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
    fakeFunction(path, data);
  }
}

function getQuantitativeData(quantitativeData) {
  species = [];
  deaths = 0;
  cases = 0;
  animal_type = new Set();
  for (let i = 0; i < quantitativeData.length; i++) {
    curr = quantitativeData[i];
    species.push(curr.speciesName);
    deaths += curr.deaths;
    cases += curr.cases;
    animal_type.add(curr.isWild);
  }
  // if the animal type set is greater than 1, then it is a mixed outbreak

  // return back to the parent function to write to the event specific csv
  return [species, deaths, cases];
}

function getPDF(eventNumber) {
  // Axios request GET to https://wahis.woah.org/api/v1/pi/pdf-generation/event/[number]/review-pdf?language=en
  // Returns a PDF
  var config = {
    method: "get",
    maxBodyLength: Infinity,
    responseType: "stream", // ensure response is treated as a stream
    // https://wahis.woah.org/api/v1/pi/review/event/${eventNumber}/all-information?language=en
    // url: `https://wahis.woah.org/api/v1/pi/pdf-generation/event/${eventNumber}/review-pdf?language=en`,
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
    .then((response) => {
      console.log(response.data._events);
      //   response.data.pipe(fs.createWriteStream("pdfs/" + eventNumber + ".pdf"));
    })
    .catch((error) => {
      console.log(error);
    });
}

async function makeRequest() {
  for (let i = 0; i < 2; i++) {
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
      pageSize: 10,
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
        // listOfEvents.map((obj) => {
        //   reportId = obj.reportId;
        //   eventId = obj.eventId;
        //   subType = obj.subType;
        //   console.log("eventId", eventId);
        //   // Write to a CSV file
        //   fs.appendFile(
        //     "data.csv",
        //     `${eventId}, ${reportId}, ${subType} \n`,
        //     (err) => {
        //       if (err) throw err;
        //       console.log("Data added to CSV file successfully!");
        //     }
        //   );
        // });
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
    rows.forEach((row) => {
      const rowData = {};
      console.log(row);
      const eventId = row[0];
      getPDF(eventId);
    });
  });
}

// Generates the CSV
// makeRequest();

// Reads the CSV
// readCSV();

// Gets the PDF
getData(4693);
