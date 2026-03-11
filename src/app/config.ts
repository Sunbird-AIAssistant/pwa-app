// config.ts - hardcoded for localhost
const jsonFilename = 'localhost.json';
const jsonUrl = `../assets/appConfig/${jsonFilename}`;
export const ConfigVariables = fetch(jsonUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    return data; // Return the fetched data so that it can be used by other parts of the application
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });
