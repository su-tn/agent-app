var _ = require('underscore');


exports.index = function(req, res) {
    if (Parse.User.current()) {
		Parse.User.current().fetch().then(function(user) {
			console.log(user);
            
            res.render('home/index', {isAuthenticated: true});
        });
    } else {
	   res.render('home/index');
    }
};

exports.showPage = function(req, res) {
    var query = new Parse.Query('StaticPage');
    var slug = req.params.slug;
    console.log(slug);
    
    query.equalTo('slug', slug);
    query.first().then(function(result){
        console.log(result);
        if (Parse.User.current()) {
    		Parse.User.current().fetch().then(function(user) {
    			console.log(user);
                
                res.render('home/page', {isAuthenticated: true, page: result});
            });
        } else {
            res.render('home/page', {
                page: result
            });
        }
    },
    function() {
        res.send(500, 'Failed loading page');
    });
};

exports.contact = function(req, res) {
    if (Parse.User.current()) {
		Parse.User.current().fetch().then(function(user) {
			console.log(user);
            
            res.render('home/contact', {isAuthenticated: true});
        });
    } else {
        res.render('home/contact');
    }
	
};