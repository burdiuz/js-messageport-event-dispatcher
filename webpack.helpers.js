const path = require('path');

const LIBRARY_FILE_NAME = 'MessagePortDispatcher';
const LIBRARY_VAR_NAME = 'messageport-dispatcher';

const p = (value) => {
  return path.resolve(__dirname, value);
};

module.exports = {
  p,
  LIBRARY_FILE_NAME,
  LIBRARY_VAR_NAME
};
