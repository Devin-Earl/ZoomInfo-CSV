const fetch = require("node-fetch");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Load credentials from .env file
const apiUser = process.env.USERNAME;
const apiPassword = process.env.PASSWORD;

const authenticateUser = async (username, password) => {
  const maxRetries = 3;
  let retries = 0;
  while (retries < maxRetries) {
    try {
      // Use the user's credentials to authenticate the user
      const authParams = {
        email: username,
        password: password,
      };

      // Make API call to authenticate user
      const response = await fetch("https://api.zoominfo.com/authenticate", {
        method: "POST",
        body: JSON.stringify(authParams),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Authentication successful, extract and return access token
        const data = await response.json();
        return data.access_token;
      } else {
        // Authentication failed, log failure message and response body
        console.log(
          `Authentication Failed, retrying... Attempt: ${retries + 1}`
        );
        const body = await response.text();
        console.log(`Response body: ${body}`);
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for 3 seconds before retrying
      }
    } catch (error) {
      // Error occurred, log error message and stack trace
      console.error("Error occurred during authentication:");
      console.error(error.stack);
      retries++;
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for 3 seconds before retrying
    }
  }
};

const searchContacts = async (accessToken, companyName, jobTitle) => {
  const queryParams = new URLSearchParams({
    jobTitle: jobTitle,
    companyName: companyName,
    matchType: "EXACT",
    pageNum: "1",
    pageSize: "10",
    sortField: "lastUpdatedDate",
    sortOrder: "DESC",
  });

  const response = await fetch(
    `https://api.zoominfo.com/search/contact?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.ok) {
    const data = await response.json();
    const contacts = data.contacts.map((contact) => ({
      firstName: contact.firstName,
      lastName: contact.lastName,
      companyName: contact.companyName,
      jobTitle: contact.jobTitle,
      lastUpdatedDate: contact.lastUpdatedDate,
    }));
    return contacts;
  } else {
    // Search failed, log failure message and response body
    console.log("Contact search failed");
    const body = await response.text();
    console.log(`Response body: ${body}`);
    return [];
  }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter company name: ", async (companyName) => {
  rl.question("Enter job title: ", async (jobTitle) => {
    rl.question("Enter output CSV file name: ", async (fileName) => {
      try {
        const accessToken = await authenticateUser(apiUser, apiPassword);
        const contacts = await searchContacts(
          accessToken,
          companyName,
          jobTitle
        );

        // Create output directory if it does not exist
        const outputDir = "output";
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
        }

        // Write contacts to CSV file
        const outputFilePath = path.join(outputDir, fileName);
        const headers = [
          "First Name",
          "Last Name",
          "Company Name",
          "Job Title",
          "Last Updated Date",
        ];
        const csvData = [headers];
        contacts.forEach((contact) => {
          csvData.push([
            contact.firstName,
            contact.lastName,
            contact.companyName,
            contact.jobTitle,
            contact.lastUpdatedDate,
          ]);
        });
        const csvText = csvData.map((row) => row.join(",")).join("\n");
        fs.writeFileSync(outputFilePath, csvText);
        console.log(`Contacts saved to ${outputFilePath}`);
      } catch (error) {
        console.error("Error occurred during search:");
        console.error(error.stack);
      } finally {
        rl.close();
      }
    });
  });
});
