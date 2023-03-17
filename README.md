# Set up

1. Download this repository

# npm install

Open up a terminal and run npm install in this directory to install npm packages

# Python 3 requirements

Download python
Run:
`pip3 install pandas`

# Run code

`npm start`
It will automatically clean. If you want to clean manually, run:
`npm run clean`

# In the index.js file first notice that

```
makeRequest();
```

Is not commented out. This will generate a CSV sheet for you until it errors out.

Then once the CSV is generated, you can comment makeRequest() out, and uncomment out the readCSV() which will read through the events in the CSV and download it as PDF.

```
readCSV();
```
