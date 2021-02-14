import * as React from 'react';
import { timer } from 'rxjs';
import { useEffect, useState } from 'react';
import { Dictionary, last } from 'lodash';
import { observer } from 'mobx-react-lite';
import groupBy from 'lodash/groupBy';
import { Socket } from 'primus';
import Store from '../observables/Store';
import { Response, ActionType, ResponseTypes } from '../../../src/types/Action';
import { Channel, EnrichedChannel } from '../../../src/modules/channels/types';
import { Message } from '../../../src/types/Message';
import * as WSClient from '../websocket/client';
import Flex from '../Flex';
import api from '../api';
import Chat from '../Chat';
import ChannelsNavbar from '../ChannelsNavbar';
import TopNavbar from '../TopNavbar';
var ls = require('local-storage');

import './index.sass';
import { combineState, dedupMsgs, reduceState } from './logic';

export type Ackable<T> = T & {
  acked: boolean;
};

export interface ChannelProps {
  store: Store;
}

export type ChannelState = Channel & {
  msgs: Dictionary<Ackable<Message>>;
  length: number;
};

export type ChannelIdToState = Dictionary<ChannelState>;

function usePrevious<T>(value: T) {
  const ref = React.useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
const Channels: React.FC<ChannelProps> = observer(({ store }: ChannelProps) => {
  const [wsClient, setWSClient] = useState<Socket | undefined>();
  const [channelsState, setChannelsState] = useState<ChannelIdToState>({});
  const [lastUpdate, setLastUpdate] = useState<Date | undefined>();
  const [currentChannel, setCurrentChannel] = useState<
    ChannelState | undefined
  >();
  const [message, setMessage] = useState<string>('');
  const [visible, setVisible] = useState<boolean>(false);
  const scrollableRef = React.useRef<any>();
  const prevCount = usePrevious<number>(
    (currentChannel && channelsState[currentChannel.id].length) || 0
  );

  const user = store.user;

  const updateChannels = (channels: EnrichedChannel[]) => {
    const channelsFromState = new Set(Object.keys(channelsState));
    const diff = channels.filter(
      (channel) => !channelsFromState.has(channel.id)
    );
    if (diff.length === 0) return {};
    const stateUpdate = diff.reduce<ChannelIdToState>(
      (acc, c) => ({
        ...acc,
        [c.id]: { ...c, msgs: {}, length: 0, lastMsg: null },
      }),
      {}
    );
    wsClient &&
      wsClient.write({
        undefined,
        type: ActionType.RefreshSubscription,
      });
    setChannelsState(reduceState(stateUpdate, channelsState));
    setLastUpdate(() => new Date());
  };

  useEffect(() => {
    const scrollable = scrollableRef.current;
    if (
      currentChannel?.id &&
      prevCount !== channelsState[currentChannel?.id as string]?.length
    )
      scrollable.scrollTop = scrollable.scrollHeight - scrollable.clientHeight;
    setVisible(true);
    const allChannelsPollSubscription = timer(100, 5000).subscribe(() =>
      api.getChannels().then(updateChannels)
    );
    return () => allChannelsPollSubscription.unsubscribe();
  }, [channelsState]);

  useEffect(() => {
    const client = WSClient.createWSClient(store.token).open();
    setWSClient(client);
    api.getChannels().then((channels) => {
      const countersToAdd: Dictionary<number> = channels.reduce(
        (acc, channel) => ({ ...acc, [channel.id]: channel.newMsgs }),
        {}
      );
      Object.values(countersToAdd).some((counter) => counter > 0) &&
        store.addCounters(countersToAdd);
      updateChannels(channels);
    });
    return () => client.end();
  }, [true]);

  useEffect(() => {
    wsClient &&
      wsClient.on('data', (action: Response<object>) => {
        if (action.type === ResponseTypes.MessagesUpdate) {
          const dedupedMsgs = dedupMsgs(
            action.data as Message[],
            channelsState
          );
          const nextState = combineState(dedupedMsgs, channelsState);
          const counterUpdate = Object.entries(
            groupBy(dedupedMsgs, (msg) => msg.channel)
          ).reduce(
            (acc, [id, msgs]) => ({
              ...acc,
              [id]: msgs.length,
            }),
            {} as Dictionary<number>
          );
          store.addCounters(counterUpdate);
          setChannelsState(nextState);
          setLastUpdate(() => new Date());
        }
      });
    return () => {
      wsClient && wsClient.removeAllListeners('data');
    }
  }, [channelsState, wsClient]);

  useEffect(() => {
    currentChannel &&
      api.getChannelMsgs(currentChannel.id).then((msgs) => {
        const nextState = combineState(msgs, channelsState, { first: true });
        currentChannel?.id && store.resetChannelCounter(currentChannel?.id);
        setChannelsState(nextState);
        const lastMsg = last(Object.values(nextState[currentChannel.id].msgs));
        if (lastMsg && !lastMsg?.acked)
          ackMessage(currentChannel?.id, lastMsg.id);
      });
  }, [currentChannel]);

  useEffect(() => {
    if (currentChannel) {
      const channelFromState = channelsState[currentChannel.id];
      store.resetChannelCounter(channelFromState?.id);
      const lastMsg =
        channelFromState.length &&
        Object.values(channelFromState.msgs)[channelFromState.length - 1];
      if (lastMsg) {
        !lastMsg.acked && ackMessage(channelFromState?.id, lastMsg.id);
      }
    }
  }, [currentChannel, channelsState]);

  const sendMessage = (data: Message) => {
    const next = combineState([data], channelsState);
    setChannelsState(next);
    setMessage('');
    wsClient && wsClient.write({
      data,
      type: ActionType.SendMessage,
    });
  };

  const ackMessage = (channelId: string, messageId: string) => {
    wsClient && wsClient.write({
      data: { channelId, messageId },
      type: ActionType.AckMessage,
    });
  };

  return (
    <>
      <TopNavbar
        currentChannel={currentChannel as ChannelState}
        lastUpdate={lastUpdate}
        store={store}
      />
      <Flex className="chat-app__chat-wrapper">
        <ChannelsNavbar
          store={store}
          currentChannel={currentChannel}
          onClick={(channel) => {
            setVisible(false);
            setCurrentChannel(channelsState[channel.id]);
          }}
          channels={Object.values(channelsState)}
          lastUpdate={lastUpdate}
        />
        <Chat
          key={currentChannel?.name}
          onClick={() =>
            sendMessage(
              new Message(user, currentChannel?.id as string, message)
            )
          }
          msgs={
            (currentChannel &&
              Object.values(
                channelsState[currentChannel?.id as string]?.msgs || {}
              )) ||
            []
          }
          onInputChange={setMessage}
          cueentText={message}
          currentChannel={currentChannel}
          scrollableRef={scrollableRef}
          user={user}
          visible={visible}
        />
      </Flex>
    </>
  );
});

export default Channels;
