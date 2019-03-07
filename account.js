_wizard_view_account_index = params.views.findIndex(v => v.name === 'account')

ejs.renderFile(
  params.views[_wizard_view_account_index].ejs,
  Object.assign({
    viewIndex: _wizard_view_account_index
  }, params),
  { async: false },
  (_err, _str) => {
    document.getElementById('wizard_account').innerHTML = _str

    form_params.account = {}
    form_params.account.useAlreadyExist = false
    form_params.account.login = ''
    form_params.account.mail = ''
    form_params.account.firstname = ''
    form_params.account.lastname = ''
    form_params.account.pwd = ''
    form_params.account.pwdConfirmation = ''
    form_params.account._willShowErrors = null

    document.getElementById("wizard_account_form_exist").addEventListener('input', accountExistChange);
    document.getElementById("wizard_account_form_login").addEventListener('input', accountLoginChange);
    document.getElementById("wizard_account_form_mail").addEventListener('input', accountMailChange);
    document.getElementById("wizard_account_form_firstname").addEventListener('input', accountFirstnameChange);
    document.getElementById("wizard_account_form_lastname").addEventListener('input', accountLastnameChange);
    document.getElementById("wizard_account_form_psswrd").addEventListener('input', accountPasswordChange);
    document.getElementById("wizard_account_form_psswrd_confirmtn").addEventListener('input', accountPasswordConfirmationChange);

  }
)

params.views[_wizard_view_account_index].post = function(){
  var request = new Request(params.views[_wizard_view_account_index].api)

  var ok = params.views[_wizard_view_account_index].isOk()
  if(!ok){
    request.setData({})
  } else {
    request.setData({
      login: form_params.account.login,
      email: form_params.account.mail,
      password: CryptoJS.SHA512(form_params.account.pwd).toString().toUpperCase(),
      firstname: form_params.account.firstname,
      lastname: form_params.account.lastname,
      useAlreadyExist: form_params.account.useAlreadyExist,
      deviceName: requestAlive.isLocalUrl()?params.hostname:requestAlive.getHost()
    })
  }
  return request.post()
}

params.views[_wizard_view_account_index].isOk = function(willShowErrors){
  _errors = []

  form_params.account.login = form_params.account.login.trim()
  form_params.account.mail = form_params.account.mail.trim()
  form_params.account.firstname = form_params.account.firstname.trim()
  form_params.account.lastname = form_params.account.lastname.trim()

  if(form_params.account.login === ''){
    _errors[_errors.length] = { title: 'Login', corpus: 'your login is empty'}
  }

  if(form_params.account.pwd === ''){
    _errors[_errors.length] = { title: 'Password', corpus: 'password is empty'}
  }

  if(form_params.account.useAlreadyExist === false){
    if(form_params.account.mail === ''){
      _errors[_errors.length] = { title: 'Email', corpus: 'your email is empty'}
    } else if(!validateEmail(form_params.account.mail)){
      _errors[_errors.length] = { title: 'Email', corpus: 'your email is not valid'}
    }

    if(form_params.account.firstname === ''){
      _errors[_errors.length] = { title: 'Firstname', corpus: 'firstname is empty'}
    }
    if(form_params.account.lastname === ''){
      _errors[_errors.length] = { title: 'Lastname', corpus: 'lastname is empty'}
    }

    if(form_params.account.pwd !== form_params.account.pwdConfirmation){
      _errors[_errors.length] = { title: 'Password confirmation', corpus: 'there is a diff between your password and your password confirmation'}
    }
  }

  if(willShowErrors === true || _errors.length === 0){
    showErrors(_errors, params.views[_wizard_view_account_index].order)
  }

  if(_errors.length === 0){
    return true
  }
  return false
}

params.views[_wizard_view_account_index].getResumed = function(){
  var _html = ''
  if(form_params.account.ignore){
    _html =  `The account settings will be ignored`
  } else {
    if(form_params.account.useAlreadyExist){
      _html =  `You will use the existing account for <b>${form_params.account.login}</b>.`
    } else {
      var _liStyle = 'background-color: rgba(0, 0, 0, 0); border-bottom-width: 1px;'
      _html =  `
  <ul class="collection" style="border-width:0px">
    <li style="${_liStyle}" class="collection-header"><b>Login</b><br/>${form_params.account.login || 'not set'}</li>
    <li style="${_liStyle}" class="collection-header"><b>Password</b><br/>${form_params.account.pwd.replace(/./g, "&#183;") || 'not set'}</li>
    <li style="${_liStyle}" class="collection-header"><b>Email</b><br/>${form_params.account.mail || 'not set'}</li>
    <li style="${_liStyle}" class="collection-header"><b>Firstname</b><br/>${form_params.account.firstname || 'not set'}</li>
    <li style="${_liStyle} border-bottom-width: 0px;" class="collection-header"><b>Lastname</b><br/>${form_params.account.lastname || 'not set'}</li>
  </ul>`
    }
  }
  return _html
}

function accountExistChange(e){
  form_params.account.useAlreadyExist = document.getElementById('wizard_account_form_exist').checked
  var _account_hide_on_already_exist = document.getElementsByClassName("account_hide_on_already_exist");
  if(_account_hide_on_already_exist){
    if(form_params.account.useAlreadyExist){
      for(var i=0, max=_account_hide_on_already_exist.length; i<max; i++){
        _account_hide_on_already_exist[i].classList.remove('is-visible')
      }
    } else {
      for(var i=0, max=_account_hide_on_already_exist.length; i<max; i++){
        _account_hide_on_already_exist[i].classList.add('is-visible')
      }
    }
  }
  params.views[_wizard_view_account_index].checkButtonNextStats()
  if(form_params.account._willShowErrors){
    clearTimeout(form_params.account._willShowErrors)
  }
  form_params.account._willShowErrors = setTimeout(() => { params.views[_wizard_view_account_index].isOk(true) }, 3000)
}

function accountLoginChange(e){
  form_params.account.login = document.getElementById('wizard_account_form_login').value
  params.views[_wizard_view_account_index].checkButtonNextStats()
  if(form_params.account._willShowErrors){
    clearTimeout(form_params.account._willShowErrors)
  }
  form_params.account._willShowErrors = setTimeout(() => { params.views[_wizard_view_account_index].isOk(true) }, 3000)
}

function accountMailChange(e){
  form_params.account.mail = document.getElementById('wizard_account_form_mail').value
  params.views[_wizard_view_account_index].checkButtonNextStats()
  if(form_params.account._willShowErrors){
    clearTimeout(form_params.account._willShowErrors)
  }
  form_params.account._willShowErrors = setTimeout(() => { params.views[_wizard_view_account_index].isOk(true) }, 3000)
}

function accountFirstnameChange(e){
  form_params.account.firstname = document.getElementById('wizard_account_form_firstname').value
  params.views[_wizard_view_account_index].checkButtonNextStats()
  if(form_params.account._willShowErrors){
    clearTimeout(form_params.account._willShowErrors)
  }
  form_params.account._willShowErrors = setTimeout(() => { params.views[_wizard_view_account_index].isOk(true) }, 3000)
}

function accountLastnameChange(e){
  form_params.account.lastname = document.getElementById('wizard_account_form_lastname').value
  params.views[_wizard_view_account_index].checkButtonNextStats()
  if(form_params.account._willShowErrors){
    clearTimeout(form_params.account._willShowErrors)
  }
  form_params.account._willShowErrors = setTimeout(() => { params.views[_wizard_view_account_index].isOk(true) }, 3000)
}

function accountPasswordChange(e){
  form_params.account.pwd = document.getElementById('wizard_account_form_psswrd').value
  params.views[_wizard_view_account_index].checkButtonNextStats()
  if(form_params.account._willShowErrors){
    clearTimeout(form_params.account._willShowErrors)
  }
  form_params.account._willShowErrors = setTimeout(() => { params.views[_wizard_view_account_index].isOk(true) }, 3000)
}

function accountPasswordConfirmationChange(e){
  form_params.account.pwdConfirmation = document.getElementById('wizard_account_form_psswrd_confirmtn').value
  params.views[_wizard_view_account_index].checkButtonNextStats()
  if(form_params.account._willShowErrors){
    clearTimeout(form_params.account._willShowErrors)
  }
  form_params.account._willShowErrors = setTimeout(() => { params.views[_wizard_view_account_index].isOk(true) }, 3000)
}
