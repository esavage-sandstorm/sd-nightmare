'use strict';
const Nightmare = require('nightmare');
const expect = require('chai').expect;
const should = require('chai').should;
const yaml = require('js-yaml');
const fs   = require('fs');
const strings = require('./modules/stringsHelper.js');
const dates = require('./modules/dateHelper.js');
const D7module = new require('./modules/sd-d7-nightmare/index.js');

const exec = require('ssh-exec');
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

const sshHost = user+'@'+config.sshHost;

const nightmare = Nightmare({ show: true });

// Start a report file
const today = dates.getCurrent();

const filename = strings.capitalize(client)+'_Maintenance_Report-'+today.yq+'-'+today.ymd+'.md';
var dir = __dirname+'/reports';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
config.report = dir+'/'+filename;

const maintenanceReportHeader = function(){
  let header = '# '+strings.capitalize(client)+' Maintenance Report - '+today.yq+'-'+today.ymd;
  header += "\n\t";
  header += 'Site: '+config.url+'  ';
  header += "\n\t";
  header += 'Date: '+today.month+' '+today.D+', '+today.Y+' '+today.time+'  ';
  header += "\n\t";
  header += 'Prepared by: Nightmare JS  ';
  header += "\n\n";
  return header;
}

fs.writeFile(config.report, maintenanceReportHeader(), (err) => {
  if (err) console.log(err);
});

const D7 = new D7module(config);

const makeRow = function(cells, char, w){
  let row = '';
  cells.forEach(cell => {
    row += char + strings.padBoth(cell, char, w-1)+'|';
  });
  return '|'+row;
}

const addToReport = function(text){
  const report = config.report;
  if (!report){
    console.log('Could not find '+report);
    return false;
  }
  try {
    if (fs.existsSync(report)) {
      //file exists
      fs.appendFile(report, text+"\n", function (err) {
        if (err) throw err;
      });
    }
  } catch(err) {
    console.error(err)
  }
}
// Queue tests here, passing along the same nightmare instance
  describe('Log in to Drupal', function() {
    this.timeout('240s');
    nightmare.use(D7.Login());
  });

  describe('Get the Status Report', function(){
    this.timeout('20s');
    const statusCellW = 39;
    addToReport('## Status');
    nightmare.use(D7.goToPage('/admin/reports/status'));

    let statusReport = null;

    it('Gather report', function*(){
      statusReport = yield nightmare.use(D7.statusReport());
      addToReport(makeRow(['', ''], '-', statusCellW));
      expect(statusReport).to.be.an('array');
    });
    const getReportItemByTitle =function(title){
      return statusReport.filter(item => {
        return item.title == title;
      })[0];
    }

    it('Cron is running', function*(){
      const cron = getReportItemByTitle('Cron maintenance tasks');
      const status = cron.type;
      addToReport(makeRow(['Cron Running', cron.value], ' ', statusCellW));
      expect(status).to.equal('ok');
    });

    it('File system permissions are writable', function*(){
      const status = getReportItemByTitle('File system').value;
      addToReport(makeRow(['File System Permissions', status], ' ', statusCellW));
      expect(status).to.contain('Writable');
    });

    it('Configuration file is PROTECTED', function*(){
      const status = getReportItemByTitle('Configuration file').value;
      addToReport(makeRow(['Configuration File Protected', status.toUpperCase()], ' ', statusCellW));
      expect(status).to.equal('Protected');
    });

    it('Access to update.php is PROTECTED', function*(){
      const status = getReportItemByTitle('Access to update.php').value;
      addToReport(makeRow(['Access to update.php', status.toUpperCase()], ' ', statusCellW));
      expect(status).to.equal('Protected');
    });

    it('Test form submissions', function*(){
      const row = makeRow(['Forms Submissions Tested', ''], ' ', statusCellW);
      addToReport(row);
      console.log('This must be done manually');
      expect(row).to.be.a('string');
    });

    it('Check if DB Backup Running', function*(){
      const row = makeRow(['DB Backup Running', ''], ' ', statusCellW);
      addToReport(row);
      console.log('This must be done manually');
      expect(row).to.be.a('string');
    });

    it('Update Dev Site', function*(){
      const row = makeRow(['Dev Site Updated', 'Pending'], ' ', statusCellW);
      addToReport(row);
      console.log('This must be done manually');
      expect(row).to.be.a('string');
    });

    it('Check Google Analytics Reporting', function*(){
      const row = makeRow(['Google Analytics Reporting', ''], ' ', statusCellW);
      addToReport(row);
      console.log('This must be done manually');
      expect(row).to.be.a('string');
    });

    it('Check PHP opcache enabled on Prod', function*(){
      try {
        exec('php -m', sshHost, function (err, stdout, stderr) {
          const result = stdout.split('\n');
          const status =  (result.indexOf('opcache') > -1)? 'enabled' : 'not found';
          const row = makeRow(['PHP opcache enabled on Prod', status], ' ', statusCellW);
          addToReport(row);
          addToReport(makeRow(['', ''], '-', statusCellW));
          // result.should.contain('opcache');
        });
      } catch(e){
        console.log(e);
      }
    });
  });

  describe('Performance/Security', function(){
    this.timeout('30s');
    let pageSpeedInsights = null;

    it('Check Google PageSpeed Insights', function*(){
      const testUrl = 'https://sandstormdesign.com';
      pageSpeedInsights = yield nightmare
        .goto('https://developers.google.com/speed/pagespeed/insights/?url='+encodeURI(testUrl))
        .wait('.report-summary')
        .wait('.lh-gauge__percentage')
        .evaluate(() => {
          const pageSpeedInsights = {};
          pageSpeedInsights.mobile = parseInt(document.querySelectorAll('.lh-gauge__percentage')[0].innerText);
          pageSpeedInsights.desktop = parseInt(document.querySelectorAll('.lh-gauge__percentage')[0].innerText);
          return pageSpeedInsights;
        });
      const scores = 'Mobile: '+pageSpeedInsights.mobile+', Desktop: '+pageSpeedInsights.desktop;
      addToReport("\n"+'## Performance/Security');
      addToReport(makeRow(['', ''], '-', 50));
      addToReport(makeRow(['Google PageSpeed Score', scores], ' ', 50));
      expect(pageSpeedInsights).to.be.an('object');
    });

    it('Mobile speed is above 50', function*(){
      expect(pageSpeedInsights.mobile).to.be.above(50);
    });

    it('Desktop speed is above 50', function*(){
      expect(pageSpeedInsights.desktop).to.be.above(50);
    });

    it('Check server memory', function*(){

      try {
        exec('free -mh', sshHost, function (err, stdout, stderr) {
          const result = stdout.split("\n");
          let headers = result[0].trim().split(/\s{2,}/);
          let row = result[1].trim().split(/\s{2,}/);
          headers = headers.filter(header => {return header != '';});
          headers.unshift('Name');
          const mem = {};
          for (var i=0; i<row.length; i++){
            mem[headers[i]] = row[i];
          }
          if (mem){
            const memory = 'Total: '+mem.total+', Used: '+mem.used+', Free: '+mem.free;
            addToReport(makeRow(['Server Memory', memory], ' ', 50));
            addToReport(makeRow(['', ''], '-', 50));
          }
          expect(mem).to.be.an('object');
        });
      } catch(e){
        console.log(e);
      }
    })
  });
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
