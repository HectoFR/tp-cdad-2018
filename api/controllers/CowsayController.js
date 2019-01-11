/**
 * CowsayController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

var cowsay = require('cowsay');


var kue = require('kue')
var queue = kue.createQueue({
  redis:{
    port:6379,
    host: 'redis',
  }
});

var mailer = require('sails-service-mailer')('smtp', {
  from: 'cdad@l3o.eu',
  subject: 'cowsay',
  provider: {
    port: 587, // The port to connect to
    host: 'smtp.mailgun.org', // The hostname to connect to
    auth: { // Defines authentication data
      user: 'postmaster@mailgun.l3o.eu', // Username
      pass: 'fedbe91ae5e3529f94528dd311bea4c9-060550c6-d42c872f', // Password
    }
  }
});

queue.process('email', function(job, done){
  mailer.send({
    to: job.data.title,
    text: job.data.body
  })
  .then((res) => console.log(res))
  .catch((res) => console.log(res));
});

module.exports = {
  /**
   * `CowsayController.say()`
   */
  say: async function (req, res) {
    let count = await Sentences.count();
    console.debug('Got '+count+' sentences in database');
    let s = await Sentences.find().limit(1).
      skip(Math.floor(Math.random() * Math.floor(count)));
    let sentence = "Random Message";
    if(s.length > 0) {
      sentence = s[0].sentence;
    }
    return res.view('cowsay', { cow: cowsay.say({
      f: process.env.COW || 'stegosaurus',
      text : sentence,
      e : 'oO',
      T : 'U '
    }), picture:s[0].picture});
  },

  add: async function (req, res) {
    return res.view('add');
  },

  create: async function(req, res) {
    const options =
    {
      adapter: require('skipper-better-s3')
    , key: 'AKIAJOCSBD4KTGNIE2YQ'
    , secret: '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'
    , bucket: 'lp-cdad-2018'
    , region: 'eu-west-3' 
    , s3params:
        { ACL: 'public-read'
        }
    }

    await req.file('file').upload(options, (err, files) => {

      if (err) {
        console.log("erreur:", err)
      }else{
        Sentences.create(
          { sentence: req.param('sentence'), picture: files[0].extra.Location }
        )

        queue.create('email', {
          to: 'cyrilheckmann@gmail.com',
          body: 'Merci pour la sentence "'+ req.param('sentence') +  '"'
        }).save();

      }
    })

    return res.redirect('/say');
  }
};
