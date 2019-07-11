'use strict';
const Nightmare = require('nightmare');
const expect = require('chai').expect;
const yaml = require('js-yaml');
const fs   = require('fs');
const strings = require('./modules/stringsHelper.js');
const D7module = new require('./modules/sd-d7-nightmare/index.js');

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

message(['Sandstorm Nightmare Maintenance', strings.capitalize(client)+': '+strings.capitalize(env)] );

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
const nightmare = Nightmare({ show: true });
const D7 = new D7module(config);

// Queue tests here, passing along the same nightmare instance
nightmare
.use(D7.Login())
// .wait(2000)
.use(D7.statusReport());

const end = function() {
  let bar = '#';
  while (bar.length < 80){
    bar += '#';
  }
  describe(bar, function(){
    it('End this Nightmare', function*(){
      yield nightmare.end();
    })
  })
}
end();
