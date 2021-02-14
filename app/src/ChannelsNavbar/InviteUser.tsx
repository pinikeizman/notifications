import React from 'react';
import cn from 'classnames';
import { User } from '../../../src/modules/users/types';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import { BsCheck } from 'react-icons/bs';
import UserComp from '../User';

const InviteUser = ({
  users = [],
  selectedUsers = new Set<string>(),
  onUserSelected,
  className,
  ...props
}: {
  users: User[];
  selectedUsers: Set<string>;
  className?: string;
  onUserSelected: (user: User) => void;
}) => {
  return (
    <FormControl className={cn("chat-app__invite-user", className)} {...props}>
      <InputLabel id="users-select-label">Invite Users</InputLabel>
      <Select
        value={''}
        name="invite-users-select"
        labelId="invite-users-select-label"
        onChange={(e) => {
          onUserSelected(e.target.value as User);
        }}
        input={<Input />}
        inputProps={{ 'aria-label': 'Without label' }}
      >
        {users.map((u) => (
          <MenuItem
            key={u.id}
            // @ts-ignore: For some resone the type must be string but this is not true.
            value={{ ...u }}
            disabled={selectedUsers.has(u.id)}
          >
            <UserComp user={u} />
            {selectedUsers.has(u.id) && (
              <BsCheck
                color="green"
                size="20"
                className="chat-app__invite-user__check"
              />
            )}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default InviteUser;
