'use strict';

const Nightmare = require('nightmare');
const expect = require('chai').expect;

describe('Drupal', function () {
  // Recommended: 5s locally, 10s to remote server, 30s from airplane ¯\_(ツ)_/¯
  this.timeout('30s');

  let nightmare = null;
  beforeEach(() => {
    // show true lets you see wth is actually happening :)
    nightmare = new Nightmare({ show: false })
  });

  // describe('given valid credentials', () => {
  //   it('should log in', done => {
  //     nightmare
  //     .goto('http://ensono.local/user')
  //     .insert('#edit-name', 'stormtrooper')
  //     .insert('#edit-pass', '')
  //     .click('#edit-submit')
  //     .wait('#admin-menu-menu')
  //     .click('href=/admin/content')
  //     .evaluate(() =>
  //       document.querySelector('.page-title').innerText
  //     )
  //     .end()
  //     .then((heading) => {
  //       expect(heading).to.equal('stormtrooper');
  //       done();
  //     })
  //     .catch(done)
  //   });
  // });

  describe('given basic content', () => {
    it('should post it', done => {
      nightmare
        .goto('http://ensono.local/user')
        .insert('#edit-name', 'stormtrooper')
        .insert('#edit-pass', '')
        .click('#edit-submit')
        .wait('#admin-menu-menu')
        .click('a[href="/admin/content"]')
        .wait(1000)
        .click('.action-links a[href="/node/add"]')
        .wait(1000)
        .click('.admin-list a[href="/node/add/page"]')
        .wait(1000)
        .insert('#edit-title', 'test test test')
        .click('#edit-submit')
        .wait('.messages.status')
        .evaluate(() =>
          document.querySelector('.messages.status').innerText
        )
        .end()
        .then((heading) => {
          expect(heading).to.equal('Status message Basic page test test test has been created.');
          done();
        })
        .catch(done)

    });
  });
});
