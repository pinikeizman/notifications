import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Login from '../Login';
import Channels from '../Channels';
import Flex from '../Flex';
import { observer } from 'mobx-react-lite';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  useHistory,
  Redirect,
} from 'react-router-dom';
import CircularProgress from '@material-ui/core/CircularProgress';

import Store from '../observables/Store';
import './index.sass';
import { User } from '../types';
import api, { getUsers } from '../api';
import { Dictionary } from 'lodash';
export interface ChatProps {
  store: Store;
}

export interface APIConfig {
  paths: Dictionary<string>;
}

const {
  api: apiConf,
  path,
}: { api: APIConfig; path: string } = require('config');

const login = (user: User) =>
  axios
    .post(`${path + apiConf.paths.login}`, user, { withCredentials: true })
    .then((res) => res.data.data);

const Chat = observer(({ store }: ChatProps) => {
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  useEffect(() => {
    setLoading(true);
    api
      .authWithCoockie()
      .then(async ({ user, accessToken }) => {
        const users = await getUsers();
        store.setToken(accessToken);
        store.setUser(user);
        store.setUsers(users);
        history.push('/');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [true]);

  return loading ? (
    <Flex className="loader_container">
      <CircularProgress />
    </Flex>
  ) : (
    <>
      <Switch>
        <Route path="/login">
          <Login
            onLogin={(user: User) =>
              login(user).then(async ({ accessToken, user }) => {
                const users = await getUsers();
                store.setToken(accessToken);
                store.setUser(user);
                store.setUsers(users);
                history.push('/');
              })
            }
          />
        </Route>
        <Route path="/">
          {!!store.user ? <Channels store={store} /> : <Redirect to="/login" />}
        </Route>
      </Switch>
    </>
  );
});

export default Chat;
