export const environment = {
  production: true
};
export const config = {
  api: {
    BASE_URL: 'https://school-api-dev.tekdinext.com/',
    BASE_URL_BOT: 'https://aibot-dev.tekdinext.com/',
    TELEMETRY_BASE_URL: 'https://school-dev.tekdinext.com/',
    CONFIG: 'seeker/configuration',
    PAGE_SEARCH_API: 'content/search',
    CONTEXT_SEARCH: 'api/aiutility/v1/context',
    CONTENT_SEARCH_API: 'content/search',
    TELEMETRY_SYNC: 'telemetry/v1/telemetry',
    BOT_QUERY_API: 'v1/chat',
    SEARCH_API: 'content/search',
    CONFIRM_API: 'confirm',
    BOT_SAKHI_API_PATH: 'v1/chat',
    BOT_ACTIVITY_API_PATH: 'api/activitybot/v1/chat',

    REGISTER_DEVICE_API_PATH: 'api/registerMobileDevice',
    KEY: 'myjp-0.1',
    SECRET: '7tVOEu0xj0zYQiYtCYbauEkNC3NBXCpM'
  },
  telmetry: {
    PRODUCER_ID: 'dev.ejp.mobileapp',
    PRODUCER_PID: 'mobileapp'
  }
}
