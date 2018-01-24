'use strict';

const Nightmare = require('nightmare');

// Extension method allows us to define custom functions in a way that nightmare.action() doesn't seem to allow
class ssNightmare extends Nightmare {

  drupalLogin(url, user, pass) {
    return this //this = nightmare
    .goto(url+'/user')
    .insert('#edit-name', adminUser)
    .insert('#edit-pass', adminPassword)
    .click('#edit-submit')
    .wait('#admin-menu-menu')
  }
  createPage(title) {
    return this
      //login?
      .click('a[href="/admin/content"]')
      .wait(1000)
      .click('.action-links a[href="/node/add"]')
      .wait(1000)
      .click('.admin-list a[href="/node/add/page"]')
      .wait(1000)
      .insert('#edit-title', title)

      .click('#edit-submit')
      .wait('.messages.status')
  }
}
const expect = require('chai').expect;

// Environment Variables
const domain = 'http://ensono.local';
const adminUser = 'stormtrooper';
const adminPassword = 'firstStorm#99';



describe('Drupal', function () {
  // Recommended: 5s locally, 10s to remote server, 30s from airplane ¯\_(ツ)_/¯
  this.timeout('30s');

  let nightmare = null;
  beforeEach(() => {
    // show true lets you see wth is actually happening :)
    nightmare = new ssNightmare({ show: true })
  });

/*

  //test Action
  describe('Test Login', () => {
    it('should login to the Drupal Admin', done => {
      nightmare
        .drupalLogin(domain, adminUser, adminPassword)
        //evaluate success
        .wait('.page-title')
        .wait(1000)
        .evaluate(() =>
          document.querySelector('.page-title').innerText
        )
        .end()
        .then((title) => {
          expect(title).to.equal(adminUser);
          done();
        })
        .catch(done)
    });
  }); // End Test Action

*/
  //Post Basic Content
  describe('given basic content', () => {
    it('should create a page', done => {

      var title = 'spatula';
      nightmare
        .drupalLogin(domain, adminUser, adminPassword)
        .createPage(title)

        // Evaluate
        .wait('.messages.status')
        .evaluate(() =>
          document.querySelector('.messages.status').innerText
        )
        .end()
        .then((heading) => {
          expect(heading).to.equal('Status message Basic page '+title+' has been created.');
          done();
        })
        .catch(done)

    });
  }); // End Post Basic Content
}); // End Drupal
