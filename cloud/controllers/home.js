var _ = require('underscore');
var Contact = Parse.Object.extend('Contact');

exports.index = function(req, res) {
	res.render('home/index');
};

exports.showPage = function(req, res) {
    var query = new Parse.Query('StaticPage');
    var slug = req.params.slug;
    console.log(slug);
    
    query.equalTo('slug', slug);
    query.first().then(function(result){
        console.log(result);
        res.render('home/page', {
            page: result
        });
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};

exports.contact = function(req, res) {
    var email = req.body.email;
    if(email){
        var message;
        var data = {
			templateName: 'contact',
			to: [{
				email: email
			}]
        };

        var contact = new Contact();
        contact.set('firstName', req.body.firstname);
        contact.set('lastName', req.body.lastname);
        contact.set('message', req.body.message);
        contact.set('email', email);
        
        contact.save().then(function(contact){
            console.log(contact);
            
            Parse.Cloud.run('sendMail', data, {
        		success: function() {
        			message = 'Email sent. Thank you!';
                    res.render('home/contact', {message: message});
        		},
        		error: function(error) {
        			message = 'Your contact was successful, but we were not able to send you an email.';
                    res.render('home/contact', {message: message});
        		}
        	});
        }, function(error){
            console.error(error);
            res.render('home/contact', {message: error.message});
        });
    } else {
        res.render('home/contact');
    }
};