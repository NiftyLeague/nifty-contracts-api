const API_BASE_URL =
  'https://odgwhiwhzb.execute-api.us-east-1.amazonaws.com/prod';

const CONTRACT_METHODS = {
  DEPOSIT: '0xb6b55f25',
  WITHDRAW: '0xfe55892d',
  PURCHASE: '0x72c9f580',
  RENAME: '0xc39cbef1',
};

module.exports = {
  API_BASE_URL,
  CONTRACT_METHODS,
};
