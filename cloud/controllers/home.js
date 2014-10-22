var _ = require('underscore');

// Display all posts.
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
	res.render('home/contact');
};