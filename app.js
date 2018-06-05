require('dotenv').config({silent: true, path: 'local.env'});
const debug = require('debug');
const log = debug('dpc-exportspace-app');

const express = require('express');
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
const session = require('cookie-session');
const url = require('url');

process.env.port = appEnv.port;  // for the bot framework

// if we are on bluemix, use the provided uri as the redirect
if (process.env.VCAP_APPLICATION) {
  let vcap_application = JSON.parse(process.env.VCAP_APPLICATION);
  process.env.OAUTH_REDIRECT_URI = vcap_application.application_uris[0];
}

const botFramework = require('watsonworkspace-bot');
botFramework.level(process.env.WW_SDK_LOG_LEVEL);
// serve files from public
botFramework.express.use(express.static(__dirname + '/public'));
// use session
botFramework.express.use(session({
  name: 'dpcsession',
  secret: 'asomewhatcomplicatedsecret',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
botFramework.startServer();

log('about to authenticate with APP_ID', process.env.APP_ID);
const bot = botFramework.create(); // bot settings defined by process.env
bot.authenticate()
.then( token => {
  log('authentication successful');
})
.catch(err => {
  log('error authenticating:', err);
});

botFramework.express.get('/login', (req, res) => {
  log('in login');
  // it would be handy to figure out if the user is already 
  // logged in, but instead let's just start the oauth process
  res.redirect(`${process.env.APP_ID}/oauth`);
});

/**
 * this is called after the user has authenticated. Let's save the user's info in session
 * and redirect to the right page.
 */
botFramework.express.get('/oauthSuccess', (req, res) => {
  log('---> entering oauthSuccess');
  var qs = url.parse(req.url,true).query;
  req.session.dpcExportSpace = qs.userId;
  res.redirect('/spaces.html'); 
});

// this does the work of getting spaces
var space = require('./modules/space');
space(botFramework.express, bot);

// this exports the messages
const exportSpace = require('./modules/exportSpace');
exportSpace(botFramework.express, bot);