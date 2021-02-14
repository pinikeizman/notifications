import React from 'react';

import { BsPlusCircleFill } from 'react-icons/bs';
import { observer } from 'mobx-react-lite';
import Store from '../observables/Store';
import { Channel } from '../../../src/modules/channels/types';
import Flex from '../Flex';
import Button from '../Button';
import './index.sass';

import CreateChannelForm from '../CreateChannel';
import ChannelsNavbarButton from './Button';
import api from '../api';
import { ChannelState } from 'src/Channels';
import ChannelDetailsDialog from './ChannelDetailsDialog';

const CreateNewChannelBtn = (props: {
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}) => (
  <Button
    squared
    fullWidth
    onClick={props.onClick}
    color="create"
    className={'notifications__channels__footer__submit'}
  >
    <BsPlusCircleFill color="white" size={16} />
    <span className="notifications__channels__footer__submit__label">
      Create Channel
    </span>
  </Button>
);

type ChannelsNavbarProps = {
  store: Store;
  channels: ChannelState[];
  currentChannel?: ChannelState;
  lastUpdate?: Date;
  onClick: (id: Channel) => void;
};

class ModelsSettings {
  isCreateChannelModalOpen: boolean;
  isChannelDetailsModalOpen: boolean;

  constructor(
    isCreateChannelModalOpen?: boolean,
    isChannelDetailsModalOpen?: boolean
  ) {
    this.isChannelDetailsModalOpen = !!isChannelDetailsModalOpen;
    this.isCreateChannelModalOpen = !!isCreateChannelModalOpen;
  }
  static mergeSettings(current: ModelsSettings, next: ModelsSettings) {
    const merged = { ...current, ...next };
    return new ModelsSettings(
      merged.isCreateChannelModalOpen,
      merged.isChannelDetailsModalOpen
    );
  }

  setCreateChannelModalOpen(value: boolean): ModelsSettings {
    return ModelsSettings.mergeSettings(this, new ModelsSettings(value));
  }

  setChannelDetailsModalOpen(value: boolean): ModelsSettings {
    return ModelsSettings.mergeSettings(this, new ModelsSettings(undefined, value));
  }
}

const ChannelsNavbar = ({
  channels,
  onClick,
  lastUpdate,
  store,
  currentChannel,
  ...props
}: ChannelsNavbarProps) => {
  const [modelsSettings, setModelSettings] = React.useState<ModelsSettings>(
    new ModelsSettings()
  );
  const counters = store.channelCounters;
  const user = store.user;
  const users = store.users;

  const channelsButtons = channels
    .sort((channelA, channelB) => {
      if (channelA?.last_msg?.createdAt && channelB?.last_msg?.createdAt)
        return new Date(channelA?.last_msg?.createdAt) <
          new Date(channelB?.last_msg.createdAt)
          ? 1
          : -1;
      else if (channelA?.last_msg?.createdAt) return -1;
      else if (channelB?.last_msg?.createdAt) return 1;
      return new Date(channelA.createdAt) < new Date(channelB.createdAt)
        ? 1
        : -1;
    })
    .map((channel) => {
      const isCurrentChannel = currentChannel?.id === channel.id;
      const counter = counters[channel.id];
      return (
        <ChannelsNavbarButton
          users={{ ...users }}
          key={channel.id}
          counter={counter}
          channel={channel}
          isCurrentChannel={isCurrentChannel}
          onClick={onClick}
          openDetailsDialog={() => {
            setModelSettings(modelsSettings.setChannelDetailsModalOpen(true));
          }}
        />
      );
    });

  return (
    <Flex column className="notifications__channels">
      <div className="notifications__channels__header"></div>
      <div className="notifications__channels__body">{channelsButtons}</div>
      <div className="notifications__channels__footer">
        <CreateNewChannelBtn
          onClick={(e) =>
            setModelSettings(modelsSettings.setCreateChannelModalOpen(true))
          }
        />
      </div>
      <CreateChannelForm
        user={user}
        users={users}
        onSubmit={async (channel, users) => {
          const response = await api.postChannel(channel, users);
          setModelSettings(modelsSettings.setCreateChannelModalOpen(false));
        }}
        onClose={() =>
          setModelSettings(modelsSettings.setCreateChannelModalOpen(false))
        }
        open={modelsSettings.isCreateChannelModalOpen}
      />
      {currentChannel && <ChannelDetailsDialog
        open={modelsSettings.isChannelDetailsModalOpen}
        channel={currentChannel}
        users={users}
        onClose={() => {
          setModelSettings(modelsSettings.setChannelDetailsModalOpen(false));
        }}
      />}
    </Flex>
  );
};

export default observer((props: ChannelsNavbarProps) => (
  <ChannelsNavbar {...props} />
));
