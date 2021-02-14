import React, { useEffect, useState } from 'react';
import moment from 'moment';

import { BsBoxArrowLeft } from 'react-icons/bs';
import { observer } from 'mobx-react-lite';
import Store from '../observables/Store';
import { Channel } from '../../../src/modules/channels/types';
import Button from '../Button';
import logo from '../../static/favicon.png';

import api from '../api';
import Avatar from '../Avatar';
import Flex from '../Flex';
import './index.sass';
import Paper from '@material-ui/core/Paper';
import Fade from '@material-ui/core/Fade';
import Popper from '@material-ui/core/Popper';
import Box from '@material-ui/core/Box';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { ChannelState } from '../Channels';

type TopNavbarProps = {
  store: Store;
  currentChannel: ChannelState;
  lastUpdate?: Date;
};

const TopNavbar = ({
  lastUpdate,
  store,
  currentChannel,
  ...props
}: TopNavbarProps) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const avatarRef = React.useRef<any>();
  const user = store.user;
  return (
    <Flex className="chat-app__top-navbar" {...props}>
      <Box display='flex' flexDirection='row' alignItems='center'>
        <Avatar size="l" src={logo} className="chat-app__top-navbar__logo" />
        <h3>CHAT-APP</h3>
      </Box>
      <Avatar
        size="m"
        onClick={(e) => anchorEl ? setAnchorEl(null) : setAnchorEl(e.target as any)}
        alt={user.name}
        src={user.photo}
        ref={avatarRef}
      />
      <Popper
        open={!!anchorEl}
        anchorEl={anchorEl}
        placement="bottom"
        transition
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
            <Fade {...TransitionProps} timeout={350}>
              <Paper>
                <Flex column className="chat-app__top-navbar__info">
                  <Avatar size="xl" label={user.name} src={user.photo} />
                  <p>Last update: {moment(lastUpdate).fromNow()}</p>
                  <Button
                    color="secondary"
                    onClick={() => api.logout()}
                    label="logout"
                  >
                    <BsBoxArrowLeft color="white" size={16} />
                  </Button>
                </Flex>
              </Paper>
            </Fade>
          </ClickAwayListener>
        )}
      </Popper>
    </Flex>
  );
};

export default observer((props: TopNavbarProps) => <TopNavbar {...props} />);
