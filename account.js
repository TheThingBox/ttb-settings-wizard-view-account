var VIEW_ACCOUNT = function() {
  var Account = function(options) {
    this.type = Account.type
    this.tab_name = this.type
    this.tab_id = `tab_${this.type}`
    this.navtab_id = `navtab_${this.type}`
    this.main_container_id = `wizard_${this.type}`
    this.index = modules.findIndex(m => m.type === this.type)
    this.params = Object.assign({}, params.views[this.index])
    this.lang = {}
    this.view = ''
    this.form = {}
  }

  Account.prototype = new VIEW;

  Account.prototype.load = function(){
    return new Promise( (resolve, reject) => {
      this.getLang()
      .then( (lang) => {
        this.lang = i18n.create({ values: lang })
        return this.getView()
      })
      .then( (view) => {
        var _html = ejs.render(view, { params: this.params, name: this.type, lang: this.lang })
        if(!_html){
          throw new Error(`cannot render ${this.params.ejs}`)
        } else {
          this.tab_name = this.lang('name')
          document.getElementById(this.navtab_id).innerHTML = this.tab_name
          document.getElementById(this.main_container_id).innerHTML = _html

          this.form = {}
          this.form.linked = false
          this.form.linkedFirstname = ''
          this.form.linkedLastname = ''
          this.form.changeAccount = true
          this.form.createNew = false
          this.form.login = ''
          this.form.mail = ''
          this.form.firstname = ''
          this.form.lastname = ''
          this.form.pwd = ''
          this.form.pwdConfirmation = ''
          this.form.ignore = false
          this.form._willShowErrors = null

          document.getElementById("wizard_account_change_account").addEventListener('click', (e) => { this.accountChangeAccount(e) });
          document.getElementById("wizard_account_form_create_new").addEventListener('change', (e) => { this.accountExistChange(e) });
          document.getElementById("wizard_account_form_login").addEventListener('input', (e) => { this.accountLoginChange(e) });
          document.getElementById("wizard_account_form_mail").addEventListener('input', (e) => { this.accountMailChange(e) });
          document.getElementById("wizard_account_form_firstname").addEventListener('input', (e) => { this.accountFirstnameChange(e) });
          document.getElementById("wizard_account_form_lastname").addEventListener('input', (e) => { this.accountLastnameChange(e) });
          document.getElementById("wizard_account_form_psswrd").addEventListener('input', (e) => { this.accountPasswordChange(e) });
          document.getElementById("wizard_account_form_psswrd_confirmtn").addEventListener('input', (e) => { this.accountPasswordConfirmationChange(e) });

          resolve()
        }
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  Account.prototype.post = function(){
    return new Promise((resolve, reject) => {
      params.promisesReachable
      .then(reachable => {
        var request = new Request(this.params.api)
        if(!this.isOk()){
          request.setData({})
        } else {
          request.setData({
            reachable: reachable,
            login: this.form.login,
            email: this.form.mail,
            password: CryptoJS.SHA512(this.form.pwd).toString().toUpperCase(),
            firstname: this.form.firstname,
            lastname: this.form.lastname,
            createNew: this.form.createNew,
            deviceName: WIZARD.requestAlive.isLocalUrl()?params.hostname:WIZARD.requestAlive.getHost()
          })
        }

        request.post()
        .then(resolve)
        .catch(reject)
      })
    })
  }

  Account.prototype.isOk = function(willShowErrors){
    var _errors = []

    this.form.login = this.form.login.trim()
    this.form.mail = this.form.mail.trim()
    this.form.firstname = this.form.firstname.trim()
    this.form.lastname = this.form.lastname.trim()

    if(this.form.login === ''){
      _errors[_errors.length] = { title: this.lang('login'), corpus: this.lang('isok_login_corpus')}
    }

    if(this.form.pwd === ''){
      _errors[_errors.length] = { title: this.lang('password'), corpus: this.lang('isok_password_corpus')}
    }

    if(this.form.createNew === true){
      if(this.form.mail === ''){
        _errors[_errors.length] = { title: this.lang('mail'), corpus: this.lang('isok_mail_corpus')}
      } else if(!validateEmail(this.form.mail)){
        _errors[_errors.length] = { title: this.lang('mail'), corpus: this.lang('isok_mail_corpus_invalid')}
      }

      if(this.form.firstname === ''){
        _errors[_errors.length] = { title: this.lang('firstname'), corpus: this.lang('isok_firstname_corpus')}
      }
      if(this.form.lastname === ''){
        _errors[_errors.length] = { title: this.lang('firstname'), corpus: this.lang('isok_firstname_corpus')}
      }

      if(this.form.pwd !== this.form.pwdConfirmation){
        _errors[_errors.length] = { title: this.lang('password_confirmation'), corpus: this.lang('isok_password_confirmation_corpus')}
      }
    }

    if(this.form.linked === true && this.form.changeAccount === false){
      _errors = []
    }

    if(willShowErrors === true || _errors.length === 0){
      this.showErrors(_errors)
    }

    if(_errors.length === 0){
      return true
    }
    return false
  }

  Account.prototype.getResumed = function(){
    var _html = ''
    if(this.form.ignore){
      if(this.form.linked){
        _html = this.lang('resumed_use_linked', {firstname: this.form.linkedFirstname, lastname: this.form.linkedLastname})
      } else {
        _html = this.lang('resumed_ignore')
      }
    } else {
      if(!this.form.createNew){
        _html = this.lang('resumed_use_existing', { login: this.form.login })
      } else {
        var _liStyle = 'background-color: rgba(0, 0, 0, 0); border-bottom-width: 1px;'
        _html =  `
    <ul class="collection" style="border-width:0px">
      <li style="${_liStyle}" class="collection-header"><b>${this.lang('login')}</b><br/>${this.form.login || this.lang('not_set')}</li>
      <li style="${_liStyle}" class="collection-header"><b>${this.lang('password')}</b><br/>${this.form.pwd.replace(/./g, "&#183;") || this.lang('not_set')}</li>
      <li style="${_liStyle}" class="collection-header"><b>${this.lang('mail')}</b><br/>${this.form.mail || this.lang('not_set')}</li>
      <li style="${_liStyle}" class="collection-header"><b>${this.lang('firstname')}</b><br/>${this.form.firstname || this.lang('not_set')}</li>
      <li style="${_liStyle} border-bottom-width: 0px;" class="collection-header"><b>${this.lang('lastname')}</b><br/>${this.form.lastname || this.lang('not_set')}</li>
    </ul>`
      }
    }
    return _html
  }

  Account.prototype.loaded = function(){
    var _flagsRequest = new Request(this.params.api)
    return new Promise( (resolve, reject) => {
      _flagsRequest.get().then( flags => {
        if(flags.zoib.linked === true){
          document.getElementById("wizard_account_form_login").value = flags.zoib.login
          this.form.login = flags.zoib.login
          this.form.linked = true
          this.form.linkedFirstname = flags.zoib.firstname
          this.form.linkedLastname = flags.zoib.lastname
          this.form.changeAccount = false
          this.form.ignore = true
          document.getElementById("span_account_will_be_used").innerHTML = this.lang('account_will_be_used', { firstname: flags.zoib.firstname, lastname: flags.zoib.lastname})
        }

        var _account_hide_on_not_linked = document.getElementsByClassName("account_hide_on_not_linked");
        if(_account_hide_on_not_linked){
          if(!this.form.linked){
            for(var i=0, max=_account_hide_on_not_linked.length; i<max; i++){
              _account_hide_on_not_linked[i].classList.remove('is-visible')
            }
          } else {
            for(var i=0, max=_account_hide_on_not_linked.length; i<max; i++){
              _account_hide_on_not_linked[i].classList.add('is-visible')
            }
          }
        }
        var _account_hide_on_linked = document.getElementsByClassName("account_hide_on_linked");
        if(_account_hide_on_linked){
          if(!this.form.changeAccount){
            for(var i=0, max=_account_hide_on_linked.length; i<max; i++){
              _account_hide_on_linked[i].classList.remove('is-visible')
            }
          } else {
            for(var i=0, max=_account_hide_on_linked.length; i<max; i++){
              _account_hide_on_linked[i].classList.add('is-visible')
            }
            document.getElementById("wizard_account_form_login").nextElementSibling.classList.add('active')
          }
        }
        this.checkButtonNextStats()
        resolve()
      })
    })
  }

  Account.prototype.accountChangeAccount = function(e){
    this.form.changeAccount = !this.form.changeAccount
    var _account_hide_on_linked = document.getElementsByClassName("account_hide_on_linked");
    if(_account_hide_on_linked){
      if(!this.form.changeAccount){
        document.getElementById("wizard_account_change_account").innerHTML = this.lang('change_account')
        for(var i=0, max=_account_hide_on_linked.length; i<max; i++){
          _account_hide_on_linked[i].classList.remove('is-visible')
        }
      } else {
        document.getElementById("wizard_account_change_account").innerHTML = this.lang('keep_account')
        for(var i=0, max=_account_hide_on_linked.length; i<max; i++){
          _account_hide_on_linked[i].classList.add('is-visible')
        }
        document.getElementById("wizard_account_form_login").nextElementSibling.classList.add('active')
      }
    }
    this.checkButtonNextStats()
  }

  Account.prototype.accountExistChange = function(e){
    this.form.createNew = document.getElementById('wizard_account_form_create_new').checked
    var _account_hide_on_already_exist = document.getElementsByClassName("account_hide_on_already_exist");
    if(_account_hide_on_already_exist){
      if(!this.form.createNew){
        for(var i=0, max=_account_hide_on_already_exist.length; i<max; i++){
          _account_hide_on_already_exist[i].classList.remove('is-visible')
        }
      } else {
        for(var i=0, max=_account_hide_on_already_exist.length; i<max; i++){
          _account_hide_on_already_exist[i].classList.add('is-visible')
        }
      }
    }
    this.checkButtonNextStats()
    if(this.form._willShowErrors){
      clearTimeout(this.form._willShowErrors)
    }
    this.form._willShowErrors = setTimeout(() => { this.isOk(true) }, 3000)
  }

  Account.prototype.accountLoginChange = function(e){
    this.form.login = document.getElementById('wizard_account_form_login').value
    this.checkButtonNextStats()
    if(this.form._willShowErrors){
      clearTimeout(this.form._willShowErrors)
    }
    this.form._willShowErrors = setTimeout(() => { this.isOk(true) }, 3000)
  }

  Account.prototype.accountMailChange = function(e){
    this.form.mail = document.getElementById('wizard_account_form_mail').value
    this.checkButtonNextStats()
    if(this.form._willShowErrors){
      clearTimeout(this.form._willShowErrors)
    }
    this.form._willShowErrors = setTimeout(() => { this.isOk(true) }, 3000)
  }

  Account.prototype.accountFirstnameChange = function(e){
    this.form.firstname = document.getElementById('wizard_account_form_firstname').value
    this.checkButtonNextStats()
    if(this.form._willShowErrors){
      clearTimeout(this.form._willShowErrors)
    }
    this.form._willShowErrors = setTimeout(() => { this.isOk(true) }, 3000)
  }

  Account.prototype.accountLastnameChange = function(e){
    this.form.lastname = document.getElementById('wizard_account_form_lastname').value
    this.checkButtonNextStats()
    if(this.form._willShowErrors){
      clearTimeout(this.form._willShowErrors)
    }
    this.form._willShowErrors = setTimeout(() => { this.isOk(true) }, 3000)
  }

  Account.prototype.accountPasswordChange = function(e){
    this.form.pwd = document.getElementById('wizard_account_form_psswrd').value
    this.checkButtonNextStats()
    if(this.form._willShowErrors){
      clearTimeout(this.form._willShowErrors)
    }
    this.form._willShowErrors = setTimeout(() => { this.isOk(true) }, 3000)
  }

  Account.prototype.accountPasswordConfirmationChange = function(e){
    this.form.pwdConfirmation = document.getElementById('wizard_account_form_psswrd_confirmtn').value
    this.checkButtonNextStats()
    if(this.form._willShowErrors){
      clearTimeout(this.form._willShowErrors)
    }
    this.form._willShowErrors = setTimeout(() => { this.isOk(true) }, 3000)
  }

  Account.prototype.unIgnored = function(){
    if(this.form.linked === true && this.form.changeAccount === false){
      this.form.ignore = true
    } else {
      this.form.ignore = false
    }
  }

  Account.type = 'account'

  return Account
}()

modules.push({type: VIEW_ACCOUNT.type, module: VIEW_ACCOUNT})
