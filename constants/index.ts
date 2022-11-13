// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'API_BASE_U... Remove this comment to see the full error message
const API_BASE_URL =
  'https://odgwhiwhzb.execute-api.us-east-1.amazonaws.com/prod';

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'CONTRACT_M... Remove this comment to see the full error message
const CONTRACT_METHODS = {
  DEPOSIT: '0xb6b55f25',
  WITHDRAW: '0xfe55892d',
  PURCHASE: '0x72c9f580',
  RENAME: '0xc39cbef1',
};

// @ts-expect-error TS(2580): Cannot find name 'module'. Do you need to install ... Remove this comment to see the full error message
module.exports = {
  API_BASE_URL,
  CONTRACT_METHODS,
};
