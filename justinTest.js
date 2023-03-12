var axios = require("axios");
const fs = require("fs");
const path = require("path");

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

async function getEventJSON(eventNumber) {
	// Axios request GET to https://wahis.woah.org/api/v1/pi/pdf-generation/event/[number]/review-pdf?language=en
	// Returns a PDF
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
			const responseData = response.data;
			const EVENT_ID = responseData.event.eventId;
			const country = responseData.event.country.name;
			const countryISO = responseData.event.country.isoCode;
			const startDate = responseData.event.startedOn;
			const endDate = responseData.event.endedOn;

			const quantativeData = responseData.quantitativeData.totals;
			// Loop through totals array and concat speciesName
			let species = [];
			for (let i = 0; i < quantativeData.length; i++) {
				species.push(quantativeData[i].speciesName);
			}
			species = species.join(", ");
			// Go through the array and find out
			const isWildValues = quantativeData.map((item) => {
				return item.isWild ? "wild" : "domestic";
			});
			const reducedIsWild =
				isWildValues.includes("wild") && isWildValues.includes("domestic")
					? "both"
					: isWildValues[0];
			const totalDeaths = quantativeData.reduce((accumulator, item) => {
				return accumulator + item.deaths;
			}, 0);

			const writtenRow = {
				eventNumber: EVENT_ID,
				country: country,
				countryISO: countryISO,
				startDate: startDate,
				endDate: endDate,
				species: species,
				isWild: reducedIsWild,
				totalDeaths: totalDeaths,
			};
            const pathForCSV = `events/${EVENT_ID}.csv`;
            appendToCSV(pathForCSV, writtenRow);
            console.log(writtenRow);


            const outBreaksForEvent = responseData.outbreaks; // an array of objects
            for (let i = 0; i < outBreaksForEvent.length; i++) {
                const outBreak = outBreaksForEvent[i];
                const outBreakID = outBreak.id;
                const pathForOutbreak = `events/${EVENT_ID}/${outBreakID}.csv`;
                appendToCSV(pathForOutbreak, outBreak);
                console.log(outBreak)
            }
		})
		.catch(function (error) {
			console.log(error);
		});
}

async function makeRequest() {
	for (let i = 4; i < 50; i++) {
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
					country = obj.country;
					// latitude / longitude
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
		// rows.forEach((row) => {
		// 	const rowData = {};
		// 	console.log(row);
		// 	const eventId = row[0];
		// 	// getEventJSON(eventId);
		// });
		firstRow = rows[0];
		console.log(firstRow);

		const eventId = firstRow[0];
		console.log(eventId);
		getEventJSON(eventId);
	});
}

// Generates the CSV
// makeRequest();

// Reads the CSV
readCSV();

// getEventJSON(4031);

// appendToCSV('event/1234.csv', {a: 1, b: 2})
// appendToCSV('event/1234.csv', {a: 1, b: 3, c: 5})
// appendToCSV('event/1234.csv', {a: 1, d: 3, c: 5})


