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


const sshconfig = {
  host: config.sshHost,
  username: user,
  identity: config.keyFile
}

const ssh = new SSH2Promise(sshconfig);

const nightmare = Nightmare({ show: true });

// Start a report file
const today = dates.getCurrent();
const filename = strings.capitalize(client)+'_Maintenance_Report-'+today.yq+'-'+today.ymd+'.html';
var dir = __dirname+'/reports';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
config.report = dir+'/'+filename;

const maintenanceReportHeader = function(){
  let header = '<head>';
  header += '<title>'+ strings.capitalize(client)+' Maintenance Report - '+today.yq+'-'+today.ymd+'</title>';
  header += '</head>';
  header += '<body>';
  header += '<header>';
  header += '<h1> '+strings.capitalize(client)+' Maintenance Report - '+today.yq+'-'+today.ymd+'</h1>';
  header += '<p>Site: '+config.url+'<br />';
  header += 'Date: '+today.month+' '+today.D+', '+today.Y+' '+today.time+'<br />';
  header += 'Prepared by: Nightmare JS</p>';
  header += '</header>';
  return header;
}

fs.writeFile(config.report, maintenanceReportHeader(), (err) => {
  if (err) console.log(err);
});

const D7 = new D7module(config);

const sshExec = function(cmd){
  return ssh.exec(cmd).then((data) => {
    return data;
  });
}

const axiosGet = function(url){
  return axios.get(url)
  .then(response => {
    return response.data;
  })
  .catch(error => {
    console.log(error);
  });
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
      fs.appendFile(report, text, function (err) {
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
  /*
  describe('Get the Status Report', function(){
    this.timeout('20s');
    addToReport('<h2>Status</h2>');
    const statusTable = new table('status');
    nightmare.use(D7.goToPage('/admin/reports/status'));

    let statusReport = null;

    it('Gather report', function*(){
      statusReport = yield nightmare.use(D7.statusReport());
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
      statusTable.addRow(['Cron Running', cron.value]);
      expect(status).to.equal('ok');
    });

    it('File system permissions are writable', function*(){
      const status = getReportItemByTitle('File system').value;
      statusTable.addRow(['File System Permissions', status]);
      expect(status).to.contain('Writable');
    });

    it('Configuration file is PROTECTED', function*(){
      const status = getReportItemByTitle('Configuration file').value;
      statusTable.addRow(['Configuration File Protected', status.toUpperCase()]);
      expect(status).to.equal('Protected');
    });

    it('Access to update.php is PROTECTED', function*(){
      const status = getReportItemByTitle('Access to update.php').value;
      statusTable.addRow(['Access to update.php', status.toUpperCase()]);
      expect(status).to.equal('Protected');
    });

    it('Test form submissions', function*(){
      const row = ['Forms Submissions Tested', 'TO DO'];
      statusTable.addRow(row);
      console.log('This must be done manually');
      expect(row).to.be.an('array');
    });

    it('Check if DB Backup Running', function*(){
      const row = ['DB Backup Running', 'TO DO'];
      statusTable.addRow(row);
      console.log('This must be done manually');
      expect(row).to.be.an('array');
    });

    it('Update Dev Site', function*(){
      const row = ['Dev Site Updated', 'TO DO'];
      statusTable.addRow(row);
      console.log('This must be done manually');
      expect(row).to.be.an('array');
    });

    it('Google Analytics is Reporting', function*(){
      const ga = yield nightmare
        .goto(config.url)
        // .wait(5000)
        .evaluate(() => {
          alert(window.GoogleAnalyticsObject);
          return !!window.GoogleAnalyticsObject;
        });
      const status = (ga) ? 'Reporting' : 'Not Reporting';
      const row = ['Google Analytics Reporting', status];
      statusTable.addRow(row);
      expect(ga).to.equal(true);
    });

    it('PHP opcache enabled on Prod', function*(){
      const data = yield sshExec('php -m');
      const phpModules = data.split('\n');
      const status =  (phpModules.indexOf('opcache') > -1)? 'enabled' : 'not found';
      const row = ['PHP opcache enabled on Prod', status];
      statusTable.addRow(row);
      addToReport(statusTable.html());
      expect(phpModules).to.be.an('array');
      expect(phpModules).to.contain('opcache');
    });
  });


  describe('Performance/Security', function(){
    this.timeout('30s');
    let pageSpeedInsights = null;
    const pageSpeedTable = new table('google-page-speed');
    pageSpeedTable.addHeader('');
    pageSpeedTable.addHeader('Mobile');
    pageSpeedTable.addHeader('Desktop');
    const systemTable = new table('performance');
    systemTable.addHeader('');
    systemTable.addHeader('Free');
    systemTable.addHeader('Used');
    systemTable.addHeader('Total');

    it('Check Google PageSpeed Insights', function*(){
      const testUrl = 'https://sandstormdesign.com';
      pageSpeedInsights = yield nightmare
        .goto('https://developers.google.com/speed/pagespeed/insights/?url='+encodeURI(testUrl))
        .wait('.report-summary')
        .wait('.lh-gauge__percentage')
        .evaluate(() => {
          const pageSpeedInsights = {};
          pageSpeedInsights.mobile = parseInt(document.querySelectorAll('.lh-gauge__percentage')[0].innerText);
          pageSpeedInsights.desktop = parseInt(document.querySelectorAll('.lh-gauge__percentage')[1].innerText);
          return pageSpeedInsights;
        });
      addToReport('<h2>Performance/Security</h2>');
      pageSpeedTable.addRow(['Google PageSpeed Score', pageSpeedInsights.mobile, pageSpeedInsights.desktop]);
      addToReport(pageSpeedTable.html());
      expect(pageSpeedInsights).to.be.an('object');
    });

    it('Mobile speed is above 50', function*(){
      expect(pageSpeedInsights.mobile).to.be.above(50);
    });

    it('Desktop speed is above 50', function*(){
      expect(pageSpeedInsights.desktop).to.be.above(50);
    });

    it('Check server memory', function*(){
      const data = yield sshExec('free -mh');
      // console.log(data);
      const result = data.split('\n');
      let headers = result[0].trim().split(/\s{2,}/);
      let row = result[1].trim().split(/\s{2,}/);
      headers = headers.filter(header => {return header != '';});
      headers.unshift('Name');
      const mem = {};
      for (var i=0; i<row.length; i++){
        mem[headers[i]] = row[i];
      }
      systemTable.addRow(['Server Memory', mem.free, mem.used, mem.total]);
      expect(mem).to.be.an('object');
    });

    it('Check disk space', function*(){
      const data = yield sshExec('df -h | grep /$'); // get only the root filesystem
      const info = data.split(/\s+/);
      const disk = {
        filesystem: info[0],
        size: info[1],
        used: info[2],
        available: info[3],
        use_percentage: info[4],
        mount: info[5]
      };
      systemTable.addRow(['Disk Space', disk.available, disk.used, disk.size]);
      systemTable.addRow(['<strong>Notes / Actions</strong><br /><br />']);
      addToReport(systemTable.html());
      expect(disk).to.be.an('object');
    });



    it('Check PHP version', function*() {
      addToReport('<H3>PHP</h3>');
      const data = yield sshExec('php -v');
      const currentPHPVersion = data.match(/(?<=PHP )[0-9]+\.[0-9]*\.[0-9]* /)[0];
      const v = currentPHPVersion.split('.')[0];
      const phpUrl = 'https://www.php.net/releases/?json&version='+v+'&max=1';
      const php = yield axiosGet(phpUrl);
      const latestPHPversion = Object.getOwnPropertyNames(php)[0];
      const phpTable = new table('php');
      phpTable.addRow(['Current Version', currentPHPVersion]);
      phpTable.addRow(['Latest Stable Version', latestPHPversion]);
      addToReport(phpTable.html());
    });
  });

  describe('Check Drupal Logs', function(){
    this.timeout('30s');
    it('Check for PHP errors', function*(){
      const logs = yield nightmare.use(D7.logs('php', 'error'));
      const logsTable = new table('php-error-logs');
      const hasErrors = (logs.length == 0)? 'No' : 'Yes';
      logsTable.addRow(['PHP Errors', hasErrors]);
      if (logs.length > 0){
        logsTable.addRow(['<strongList</strong>']);
        logsTable.addRow(['<strong>Type</strong>', '<strong>Date</strong>', '<strong>Message</strong>', '<strong>User</strong>']);
        logs.forEach(log => {

          logsTable.addRow([log.type, log.date, '<a href="'+log.link+'" target="_blank">'+log.text+'</a>', log.user]);
        });
        logsTable.addRow(['<strong>Actions taken:</strong><br/><br/>','']);
      }
      addToReport('<h3>Log Messages</h3>');
      addToReport(logsTable.html());
      expect(logs.length).to.equal(0);
    })
  });
  */
  describe('Check for updates', function(){
    this.timeout('30s');
    let updates = null;
    it('Get available updates', function*(){
      updates = yield nightmare.use(D7.checkForUpdates());
      console.log(updates);
    })
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

