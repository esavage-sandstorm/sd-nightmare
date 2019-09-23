const Nightmare = require('nightmare');
const expect = require('chai').expect;
const should = require('chai').should;
const yaml = require('js-yaml');
const fs   = require('fs');
const opn = require('opn');
const SSH2Promise = require('ssh2-promise');

const strings = require('./stringsHelper.js');
const table = require('./tableHelper.js');
const dates = require('./dateHelper.js');

const D7module = require('./sd-d7-nightmare/index.js');


function maintenanceModule(client, env){

  // Start config
  let mod = this;

  this.client = client;
  this.env = env;
  this.today = dates.getCurrent();
  let config = null;
  let globalConfig = null;

  try {
    config = yaml.safeLoad(fs.readFileSync('./env/'+client+'.env', 'utf8'));
    globalConfig = config['global'];
  } catch (e) {
    console.error(e);
  }
  if (!client){
    this.error('A valid client (i.e. Sandstorm) must be specified.', 1);
  }
  if (!env){
    this.error('A valid environment (i.e. dev, local, live) must be specified.', 2);
  }

  if (!config) {
    error(client+' is not a valid client', 1);
  } else {
    config = config[env];
  }

  if (!config){
    error(env+' is not a valid environment', 2);
  }
  if (globalConfig){
    config = Object.assign(globalConfig, config);
  }
  this.config = config;
  const user = require("os").userInfo().username;
  this.sshconfig = {
    host: config.sshHost,
    username: config.user,
    identity: config.keyFile
  }
  this.ssh = new SSH2Promise(this.sshconfig);
  this.cms = Object.assign({}, new D7module(this.config));
  this.nightmare = Nightmare({
    show: true,
    switches: {
      'ignore-certificate-errors': true
    }
  });
  // end config

  mod.consoleMessage = function(lines, type){
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
  };

  mod.error = function(lines, code){
    this.message(lines, 'error');
    process.exit(code);
  };

  mod.start = function() {
    this.consoleMessage(['Sandstorm Nightmare Maintenance', strings.capitalize(this.client)+': '+strings.capitalize(this.env)] );
  };

  mod.end = function(){
    let bar = '#';
    while (bar.length < 80){
      bar += '#';
    }
    describe(bar, function(){
      it('Open report', function*(){
        opn(mod.reportPath);
      });

      it('End this Nightmare', function*(){
        yield mod.nightmare.end();
        process.exit(0);
      });
    });
  }

  mod.report = '';
  mod.writeReport = function(text){
    this.report += text;
  };

  mod.reportHeader = function(){
    let header = '<head>';
    header += '<title>'+ strings.capitalize(this.client)+' Maintenance Report - '+this.today.yq+'-'+this.today.ymd+'</title>';
    header += '</head>';
    header += '<body>';
    header += '<header>';
    header += '<h1> '+strings.capitalize(this.client)+' Maintenance Report - '+this.today.yq+'-'+this.today.ymd+'</h1>';
    header += '<p>Site: '+this.config.url+'<br />';
    header += 'Date: '+this.today.month+' '+this.today.D+', '+this.today.Y+' '+this.today.time+'<br />';
    header += 'Prepared by: Nightmare JS</p>';
    header += '</header>';
    this.writeReport(header);
  };

  mod.exportReport = function(){
    describe('Export Report...', function(){
      const filename = strings.capitalize(mod.client)+'_Maintenance_Report-'+mod.today.yq+'-'+mod.today.ymd+'.html';
      const dir = '../reports';
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }
      mod.reportPath = dir+'/'+filename;
      it('Write report to '+mod.reportPath, function*(){
        fs.writeFile(mod.reportPath, mod.report, (err) => {
          if (err) console.log(err);
        });
      });
    });
  };

  mod.login = function() {
    describe('test log in.', function() {
      this.timeout('240s');
      mod.nightmare.use(mod.cms.Login());
    });
  };

  mod.cmsStatus = function(){
    mod.writeReport('<h2>Status</h2>');
    describe('Get the Status Report', function(){
      this.timeout('200s');
      const statusTable = new table('status');
      it('Go to reports', function*(){
        mod.nightmare
        .use(mod.cms.goToPage('/admin/reports/status'))
        .wait('.system-status-report');
      });

      // To Do: move into D7 module
      let statusReport = null;
      it('Gather report', function*(){
        statusReport = yield mod.nightmare.use(mod.cms.statusReport());
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
        const ga = yield mod.nightmare
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
      /*
      it('PHP opcache enabled on Prod', function*(){
        const data = yield sshExec('php -m');
        const phpModules = data.split('\n');
        const status =  (phpModules.indexOf('opcache') > -1)? 'enabled' : 'not found';
        const row = ['PHP opcache enabled on Prod', status];
        statusTable.addRow(row);
        maintenanceBot.writeReport(statusTable.html());
        expect(phpModules).to.be.an('array');
        expect(phpModules).to.contain('opcache');
      });
      */
      it('Add table to report', function*(){
        mod.writeReport(statusTable.html());
      });
    });
  };
};

module.exports = maintenanceModule;
