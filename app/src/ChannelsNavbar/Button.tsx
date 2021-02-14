import React, { useState } from 'react';
import cn from 'classnames';
import { ChannelState } from 'src/Channels';
import Button from '../Button';
import Chip from '@material-ui/core/Chip';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { User } from '../../../src/modules/users/types';

const ChannelNavbarButton = ({
  channel,
  isCurrentChannel,
  counter,
  onClick,
  openDetailsDialog,
  users,
  ...props
}: {
  onClick: (channel: ChannelState) => void;
  openDetailsDialog: () => void;
  channel: ChannelState;
  users: User[];
  counter?: number;
  isCurrentChannel: boolean;
}) => {
  return (
    <Button
      {...props}
      fullWidth
      squared
      className={cn('notifications__channels__body__button', {
        ['notifications__channels__body__button__disabled']: isCurrentChannel,
      })}
      key={channel.id}
      color={isCurrentChannel ? 'create' : 'submit'}
      label={channel.name.toUpperCase()}
      onClick={(e) => !isCurrentChannel && onClick(channel)}
    >
      {!isCurrentChannel && counter ? (
        <Chip
          label={counter}
          size="small"
          variant="outlined"
          style={{
            color: 'white',
            borderColor: 'white',
            marginLeft: '0.25rem',
            height: '1rem',
            lineHeight: '1rem',
          }}
        />
      ) : null}
      {isCurrentChannel && (
        <BsThreeDotsVertical
          className="notifications__channels__body__button__menu"
          onClick={openDetailsDialog}
        />
      )}
    </Button>
  );
};
export default ChannelNavbarButton;
