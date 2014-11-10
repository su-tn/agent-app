
var searchBlog = function(e){
    var keyword = $('#search-txt').val();
    if(!keyword) return false;
    
    $('#search-form').submit();
}

var clearForm = function(formId){
    $(formId + ' input:not(.hidden-input)').val('');
    $(formId + ' textarea').val('');
    $("input[type=checkbox]").attr("checked", false);
    //$("input[type=radio]").attr("checked", false);
    return false;
}

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

var signup1 = function(){
    $('form input').removeClass('error');
    $('.error').hide();
    
    var email = $('#email').val();
    var confirmEmail = $('#confirm-email').val();
    var password = $('#password').val();
    
    if (!email) {
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is required').show();
        return;
    }
    
    if(!validateEmail(email)){
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is not valid').show();
        return;
    }
    
    if (!confirmEmail) {
        $('#confirm-email').addClass('error');
        $('#confirm-email').next('.error').text('Confirm email is required').show();
        return;
    }
    
    if(confirmEmail != email){
        $('#confirm-email').addClass('error');
        $('#confirm-email').next('.error').text('Confirm email does not match').show();
        return;
    }
    
    if (!password) {
        $('#password').addClass('error');
        $('#password').next('.error').text('Password is required').show();
        return;
    }
    
    if(password.length < 6){
        $('#password').addClass('error');
        $('#password').next('.error').text('Password must be greater than or equal 6 characters').show();
        return;
    }
    
    $.post('/signup-1',{email: email, password: password}, function(res){
        if(res.error) {
            $('#email').addClass('error');
            $('#email').next('.error').text(res.error).show();
            return;
        } else {
            window.location.href='/signup-2';
        } 
    })
}

var submitLogin = function(){
    $('form input').removeClass('error');
    $('.error').hide();
    
    var email = $('#email').val();
    var password = $('#password').val();
    
    if (!email) {
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is required').show();
        return;
    }
    
    if(!validateEmail(email)){
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is not valid').show();
        return;
    }
    
    if (!password) {
        $('#password').addClass('error');
        $('#password').next('.error').text('Password is required').show();
        return;
    }
}

var signupAgentVerify = function(){
    $('form input').removeClass('error');
    $('.error').hide();
    
    var agentId = $('#agent-id').val();
    var email = $('#email').val();
    var confirmEmail = $('#confirm-email').val();
    var password = $('#password').val();
    
    if (!agentId) {
        $('#agent-id').addClass('error');
        $('#agent-id').next('.error').text('Agent ID is required').show();
        return;
    }
    
    if (!email) {
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is required').show();
        return;
    }
    
    if(!validateEmail(email)){
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is not valid').show();
        return;
    }
    
    if (!confirmEmail) {
        $('#confirm-email').addClass('error');
        $('#confirm-email').next('.error').text('Confirm email is required').show();
        return;
    }
    
    if(confirmEmail != email){
        $('#confirm-email').addClass('error');
        $('#confirm-email').next('.error').text('Confirm email does not match').show();
        return;
    }
    
    if (!password) {
        $('#password').addClass('error');
        $('#password').next('.error').text('Password is required').show();
        return;
    }
    
    $.post('/signup-agent-verify',{agent_id: agentId, email: email, password: password}, function(res){
        if(res.error) {
            $('#email').addClass('error');
            $('#email').next('.error').text(res.error).show();
            return;
        } else {
            window.location.href='/signup-2-agent';
        } 
    })
}

var updateProfile = function(){
    $('.error').text('');
    $('.loading_content').show();
    var data = {
        firstName: $('#first-name').val(),
        lastName: $('#last-name').val(),
        agentId: $('#agent-id').val(),
        password: $('#password').val()
    }
    
    $.post('account/update-profile', data, function(res){
        console.log(res);
        $('.loading_content').hide();
        if(res.error) $('.error').text(res.error);
    })
}

var updateProfileQuestion = function(){
    $('.error').text('');
    $('.loading_content').show();
    
    $.post('account/update-profile-question', $('#dash_qs_form').serialize(), function(res){
        console.log(res);
        
        if(res.error) {
            $('.loading_content').hide();
            showMessage('Error', res.error);
        } else {
            window.location.reload();
        }
    })
}

var showMessage = function(title, message){
    $('#message-modal .modal-title').text(title || 'Alert');
    if(message) $('#message-modal .modal-body > p').text(message);
    
    $('#message-modal').modal('show');
}

$('#contact_form').submit(function(){
    $('form input').removeClass('error');
    $('.error').hide();
    
    var email = $('#email').val();
    var message = $('#message').val();
    
    if (!message) {
        $('#message').addClass('error');
        $('#message').next('.error').text('Message is required').show();
        return;
    }
    
    if (!email) {
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is required').show();
        return;
    }
    
    if(!validateEmail(email)){
        $('#email').addClass('error');
        $('#email').next('.error').text('Email is not valid').show();
        return;
    }
    
    this.submit();
})

var tapAgent = function(agentId){
    $('.loading_content').show();
    $.post('/agent/tap', {agentId: agentId}, function(res){
        $('.loading_content').hide();
        console.log(res);
        if(res.error) showMessage('Error', res.error);
        else window.location = '/dashboard';
    })
}

var sendProposal = function(userId){
    $('#send-proposal-form input[type="hidden"]').val('');
    $('#send-proposal-form #user_id').val(userId);
    $('#agent-send-proposal').modal('show');
}

var submitSendProposal = function(){
    var fileUploadControl = $('#proposal')[0];
    if (fileUploadControl.files.length <= 0) {
        showMessage('Error', 'Proposal file is required');
        return false;
    }
    
    if(!$('#agree').is(':checked')){
        showMessage('Error', 'You must be agree Terms and Conditions');
        return false;
    }
    
    $('#agent-send-proposal').modal('hide');
    $('.loading_content').show();
    
    Parse.initialize("U6gB9LUOcvV0JPcDVuBteFjkUvfsT6kHBG6Ql64C", "bd6ZJN1kpxqjX6Bt7pM5id1nTpAW58RDEBxnf7rt");
    
    var file = fileUploadControl.files[0];
    var parseFile = new Parse.File(file.name, file);
    parseFile.save().then(function(proposalFile) {
        console.log(proposalFile);
        $('#send-proposal-form #file').val(proposalFile.url());
        
        $.post('/agent/send-proposal', $('#send-proposal-form').serialize(), function(res){
            if(res.error) {
                $('.loading_content').hide();
                showMessage('Error', res.error);
            } else window.location = '/dashboard-agent';
        });
    }, function(error) {
        console.log(error);
        showMessage('Error', error.message);
    });
} 

var viewProposal = function(agentId){
    $('.loading_content').show();
    $.post('/agent/view-proposal', {agentId: agentId}, function(res){
        $('.loading_content').hide();
        console.log(res);
        
        if(res.error) showMessage('Error', res.error);
        else {
            var $viewModal = $('#view-proposal');
            var proposal = res.proposal;
            var agent = res.agent;
            if(agent.image) $viewModal.find('.modal-avatar > img').attr('src', agent.image.url);
            $viewModal.find('.agent-name').text((agent.firstName || '') + ' ' + (agent.lastName || ''));
            $viewModal.find('.comment').text(proposal.comment);
            $viewModal.find('.agent-firstname').text((agent.firstName ? ('-' + agent.firstName) : ''));
            $viewModal.find('#proposal-file').attr('href', proposal.file);
            $viewModal.find('.select-button').data('agentId', agent.objectId);
            
            $viewModal.modal('show');
        }
    })
}

var chosenAgent = function(){
    $('#view-proposal').modal('hide');
    $('.loading_content').show();
    
    var agentId = $('#view-proposal .select-button').data('agentId');
    $.post('/agent/chosen', {agentId: agentId}, function(res){
        console.log(res);
        
        if(res.error) {
            $('.loading_content').hide();
            showMessage('Error', res.error);
        } else window.location = '/dashboard';
    });
}

$(function(){
    
    $('.show-tooltip').tooltip();
})