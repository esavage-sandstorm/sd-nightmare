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
const maintenanceModule = require('./modules/maintenance.js');



// Parse arguments into a usable array;
const args = process.argv;
const shell = args.shift();
const mocha = args.shift(); // get mocha from npm function calling this script
const script = args.shift();
const client = args[0];
const env = args[1];

const maintenanceBot = new maintenanceModule(client, env);
// bot contains nightmare and D7 instances, so let it handle everything

  maintenanceBot.start();
  maintenanceBot.reportHeader();
  maintenanceBot.login();
  maintenanceBot.cmsStatus();

// const ssh = new SSH2Promise(sshconfig);

// const sshExec = function(cmd){
//   return ssh.exec(cmd).then((data) => {
//     return data;
//   });
// }

// const axiosGet = function(url){
//   return axios.get(url)
//   .then(response => {
//     return response.data;
//   })
//   .catch(error => {
//     console.log(error);
//   });
// }

/*

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
  // describe('Check for updates', function(){
  //   this.timeout('30s');
  //   let updates = null;
  //   it('Get available updates', function*(){
  //     updates = yield nightmare.use(D7.checkForUpdates());
  //     console.log(updates);
  //   })
  // });
maintenanceBot.exportReport();
maintenanceBot.end();
