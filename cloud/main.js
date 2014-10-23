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
/*
 * Purchase an item from the Parse Store using the Stripe
 * Cloud Module.
 *
 * Expected input (in request.params):
 *   item           : String, can be "Mug, "Tshirt" or "Hoodie"
 *   size           : String, optional for items like the mug
 *   cardToken      : String, the credit card token returned to the client from Stripe
 *   name           : String, the buyer's name
 *   email          : String, the buyer's email address
 *   address        : String, the buyer's street address
 *   city_state     : String, the buyer's city and state
 *   zip            : String, the buyer's zip code
 *
 * Also, please note that on success, "Success" will be returned.
 */
Parse.Cloud.define("purchaseItem", function(request, response) {
	// The Item and Order tables are completely locked down. We
	// ensure only Cloud Code can get access by using the master key.
	Parse.Cloud.useMasterKey();

	// Top level variables used in the promise chain. Unlike callbacks,
	// each link in the chain of promise has a separate context.
	var item, order, current_campaign;

	// We start in the context of a promise to keep all the
	// asynchronous code consistent. This is not required.
	Parse.Promise.as().then(function() {
		var queryCampaign = new Parse.Query('Post');
		queryCampaign.include('created_by');

		return queryCampaign.get(request.params.item).then(null, function() {
			console.log('Get campaign failed. Error: ' + error);
			return Parse.Promise.error('An error has occurred. Your credit card was not charged.');
		});
	}).then(function(campaign) {
        console.log('found campaign and save new order');

		item = current_campaign = campaign;
		// We have items left! Let's create our order item before
		// charging the credit card (just to be safe).
		order = new Parse.Object('Order');
		order.set('item', campaign);
		order.set('email', request.params.email);
		order.set('address', request.params.address);
		order.set('zip', request.params.zip);
		order.set('city_state', request.params.city_state);
		order.set('size', request.params.size || 'N/A');
		order.set('total', parseInt(request.params.total));
		order.set('fulfilled', false);
		order.set('charged', false); // set to false until we actually charge the card

		// Create new order
		return order.save().then(null, function(error) {
			// This would be a good place to replenish the quantity we've removed.
			// We've ommited this step in this app.
			console.log('Creating order object failed. Error: ' + error);
			return Parse.Promise.error('An error has occurred. Your credit card was not charged.');
		});
	}).then(function(order) {
		var userQuery = new Parse.Query('User');

        if (request.params.cardToken) {
		    userQuery.equalTo('cc_token', request.params.cardToken);
        } else {
            userQuery.equalTo('objectId', request.params.userId);
        }

		// Find the resuts. We handle the error here so our
		// handlers don't conflict when the error propagates.
		// Notice we do this for all asynchronous calls since we
		// want to handle the error differently each time.
		return userQuery.first().then(null, function(error) {
			return Parse.Promise.error('Sorry, this credit card token is not valid.');
		});

	}).then(function(user) {
		if (!user) return Parse.Promise.error('Invalid token, please update with a valid credit card.');

		console.log('got the user with cusotmer id ' + user.get('customer_id'));
		if (user.get('customer_id')) {
			// Now we can charge the credit card using Stripe and the credit card token.
			return Stripe.Customers.retrieve(user.get('customer_id')).then(null, function(error) {
				console.log('Charging with stripe failed. Error: ' + error);
				return Parse.Promise.error('An error has occurred. Your credit card was not charged.');
			});
		} else {
			return Stripe.Customers.create({
				description: "Customer",
				card: request.params.cardToken
			}).then(function(customer) {
				console.error('Customer created!!!' + customer.id);
				user.set("customer_id", customer.id);
				user.save().then(null, function(error) {});
				return customer;
			}, function(error) {
				console.log('Charging with stripe failed. Error: ' + error);
				return Parse.Promise.error(error.message);
			});
		}
	}).then(function(customer) {
		return Stripe.Charges.create({
			amount: Math.floor(request.params.total * 100),
			// express dollars in cents
			currency: 'usd',
			customer: customer.id
		}).then(null, function(error) {
			console.log('Charging with stripe failed. Error: ' + error);
			return Parse.Promise.error(error.message);
		});
	}).then(function(purchase) {
		// Credit card charged! Now we save the ID of the purchase on our
		// order and mark it as 'charged'.
		order.set('stripePaymentId', purchase.id);
		order.set('fulfilled', true);
		order.set('charged', true);

        if (request.params.increaseDonateSum && current_campaign) {
            var donate_money = 0;

            if (current_campaign.get('donate_money'))
                donate_money = parseFloat(current_campaign.get('donate_money'));

            var donateMoney = donate_money + parseFloat(request.params.total);

            current_campaign.set('donate_money', donateMoney);
            current_campaign.save().then(function(_campaign){
                console.log('saved campaign');
            },
            function(error){
                console.log('error to save campaign', error);
            });
        }

		// Save updated order
		return order.save().then(null, function(error) {
			// This is the worst place to fail since the card was charged but the order's
			// 'charged' field was not set. Here we need the user to contact us and give us
			// details of their credit card (last 4 digits) and we can then find the payment
			// on Stripe's dashboard to confirm which order to rectify.
			return Parse.Promise.error('A critical error has occurred with your order. Please ' + 'contact support@makeastand.com at your earliest convinience. ');
		});

	}).then(function(result) {
		var queryUser = new Parse.Query('User');
		queryUser.equalTo('email', request.params.email);

		return queryUser.first().then(null, function(error) {
			return response.error('Your purchase was successful, but we were not able to ' + 'send you an email. Contact us at support@makeastand.com if ' + 'you have any questions.');
		});
	}).then(function(fundedUser) {
	    console.log('User funded notification config: ' + fundedUser.get('notification_config'));
        console.log(item);
		var userCreatedEmail, 
            createdBy = item.get('created_by');

		if (checkNotificationConfig(createdBy, 'campaign_given')) {
			userCreatedEmail = createdBy.get('email') || '';
			console.log(userCreatedEmail);

			if (userCreatedEmail) {
				console.log('Send mail for ' + userCreatedEmail);
				var userCreatedEmail = item.get('created_by').get('email');

				var emailDict = {
					templateName: 'funding',
					data: {
						total: request.params.total,
						campaign: item.toJSON()
					},
					to: [{
						email: userCreatedEmail
					}]
				};

				Parse.Cloud.run('sendMail', emailDict);
			}
		} else {
			console.log('campaign_given: false');
		}
        
        var donate_money = parseInt(item.get('donate_money')) + parseInt(request.params.total);
        var campaign_money = item.get('campaign_money');
        
		if (donate_money >= campaign_money && !item.get('is_fund_completed')) {
			console.log('notification achieved goal');
			Parse.Cloud.run('sendMailBackground', {
				campaignId: item.id
			});
		}

		//checkNotificationConfig(fundedUser, 'give')
		console.log('notification give');

		var emailDictFunded = {
			templateName: 'campaign_funded',
			data: {
				total: request.params.total,
				organization: item.get('post_organization'),
				campaign: item.toJSON()
			},
			to: [{
				email: request.params.email,
				name: request.params.name || ''
			}]
		};

		Parse.Cloud.run('sendMail', emailDictFunded, {
			success: function(httpResponse) {
				console.log(httpResponse);
				response.success("Email sent!");
			},
			error: function(error) {
				console.error(httpResponse);
				response.error('Your purchase was successful, but we were not able to ' + 'send you an email. Contact us at support@makeastand.com if ' + 'you have any questions.');
			}
		});

	}).then(function() {
		// And we're done!
        if (current_campaign) {
            return response.success(current_campaign.toJSON());
        } else {
		    return response.success('Success!!!!!!');
        }

		// Any promise that throws an error will propagate to this handler.
		// We use it to return the error from our Cloud Function using the
		// message we individually crafted based on the failure above.
	}, function(error) {
		return response.error(error);
	});
});

Parse.Cloud.define("emailInvite", function(request, response) {
	// The Item and Order tables are completely locked down. We
	// ensure only Cloud Code can get access by using the master key.
	Parse.Cloud.useMasterKey();

	Mandrill.sendEmail({
		message: {
			text: request.params.body,
			subject: request.params.subject,
			from_email: "noreply@makeastand.com",
			from_name: "Make A Stand",
			to: [{
				email: request.params.email_to,
				name: request.params.email_to_name
			}]
		},
		async: true
	}, {
		success: function(httpResponse) {
			console.log(httpResponse);
			response.success("Email sent!");
		},
		error: function(httpResponse) {
			console.error(httpResponse);
			response.error("Uh oh, something went wrong");
		}
	});

});

Parse.Cloud.define("sendFeedBack", function(request, response) {
	// The Item and Order tables are completely locked down. We
	// ensure only Cloud Code can get access by using the master key.
	Parse.Cloud.useMasterKey();
	console.log('sendFeedBack - OK');

	var emailDict = {
		templateName: 'feedback',
		to: [{
			email: request.params.from_email,
			name: request.params.from || ''
		}]
	};

	Parse.Cloud.run('sendMail', emailDict);

	Mandrill.sendEmail({
		message: {
			text: request.params.body,
			subject: "[Make A Stand iOS] You've got a new feedback",
			from_email: "noreply@makeastand.com",
			from_name: "Make A Stand",
			to: [{
				email: "johnc@simpleunion.com",
				name: "John"
			}]
		},
		async: true
	}, {
		success: function(httpResponse) {
			console.log(httpResponse);
			response.success("Email sent!");
		},
		error: function(httpResponse) {
			console.error(httpResponse);
			response.error("Uh oh, something went wrong");
		}
	});
});

Parse.Cloud.define("updateCC", function(request, response) {
	// The Item and Order tables are completely locked down. We
	// ensure only Cloud Code can get access by using the master key.
	Parse.Cloud.useMasterKey();
	console.log('updateCC ...');
	console.log(request.params.cardToken);

	Parse.Promise.as().then(function() {
		var userQuery = new Parse.Query('User');
		userQuery.equalTo('cc_token', request.params.cardToken);

		// Find the resuts. We handle the error here so our
		// handlers don't conflict when the error propagates.
		// Notice we do this for all asynchronous calls since we
		// want to handle the error differently each time.
		return userQuery.first().then(null, function(error) {
			return Parse.Promise.error('Sorry, this credit card token is not valid.');
		});
	}).then(function(user) {
		console.log(user);
		return Stripe.Customers.create({
			description: "Customer",
			card: request.params.cardToken
		}).then(function(customer) {
			console.error('Customer created!!!' + customer.id);
			if(!user) return customer;
			user.set("customer_id", customer.id);
			user.save().then(null, function(error) {});
			return customer;
		}, function(error) {
			console.log('Failed to create customer Error: ' + error);
			return Parse.Promise.error('Error during create customer. Your credit card was not charged.');
		});
	});

});

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

Parse.Cloud.define("sendMailBackground", function(request, response) {
	// The Item and Order tables are completely locked down. We
	// ensure only Cloud Code can get access by using the master key.
	Parse.Cloud.useMasterKey();

	var campaignId = request.params.campaignId;
	var queryPost = new Parse.Query('Post'),
		queryOrder = new Parse.Query('Order'),
		queryUser = new Parse.Query('User'),
		emailDict, emailList = [],
		fundedUser;

	queryPost.include('created_by');
	queryPost.get(campaignId).then(function(campaign) {
		if (!campaign) {
            console.log('Campaign is not found.');
            return
		};

		campaign.set('completedDate', new Date());
		campaign.set('is_fund_completed', true);
		campaign.save().then(function(campaign) {
			queryOrder.exists('email');
			queryOrder.equalTo('item', campaign);
			queryOrder.find().then(function(results) {

				for (var i = 0; i < results.length; i++) {
					var email = results[i].get('email');

					if (emailList.indexOf(email) == -1) 
                        emailList.push(email);
				}

				console.log('emailList: ' + emailList);
				queryUser.containedIn('email', emailList);
				queryUser.find().then(function(userList) {
					console.log(userList);
					var createdBy = campaign.get('created_by');
					var userCreatedEmail = createdBy ? (createdBy.get('email') || '') : '';
                    var campaignJSON = campaign.toJSON();

					if (userCreatedEmail && checkNotificationConfig(createdBy, 'reach_goal')) {
						console.log('Send mail for created_by: ' + userCreatedEmail);
						emailDict = {
							templateName: 'achieved_goal',
							data: {
								campaign: campaignJSON
							},
							to: [{
								email: userCreatedEmail
							}]
						};

						Parse.Cloud.run('sendMail', emailDict);
					}

					for (var j = 0; j < userList.length; j++) {
						fundedUser = userList[j];
						var email = fundedUser.get('email');
						var checkNotifi = checkNotificationConfig(fundedUser, 'give_reach_goal');

						if (checkNotifi) {
							console.log('Send mail for ' + email);
							emailList.pop(email);
							emailDict = {
								templateName: 'campaign_reach_their_goals',
								data: {
									campaign: campaignJSON
								},
								to: [{
									email: email
								}]
							};

							Parse.Cloud.run('sendMail', emailDict);
						}
					}

					for (var k = 0; k < emailList.length; k++) {
						var email = emailList[k];
						console.log('Send mail for ' + email);
						emailDict = {
							templateName: 'campaign_reach_their_goals',
							data: {
								campaign: campaignJSON
							},
							to: [{
								email: email
							}]
						};

						Parse.Cloud.run('sendMail', emailDict);
					}
                    
					response.success('Email sending');
				}, function(error) {
					console.log(error);
					response.error("Uh oh, something went wrong");
				});
			}, function(error) {
				response.error("Uh oh, something went wrong");
			});
		}, function(error) {
			response.error("Uh oh, something went wrong");
		});
	}, function() {
		response.error("Uh oh, something went wrong");
	});
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

Parse.Cloud.define("likeCampaign", function(request, response) {
	// The Item and Order tables are completely locked down. We
	// ensure only Cloud Code can get access by using the master key.
	Parse.Cloud.useMasterKey();

	var campaignId = request.params.campaignId;
	var query = new Parse.Query('Post');

	query.include('created_by');
	query.get(campaignId).then(function(campaign) {
		if (!campaign) response.error("Campaign not found");
		var createdBy = campaign.get('created_by');

		if (checkNotificationConfig(createdBy, 'like')) {
			var email = createdBy.get('email');
			var emailDict = {
				templateName: 'like',
				data: {
					campaign: campaign.toJSON()
				},
				to: [{
					email: email,
					name: createdBy.get('username') | ''
				}]
			};

			if (email) {
				Parse.Cloud.run('sendMail', emailDict);
			}

			response.success('Success');
		}
	}, function(error) {
		cosole.log(error);
		response.error("Uh oh, something went wrong");
	});
});

Parse.Cloud.define("shareCampaign", function(request, response) {
	// The Item and Order tables are completely locked down. We
	// ensure only Cloud Code can get access by using the master key.
	Parse.Cloud.useMasterKey();

	var campaignId = request.params.campaignId;
	var query = new Parse.Query('Post');

	query.include('created_by');
	query.get(campaignId).then(function(campaign) {
		if (!campaign) response.error("Campaign not found");
		var createdBy = campaign.get('created_by');

		if (checkNotificationConfig(createdBy, 'share')) {
			var email = createdBy.get('email');
			var emailDict = {
				templateName: 'share',
				data: {
					campaign: campaign.toJSON()
				},
				to: [{
					email: email,
					name: createdBy.get('username') | ''
				}]
			};

			if (email) {
				Parse.Cloud.run('sendMail', emailDict);
			}
		}
        
    	response.success("Success");
	}, function(error) {
		cosole.log(error);
		response.error("Uh oh, something went wrong");
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

function checkNotificationConfig(user, notificationType) {
	var notificationConfig = {
		like: true,
		share: true,
		give: true,
		campaign_given: true,
		reach_goal: true,
		give_reach_goal: true
	};

	if (!user) return false;
	if (user.get('notification_config')) {
		notificationConfig = user.get('notification_config').email;
	}

	return notificationConfig[notificationType];
}