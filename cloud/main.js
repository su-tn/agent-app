var _ = require('underscore');

/* Initialize the Stripe and Mailgun Cloud Modules */
var Stripe = require('stripe');
Stripe.initialize('sk_test_Ku1DLSgGYeMWuyJgAvSVBwnU');

var Mandrill = require('mandrill');
Mandrill.initialize('guoCnuyjhOsZTFFXXH0ydg');

// Include the Twilio Cloud Module and initialize it
var twilio = require("twilio");
twilio.initialize("AC083513ef2cdc26594bc082d9d8456060", "75ffe57fd4160c2a8f092cbeb2cd077d");

require('cloud/app.js');

Parse.Cloud.define("signUpEmailNotify", function(request, response) {
	// The Item and Order tables are completely locked down. We
	// ensure only Cloud Code can get access by using the master key.
	Parse.Cloud.useMasterKey();

	var emailDict = {
		templateName: 'sign_up',
		to: [{
			email: request.params.email_to,
			name: request.params.email_to_name || ''
		}]
	};

	Parse.Cloud.run('sendMail', emailDict);
	response.success('Success');
});

Parse.Cloud.define("sendMail", function(request, response) {
	// The Item and Order tables are completely locked down. We
	// ensure only Cloud Code can get access by using the master key.
	Parse.Cloud.useMasterKey();
	var emailDict = request.params;

	console.log('Send Mail!');

	var EmailTemplate = Parse.Object.extend('EmailTemplate');
	var query = new Parse.Query(EmailTemplate);
	var body, data, bcc;

	query.equalTo('name', emailDict.templateName);
	query.first().then(function(result) {
		console.log(result);

		if (!result) {
			console.log('Not found email template');
			response.success('Not found email template');
			return;
		}

		var bodyTemplate = result.get('body') || '';
		body = _.template(bodyTemplate, (emailDict.data || {}));

		data = {
			message: {
				html: body,
				subject: emailDict.subject || result.get('subject'),
				from_email: "noreply@agentapp.com",
				from_name: "AgentApp",
				to: emailDict.to
			},
			async: true
		};

		bcc = emailDict.bcc || result.get('bcc');
		if (bcc) data.bcc_address = bcc;

		Mandrill.sendEmail(data, {
			success: function(httpResponse) {
				response.success('Email sent!');
			},
			error: function(httpResponse) {
				console.error(httpResponse);
				response.error("Uh oh, something went wrong");
			}
		});

	}, function() {
		response.error("Failed sending mail");
	});
});

// Create the Cloud Function
Parse.Cloud.define("sendSMS", function(request, response) {
	Parse.Cloud.useMasterKey();
    var template = request.params.template;
    var contacts = request.params.contacts;
    var campaignId = request.params.campaignId;
    var queryPost = new Parse.Query('Post');
    var query = new Parse.Query('EmailTemplate');
    var bodyTemplate;
    
    query.equalTo('name', template);
    query.first().then(function(result){
		console.log(result);
        if(result){
    		bodyTemplate = result.get('body');           
        }
        
        if(!campaignId){
        	for (var i = 0; i < contacts.length; i++) {
                var phone = contacts[i].phone;
                phone = phone.split(' ').join('');
                var name =  contacts[i].firstName;
                var body = _.template(bodyTemplate, {contactName: name});
        		console.log('phoneNumber: ' + phone);
        
        		// Use the Twilio Cloud Module to send an SMS
        		twilio.sendSMS({
        			From: "+1 415-692-0011",
        			To: phone,
        			Body: body
        		}, {
        			success: function(httpResponse) {
                        console.log(httpResponse);
        				response.success("SMS sent!");
        			},
        			error: function(httpResponse) {
        				console.log(httpResponse);
        				response.error("Uh oh, something went wrong");
        			}
        		});
        	}
            
        	response.success("Success");
        } else{
            queryPost.get(campaignId).then(function(campaign){
                if(!campaign) {
                    console.log("Campaign is not found.");
                    response.success("Success");
                }
                
            	for (var i = 0; i < contacts.length; i++) {
                    var phone = contacts[i].phone;
                    phone = phone.split(' ').join('');
                    var name =  contacts[i].firstName;
                    var body = _.template(bodyTemplate, {campaign:campaign, contactName: name});
            		console.log('phoneNumber: ' + phone);
            
            		// Use the Twilio Cloud Module to send an SMS
            		twilio.sendSMS({
            			From: "+1 415-692-0011",
            			To: phone,
            			Body: body
            		}, {
            			success: function(httpResponse) {
                            console.log(httpResponse);
            				response.success("SMS sent!");
            			},
            			error: function(httpResponse) {
            				console.log(httpResponse);
            				response.error("Uh oh, something went wrong");
            			}
            		});
            	}
            
                response.success("Success");
                
            }, function(error){
                console.error(error);
                response.error("Uh oh, something went wrong.");
            });
        }
    }, function(error){
        console.error(error);
        response.error("Uh oh, something went wrong.");
    });
    
});