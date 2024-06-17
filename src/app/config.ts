// config.ts
const urlObj = new URL(document.baseURI);
const hostname = urlObj.hostname; // e.g., "subdomain.example.com"
const domainParts = hostname.split('.');
console.log(domainParts);
const jsonFilename = domainParts[0] + '.json';
const jsonUrl = `../assets/appConfig/${jsonFilename}`;
// const jsonUrl = `../assets/appConfig/localhost.json`;

console.log(`Fetching configuration from: ${jsonUrl}`);

export const ConfigVariables = fetch(jsonUrl)
  .then(response => {
    console.log({ response });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Fetched data:', data);
    return data; // Return the fetched data so that it can be used by other parts of the application
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });
