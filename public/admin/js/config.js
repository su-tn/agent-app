$(function () {
    Parse.initialize("U6gB9LUOcvV0JPcDVuBteFjkUvfsT6kHBG6Ql64C", "bd6ZJN1kpxqjX6Bt7pM5id1nTpAW58RDEBxnf7rt");
    
    var Setting = Parse.Object.extend('Settings');
    var query = new Parse.Query(Setting);
    var setting = new Setting();
    var jsoneditor;
    var starting_value = {
        general_info:{
            name: "",
            slogan:"",
            summary: "",
            keywords:""
        },
        template:{
            header: "",
            body: "",
            footer: ""
        }
    };
    var schema_settings = {
            title: "Home",
            type: "object",
            properties: {
                general_info: {
                    type: "object",
                    title: "General Information",
                    format: "grid",
                    properties: {
                        name: {
                            title: "Name",
                            type: "string",
                            default: "Project Name"
                        },
                        slogan: {
                            title: "Slogan",
                            type: "string",
                            default: ""
                        },
                        summary: {
                            title: "Summary",
                            type: "string",
                            default: ""
                        },
                        keywords: {
                            title: "Keywords",
                            type: "string",
                            default: ""
                        }
                    }
                },
                template: {
                    type: "object",
                    title: "Template",
                    options: {collapsed: false},
                    properties: {
                        header: {
                            "type": "string",
                            "format": "html",
                            "options": {
                                "wysiwyg": true
                            }
                        },
                        body: {
                            "type": "string",
                            "format": "html",
                            "options": {
                                "wysiwyg": true
                            }
                        },
                        footer: {
                            "type": "string",
                            "format": "html",
                            "options": {
                                "wysiwyg": true
                            }
                        }
                    }
                }
            }
        };

    function reload(starting_value) {
        
        if(jsoneditor) jsoneditor.destroy();
        
        jsoneditor = new JSONEditor(document.getElementById('editor_holder'), {
            disable_edit_json: true,
            disable_properties: true,
            schema: schema_settings,
            startval: starting_value,
            theme: 'bootstrap3',
            iconlib: "fontawesome4"
        });
        
        window.jsoneditor = jsoneditor;

        // Hook up the validation indicator to update its 
        // status whenever the editor changes
        jsoneditor.on('change', function () {
            // Get an array of errors from the validator
            var errors = jsoneditor.validate();

            var indicator = document.getElementById('valid_indicator');

            // Not valid
            if (errors.length) {
                indicator.className = 'label alert';
                indicator.textContent = 'not valid';
            }
            // Valid
            else {
                indicator.className = 'label success';
                indicator.textContent = 'valid';
            }
        });

    }    

    JSONEditor.defaults.options.object_layout = 'normal';
    
    // Hook up the submit button to log to the console
    document.getElementById('submit').addEventListener('click', function () {
        // Get the value from the editor
        var errors = jsoneditor.validate();
        if (errors.length) return;
        
        var value = JSON.parse(JSON.stringify(jsoneditor.getValue()));
                
        setting.set('data', value);
        setting.save().then(function(){
            mainViewModel.showAlert("Alert", "Save Successfully!");
        });
    });
    
    reload(starting_value);
    
    query.first().then(function (result) {
        if (result) {
            setting = result;
            starting_value = result.get('data');
            reload(starting_value); 
        }
    });
})