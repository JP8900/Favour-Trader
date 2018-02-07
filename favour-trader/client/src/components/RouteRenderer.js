import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import Main from '../pages/Main.js';
import CreateAccount from '../pages/CreateAccount.js';
import NotFound from '../pages/NotFound.js';
import Profile from '../pages/Profile.js';

class RouteRenderer extends Component {
  render() {
    return (
      <Switch>
        <Route exact path='/' component={Main}/>
        <Route path='/create-account' component={CreateAccount}/>
        <Route exact path='/profile' component={Profile}/>
        <Route path='*' component={NotFound} />
      </Switch>
    );
  }
}

export default RouteRenderer;
