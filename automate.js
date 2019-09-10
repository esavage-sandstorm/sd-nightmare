'use strict';
const Nightmare = require('nightmare');
const expect = require('chai').expect;
const should = require('chai').should;
const yaml = require('js-yaml');
const fs   = require('fs');
const opn = require('opn');
const axios = require('axios');
const SSH2Promise = require('ssh2-promise');
const strings = require('./modules/stringsHelper.js');
const dates = require('./modules/dateHelper.js');
const table = require('./modules/tableHelper.js');
const D7module = new require('./modules/sd-d7-nightmare/index.js');

const user = require("os").userInfo().username;

// Parse arguments into a usable array;
function message(lines, type){
  let top ='#';
  if (type){
    let top = '#'+type.toUpperCase();
  }
  while (top.length < 80){
    top += '#';
  }
  let bottom = '#';
  while (bottom.length < 80){
    bottom += '#';
  }
  console.log(top);
  if (typeof lines == 'object'){
    for (var i=0;i<lines.length; i++) {
      console.log('## '+lines[i]);
    }
  }else {
    console.log('## '+lines);
  }
  console.log(bottom);
}
function error(lines){
  message(lines, 'error');
}

const args = process.argv;
const shell = args.shift();
const mocha = args.shift();
const script = args.shift();
const client = args[0];
if (!client){
  error('A valid client (i.e. Sandstorm) must be specified.');
  process.exit(1);
}

const env = args[1];
if (!env){
  error('A valid environment (i.e. dev, local, live) must be specified.');
  process.exit(2);
}

message(['Sandstorm Nightmare Automate', strings.capitalize(client)+': '+strings.capitalize(env)] );

// move to module
function getEnvConfig(client, env){
  let config = null;
  let globalConfig = null
  try {
    config = yaml.safeLoad(fs.readFileSync('./env/'+client+'.env', 'utf8'));
    globalConfig = config['global'];
  } catch (e) {
    console.error(e);
  }

  if (!config){
    error(client+' is not a valid client');
    process.exit(1);
  } else {
    config = config[env];

  }

  if (!config){
    error(env+' is not a valid environment');
    process.exit(2);
  }
  if (globalConfig){
    config = Object.assign(globalConfig, config);
  }
  return config;
}
const config = getEnvConfig(client, env);
const nightmare = Nightmare({
  show: true,
  switches: {
    'ignore-certificate-errors': true
  }
});
const D7 = new D7module(config);
// Queue tasks here, passing along the same nightmare instance

  describe('Log in to Drupal', function() {
    this.timeout('2400s');
    nightmare.use(D7.Login());
  });

  describe('Create Menu item', function(){
    this.timeout('240s');
    const defaultItem = {
      "title": "Default Item",
      "path": "<nolink>",
      "parent": "",
      "weight": 0,
      "enabled": true,
      "expanded": false,
      "siteMapInclusion": "default",
      "siteMapPriority": "default",
      "menuLink": {
        "title": "",
        "id": "",
        "name": "",
        "relationship": "",
        "classes": "",
        "style": "",
        "target": "",
        "accessKey": ""
      },
      "menuItem": {
        "id": "",
        "classes": "",
        "style": ""
      }
    };
    // start with default and customize
    const item = defaultItem;
      item.path = "<nolink>";
      item.parent = "Asset Management";
      item.weight = -50;
      item.menuLink.classes = "main_menu--expand_button";
      item.title = "Expand "+item.parent;
      item.menuLink.title = item.title;
    nightmare.use(D7.addMenuItem('main-menu', item));
  });

const end = function() {
  let bar = '#';
  while (bar.length < 80){
    bar += '#';
  }
  describe(bar, function(){
    it('End this Nightmare', function*(){
      opn(config.report, {app: 'firefox'});
      yield nightmare.end();
      // process.exit(0);
    })
  })
}
end();

