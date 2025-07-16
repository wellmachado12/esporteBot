// facades/index.js - Exportações das facades
const AuthFacade = require("./AuthFacade");
const ChatFacade = require("./ChatFacade");
const { AppFacade, getAppFacade } = require("./AppFacade");

module.exports = {
  AuthFacade,
  ChatFacade,
  AppFacade,
  getAppFacade,
};
