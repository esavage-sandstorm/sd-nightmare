'use strict';

const Nightmare = require('nightmare');
const expect = require('chai').expect;
// Get form fields
Nightmare.action('formFields', function(formSelector, done) {
  //`this` is the Nightmare instance
  this.evaluate_now((formSelector) => {
    //fill in inputs
    var inputs = Array.from(document.querySelectorAll(formSelector+' input')).map((element) => element);
    for (var i=0;i<inputs.length;i++) {
      switch(inputs[i].type){
        case 'email':
          inputs[i].value='test@nightmarejs.com';
          break;
        case 'submit':
          break;
        case 'number':
          inputs[i].value = 42;
          break;
        default: // text
          if (inputs[i].name.toLowerCase().indexOf('name') > -1) {

            if (inputs[i].name.toLowerCase().indexOf('first') > -1) {
              var firstnames=['Mary', 'John', 'Sally', 'Bob', 'Penelope', 'Beauregard'];
              var x = Math.floor(Math.random() * firstnames.length);
              var name = firstnames[x];
              inputs[i].value = name;
            }

            else if (inputs[i].name.toLowerCase().indexOf('last') > -1) {
              var lastnames=['Smith', 'McGillicudy', 'Kissinger', 'Xi', 'Torrez', 'Greene'];
              var x = Math.floor(Math.random() * lastnames.length);
              var name = lastnames[x];
              inputs[i].value = name;
            }

            else if (inputs[i].name.toLowerCase().indexOf('company') > -1) {
              inputs[i].value = 'Sandstorm Design';
            }

            else {
              inputs[i].value = 'nobody';
            }

          } else {
            inputs[i].value='lorem ipsum';
          }
          break;
      }
    }
    //fill in selects
    var selects = Array.from(document.querySelectorAll(formSelector+' select')).map((element) => element);

    for (var i=0;i<selects.length;i++) {
      var b = Math.floor(Math.random() * selects[i].options.length);
      selects[i].options[b].setAttribute('selected', 'selected');
    }
    //fill in textareas
    var textareas = Array.from(document.querySelectorAll(formSelector+' textarea')).map((element) => element);

    for (var i=0;i<textareas.length;i++) {
      textareas[i].value='This is Nightmare';
    }
      return;
  //pass done as the first argument, other arguments following
  }, done, formSelector);
});
// end
//
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
  testForm(inputs, selects) {
    //Fill in all inputs
    for (var field in selects) {
      var value = inputs[field];
      this.insert('#'+field, value)
      .wait(500);
    }
    for (var field in selects) {
      var value = selects[field];
      this.select('#'+field, value)
      .wait(500);
    }
    return this;
  }

}


// Environment Variables
const domain = '';
const adminUser = '';
const adminPassword = '';



describe('Drupal', function () {
  // Recommended: 5s locally, 10s to remote server, 30s from airplane ¯\_(ツ)_/¯
  this.timeout('30s');

  let nightmare = null;
  beforeEach(() => {
    // show true lets you see wth is actually happening :)
    nightmare = new ssNightmare({ show: true })
  });


  //test Action
  describe('Test Form Submit', () => {
    it('should fill in the form and submit', done => {
      const inputs = {};

      //test the form
      nightmare
        .goto(domain+'/request-info')
        .formFields('.webform-client-form')
        .wait(2000)
        .click('input[type="submit"]')
        //.fillForm('.webform-client-form')
        //evaluate success
        .wait(2000)
        .wait('.webform-confirmation')
        .evaluate(() =>
          document.querySelector('.webform-confirmation').innerText
        )
        .end()
        .then((confirmation) => {
          expect(confirmation).to.equal('Thank you, your submission has been received and someone from our team will contact you soon.');
          done();
        })
        .catch(done)
    });
  }); // End Test Action

/*
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
*/
}); // End Drupal
