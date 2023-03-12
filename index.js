var axios = require("axios");
const fs = require("fs");

function getPDF(eventNumber) {
	// Axios request GET to https://wahis.woah.org/api/v1/pi/pdf-generation/event/[number]/review-pdf?language=en
	// Returns a PDF
	var config = {
		method: "get",
		maxBodyLength: Infinity,
		responseType: "stream", // ensure response is treated as a stream
		url: `https://wahis.woah.org/api/v1/pi/pdf-generation/event/${eventNumber}/review-pdf?language=en`,
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
			response.data.pipe(fs.createWriteStream("pdfs/" + eventNumber + ".pdf"));
		})
		.catch((error) => {
			console.log(error);
		});
}

async function makeRequest() {
	for (let i = 0; i < 1000; i++) {
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
			eventStartDate: null,
			submissionDate: null,
			animalTypes: [],
			sortColumn: null,
			sortOrder: null,
			pageSize: 100,
			pageNumber: i,
		});

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
				listOfEvents.map((obj) => {
					reportId = obj.reportId;
					eventId = obj.eventId;
					subType = obj.subType;
				    console.log("eventId", eventId);
                    // Write to a CSV file
                    fs.appendFile('data.csv', `${eventId}, ${reportId}, ${subType} \n`, (err) => {
                        if (err) throw err;
                        console.log('Data added to CSV file successfully!', eventId);
                      });
				});
			})
			.catch(function (error) {
				console.log(error);
			});
	}
}

function readCSV() {
    fs.readFile('data.csv', 'utf8', (err, data) => {
        if (err) throw err;
        const rows = data.trim().split('\n').map(row => row.split(','));
        // const headers = rows.shift();
        rows.forEach(row => {
          const rowData = {};
          console.log(row)
          const eventId = row[0];
          getPDF(eventId);
        });
      });
}
            

// Generates the CSV
makeRequest();

// Reads the CSV
// readCSV();
