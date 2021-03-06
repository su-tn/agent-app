(function ($) {
    Parse.initialize("U6gB9LUOcvV0JPcDVuBteFjkUvfsT6kHBG6Ql64C", "bd6ZJN1kpxqjX6Bt7pM5id1nTpAW58RDEBxnf7rt");
    var StaticPage = Parse.Object.extend("StaticPage");
    var File = Parse.Object.extend("File");
    var Blog = Parse.Object.extend("Blog");
    var Tag = Parse.Object.extend("Tags");

    PageModel = function(){
        var self = this;
        self.title = ko.observable();
        self.slug = ko.observable();
        self.body = ko.observable();
        self.order = ko.observable();
        self.type = ko.observable('menu');
        self.parseObject = null;

        self.detail = function(item){
            mainViewModel.showPage(item);
        }

        self.initParseObject = function(){
            self.parseObject = new StaticPage();
        }

        self.init = function(data){
            self.initParseObject();
            self.parseObject = data;

            self.title(data.get('title'));
            self.slug(data.get('slug'));
            self.body(data.get('body'));
            self.order(data.get('order'));
            self.type(data.get('type'));
        }

        self.initEvent = function(){
            $("#page-title").keyup(function(){
                var slug = convertToSlug($(this).val());
                self.slug(slug);
            });
        }

        self.setData = function(cb){
            self.parseObject.set('title', self.title());
            self.parseObject.set('slug', self.slug());
            self.parseObject.set('order', self.order());
            self.parseObject.set('type', self.type());

            if($('.cke_button__source.cke_button_off').length == 0)
                $('.cke_button__source').click();

            var body = CKEDITOR.instances.editor1.document.getBody().getHtml();
			self.body(body);
            self.parseObject.set('body', body);
            if(cb) cb();
        }

        self.initParseObject();
    }
    
    FileModel = function(){
        var self = this;
        self.file = ko.observable();
        self.parseObject = null;

        self.detail = function(item){
            mainViewModel.showFile(item);
        }

        self.initParseObject = function(){
            self.parseObject = new File();
        }

        self.init = function(data){
            self.parseObject = data;
            self.file(data.get('file'));
        }
		
        self.setData = function(){}

        self.initParseObject();
    }

    BlogModel = function () {
        var self = this;
        self.title = ko.observable();
        self.slug = ko.observable();
        self.description = ko.observable();
        self.language = ko.observable();
        self.keywords = ko.observable();
        self.body = ko.observable();
        self.isPublished = ko.observable();
        self.image = ko.observable();
        self.summary = ko.observable();
        self.tags = ko.observableArray();
        self.parseObject = null;

        self.initParseObject = function () {
            self.parseObject = new Blog();
        }

        self.detail = function (item) {
            mainViewModel.showBlog(item);
        }

        self.init = function (data) {
            self.initParseObject();
            self.parseObject = data;

            self.title(data.get('title'));
            self.slug(data.get('slug'));
            self.description(data.get('metaDescription'));
            self.keywords(data.get('metaKeywords'));
            self.body(data.get('body'));
            self.isPublished(data.get('isPublished'));
            self.summary(data.get('summary'));
            self.tags(data.get('tags'));

            if (data.get('image'))
                self.image(data.get('image'));
        }

        self.setData = function (cb) {
            self.parseObject.set('title', self.title());
            self.parseObject.set('searchName', self.title().toLowerCase());
            self.parseObject.set('slug', self.slug());
            self.parseObject.set('metaDescription', self.description());
            self.parseObject.set('metaKeywords', self.keywords());
            self.parseObject.set('summary', self.summary());

            if ($('.cke_button__source.cke_button_off').length == 0)
                $('.cke_button__source').click();

            var body = CKEDITOR.instances.editor1.document.getBody().getHtml();
            self.body(body);
            self.parseObject.set('body', body);
            self.parseObject.set('isPublished', self.isPublished());
            
            var tags = $('#select-tags').val();
            self.tags(tags);
            self.parseObject.set('tags', tags);
            
            if(mainViewModel.isAdding()){
                self.parseObject.set('postedAt', (new Date()).toGMTString());
            }
            if(cb) cb();
        }

        self.initEvent = function(){
            $("#blog-title").keyup(function(){
                var slug = convertToSlug($(this).val());
                self.slug('/blog/' + slug);
            });
            
            CKEDITOR.replace('editor1');
        }

        self.initParseObject();
    }
    
    TagModel = function(){
        var self = this;
        self.id = ko.observable();
        self.name = ko.observable();
        self.order = ko.observable();
        self.parseObject = null;

        self.detail = function(item){
            mainViewModel.showObject(false, item);
        }

        self.initParseObject = function(){
            self.parseObject = new Tag();
        }

        self.init = function(data){
            self.parseObject = data;
            self.id(data.id);
            self.name(data.get('name'));
        }

        self.setData = function(cb){
            var oldData = self.parseObject;
            var query = new Parse.Query(Tag);
			
			query.equalTo('name', self.name());
			query.first().then(function(data){
				var isAdding = mainViewModel.isAdding();
				if((data && isAdding) || (!isAdding && data.id != oldData.id)){
					mainViewModel.showAlert('Error', 'Tag name must be unique');
					return false;
				} else {
					self.parseObject.set('name', self.name());
					if(cb) cb();
				}
			});
        }
		
		self.deleteObject = function(cb){
            var oldData = self.parseObject;
			var query = new Parse.Query(Blog);
			
			query.equalTo('tags', oldData.get('name'));
			query.first().then(function(data){
				if(data){
					mainViewModel.showAlert('Error', "You can't delete this tag");
					return false;
				} else {
					if(cb) cb();
				}
			});
		}

        self.initParseObject();
    }
    
    MainViewModel = function(){
        var self = this;
        self.showObject = ko.observable();
        self.list = ko.observableArray();
        self.pages = ko.observableArray();
        self.files = ko.observableArray();
        self.blogs = ko.observableArray();
        self.tags = ko.observableArray();

        self.object = ko.observable();
        self.isAdding = ko.observable(false);
        self.isShowConfig = ko.observable(false);

        self.alert =  ko.observable();
        self.btnAddTmpl = ko.observable();
        self.tableTmpl = ko.observable();
        self.detailTmpl = ko.observable();
        self.listTitle = ko.observable();
        self.currentPage = ko.observable(1);
        self.totalPage = ko.observable(1);
        self.visiblePages = ko.observable(10);

        self.init = function(){
            self.showPages();
            getObjects(StaticPage, PageModel, self.pages);
            getObjects(Blog, BlogModel, self.blogs);
            getObjects(Tag, TagModel, self.tags);
        }
        
        self.getItemsPage = function(list, page, callback){
            var query = new Parse.Query(Organization);
            var itemPerPage = 10;
            var offset = (page - 1) * itemPerPage;
            
            self.currentPage(page);
                        
            query.descending('createdAt');
            query.count().then(function(count) {
                var totalPage = Math.round(count / itemPerPage);
                self.totalPage(totalPage);
                
                query.limit(itemPerPage);
                query.skip(offset);
                query.find({
                    success: function(results) {
    
                        list([]);
                        $.each(results, function(idx, val){
                            var obj = new OrganizationModel();
                            obj.init(val);
                            list.push(obj);
                        });
                        
                        $('ul.pagination').prop('pointer-events', 'auto');
                        if(callback) callback();
        
                    },
                    error: function(error) {
                        alert("Error: " + error.code + " " + error.message);
                    }
                });
            });
        }

        self.showPages = function(){
            self.isShowConfig(false);
            self.object(null);
            self.tableTmpl('');
            self.list(self.pages());
            self.tableTmpl('table-page-tmpl');
            self.btnAddTmpl('btn-add-page-tmpl');
            self.detailTmpl('detail-page-tmpl');
        }

        self.showFiles = function(){
            self.object(null);
            self.tableTmpl('');
            self.list(self.files());
            self.tableTmpl('table-file-tmpl');
            self.btnAddTmpl('btn-add-file-tmpl');
            self.detailTmpl('detail-file-tmpl');
        }

        self.showBlogs = function () {
            self.object(null);
            self.tableTmpl('');
            self.list(self.blogs());
            self.tableTmpl('table-blog-tmpl');
            self.btnAddTmpl('btn-add-blog-tmpl');
            self.detailTmpl('detail-blog-tmpl');
        }

        self.showTags = function(){
            self.object(null);
            self.tableTmpl('');
            self.list(self.tags());
            self.tableTmpl('table-tag-tmpl');
            self.btnAddTmpl('btn-add-tag-tmpl');
            self.detailTmpl('detail-tag-tmpl');
        }

        self.showObject = function(isAdding, item){
            self.isAdding(isAdding);
            self.object(item);
        }

        self.showAlert = function(title, message){
            self.alert({
                'title': title,
                'message': message
            });
            $('#alert-modal').modal('show');
        }

        self.showFile = function(item){
            self.showObject(false, item);
            self.initEventUploadFile('.fileselect', 'file');
        }

        self.showBlog = function (item) {
            self.showObject(false, item);
            self.object().initEvent();
            $('#select-tags').val(self.object().tags()).select2({placeholder: "Select tags ..."});
            self.initEventUploadImage('.fileselect', 'image');
        }

        self.showPage = function(item){
            self.showObject(false, item);
            self.object().initEvent();
            CKEDITOR.replace('editor1');
        }

        self.addFile = function(item){
            self.showObject(true, new FileModel());
            self.initEventUploadFile('.fileselect', 'file');
        }

        self.addPage = function(){
            self.showObject(true, new PageModel());
            self.object().initEvent();
            CKEDITOR.replace('editor1');
        }

        self.addBlog = function () {
            self.showObject(true, new BlogModel());
            self.object().initEvent();
            $('#select-tags').val(self.object().tags()).select2({placeholder: "Select tags ..."});
            self.initEventUploadImage('.fileselect');
        }

        self.addTag = function(item){
            self.showObject(true, new TagModel());
        }

        self.deleteBlog = function(item){
            if(confirm("Are you sure want delete this item?")){
				function deleteItem(){
					item.parseObject.destroy({
					  success: function(myObject) {
						console.log(item);
						self.list.remove(item);
						self.showAlert('Alert', 'Deleted Successfully!');
					  },
					  error: function(myObject, error) {
						console.log(error);
					  }
					});
				}
				
				if(item.deleteObject){
					item.deleteObject(deleteItem)
				} else {
					deleteItem();
				}
            }
        }
        
        self.saveObject = function(){
            var item = self.object();
            
            item.setData(function(){
                if (self.isAdding()){
                    item.parseObject.save(null, {
                        success: function(pro) {
                            self.isAdding(false);
                            self.list.unshift(item);
                            self.showAlert('Alert', 'New item created');
                            $('#blog-modal').modal('hide');
                        },
                        error: function(pro, error) {
                            self.showAlert('Error', 'Failed to update item, with error code: ' + error.message);
                        }
                    });
                } else {
                    item.parseObject.save(null, {
                        success: function(pro) {
                            self.showAlert('Alert', 'Updated Successfully!');
                            $('#blog-modal').modal('hide');
                        },
                        error: function(pro, error) {
                            self.showAlert('Error', 'Failed to update item, with error code: ' + error.message);
                        }
                    });
                }
            });
        }

        self.initEventUploadFile = function(element, field){
            $(element).bind("change", function(e) {
				$("*").css("cursor", "wait");
				var files = e.target.files || e.dataTransfer.files;
				var file = files[0];
				var field = e.target.dataset.image_fied;
				
                if (self.isAdding()){
					var item = self.object();
					item.parseObject.save(null, {
						success: function(pro) {
							self.isAdding(false);
							self.list.push(item);
							self.uploadImage(file, field);
						},
						error: function(pro, error) {
							self.showAlert('Error', 'Failed to update item, with error code: ' + error.error);
						}
					});
                } else {
					self.uploadImage(file, field);
				}
            });
        }

        self.initEventUploadImage = function(element, field){
            $(element).bind("change", function(e) {
                if (self.isAdding()){
                    self.showAlert('Alert', "You must save item before upload " + field);
                    return;
                }
				$("*").css("cursor", "wait");

                var files = e.target.files || e.dataTransfer.files;
                var file = files[0];
                var field = e.target.dataset.image_fied;

                self.uploadImage(file, field);
            });
        }

        self.uploadImage = function(file, field){
            var name = file.name;
            var parseFile = new Parse.File(name, file);

            parseFile.save().then(function(response) {
                self.object().parseObject.set(field, {__type: "File", url: response._url, name: response._name});

                self.object().parseObject.save(null, {
                  success: function(pro) {
					$("*").css("cursor", "auto");
                    self.showAlert('Alert', 'Uploaded Successfully!');
                    
                    if(field == 'image'){
                        self.object().image(response);
                    } else if (field == 'imageThumb'){
                        self.object().imageThumb(response);
                    } else{
                        self.object().file(response);
                    }
                  },
                  error: function(pro, error) {
                    mainViewModel.alert({
                        'title': 'Error',
                        'message': 'Failed to upload ' + field + ', with error code: ' + error.description
                    });
                  }
                });
            });
        }
    }

    var getObjects = function(objectName, model, list, afterFunc){
        var query = new Parse.Query(objectName);
            
        query.descending('createdAt');
        query.find({
            success: function(results) {
                list([]);
                $.each(results, function(idx, val){
                    var obj = new model();
                    obj.init(val);
                    list.push(obj);
                });

                if(afterFunc) afterFunc(results);

            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }

    function convertToSlug(Text)
    {
        return Text
            .toLowerCase()
            .replace(/[^\w ]+/g,'')
            .replace(/ +/g,'-')
            ;
    }

    mainViewModel = new MainViewModel();

    getObjects(StaticPage, PageModel, mainViewModel.pages, function(data){
        ko.applyBindings(mainViewModel);
        mainViewModel.init();
    });


})(jQuery);
