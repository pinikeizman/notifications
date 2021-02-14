import React, { useEffect, useState } from 'react';
import cn from 'classnames';
import { User } from '../../../src/modules/users/types';
import Avatar from '../Avatar';
import './index.sass';
const UserComp: React.FC<{ user: User; style?: object }> = ({
  user,
  ...props
}) => (
  <div className={cn('chat-app__user')}>
    <Avatar
      {...props}
      className="chat-app__user__avatar"
      size="m"
      alt={user.name}
      src={user.photo}
    />
    <span title={user.username}>{user.name}</span>
  </div>
);

export default UserComp;
