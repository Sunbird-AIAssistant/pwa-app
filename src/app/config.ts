// config.ts – multi-tenant: subdomain from hostname, fallback to default
function getSubdomainFromHost(): string {
  if (typeof window === 'undefined' || !window.location?.hostname) {
    return 'learningresources';
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }
  const parts = hostname.split('.');
  return parts.length > 1 ? parts[0] : 'learningresources';
}

export const subdomain = getSubdomainFromHost();
const jsonFilename = subdomain + '.json';
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
