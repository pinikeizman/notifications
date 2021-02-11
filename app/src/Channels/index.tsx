import * as React from 'react';
import { timer } from 'rxjs';
import { useEffect, useState } from 'react';
import { Dictionary } from 'lodash';
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
import './index.sass';

export interface ChannelProps {
  store: Store;
}

type ChannelState = Channel & {
  msgs: Dictionary<Message>;
  length: number;
};

type ChannelIdToState = Dictionary<ChannelState>;

const normalizeToObject = (
  arr: any[],
  extract: (a: any) => any
): Dictionary<any> =>
  arr.reduce((acc, item) => ({ ...acc, [extract(item)]: item }), {});

export const dedupMsgs = (
  msgs: Message[],
  state: ChannelIdToState
): Message[] => msgs.filter((msg) => !state[msg.channel]?.msgs[msg.id]);

const combineState = (
  msgs: Message[],
  state: ChannelIdToState,
  options?: { first?: boolean }
): ChannelIdToState =>
  Object.entries(groupBy(msgs, (msg) => msg.channel))
    .map(([channelId, msgs]) => {
      const { msgs: channelMsgs, length, ...channel } = state[channelId];
      const combineMsgs = options?.first
        ? {
            ...normalizeToObject(msgs, (msg) => msg.id),
            ...channelMsgs,
          }
        : {
            ...channelMsgs,
            ...normalizeToObject(msgs, (msg) => msg.id),
          };
      const channelState: ChannelState = {
        ...channel,
        msgs: combineMsgs,
        length: length + msgs.length,
      };
      return [channelId, channelState] as [string, ChannelState];
    })
    .reduce(
      (acc, [channelId, channel]) => ({ ...acc, [channelId]: channel }),
      state
    );

const reduceState = (
  update: ChannelIdToState,
  state: ChannelIdToState
): ChannelIdToState => {
  const nextState: ChannelIdToState = Object.entries(update).reduce(
    (acc, [channelId, channelState]) => {
      const msgs = {
        ...(state[channelId]?.msgs || {}),
        ...channelState.msgs,
      };
      return {
        ...acc,
        [channelId]: {
          ...channelState,
          msgs,
          length: Object.keys(msgs).length,
        },
      };
    },
    state
  );
  return nextState;
};

function usePrevious<T>(value: T) {
  const ref = React.useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const Channels: React.FC<ChannelProps> = observer(({ store }: ChannelProps) => {
  const [wsClient, setWSClient] = useState<Socket>(null);
  const [channelsState, setChannelsState] = useState<ChannelIdToState>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(undefined);
  const [currentChannel, setCurrentChannel] = useState<Channel>(null);
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
      (acc, c) => ({ ...acc, [c.id]: { ...c, msgs: {}, length: 0 } }),
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
    if (prevCount !== channelsState[currentChannel?.id]?.length)
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
    return () => wsClient && wsClient.removeAllListeners('data');
  }, [channelsState, wsClient]);

  useEffect(() => {
    currentChannel &&
      api.getChannelMsgs(currentChannel.id).then((msgs) => {
        const nextState = combineState(msgs, channelsState, { first: true });
        setChannelsState(nextState);
        const counter = store.channelCounters[currentChannel?.id];
        ackMessage(currentChannel?.id, msgs[msgs.length - 1].id);
        currentChannel?.id && store.resetChannelCounter(currentChannel?.id);
      });

    return () =>
      currentChannel?.id && store.resetChannelCounter(currentChannel?.id);
  }, [currentChannel]);

  const sendMessage = (data: Message) => {
    const next = combineState([data], channelsState);
    setChannelsState(next);
    setMessage('');
    wsClient.write({
      data,
      type: ActionType.SendMessage,
    });
  };

  const ackMessage = (channelId: string, messageId: string) => {
    wsClient.write({
      data: { channelId, messageId },
      type: ActionType.AckMessage,
    });
  };

  return (
    <>
      <TopNavbar
        currentChannel={currentChannel}
        lastUpdate={lastUpdate}
        store={store}
      />
      <Flex className='chat-app__chat-wrapper'>
        <ChannelsNavbar
          store={store}
          currentChannel={currentChannel}
          onClick={(channel) => {
            setVisible(false);
            setCurrentChannel(channel);
          }}
          channels={Object.values(channelsState)}
          lastUpdate={lastUpdate}
        />
        <Chat
          key={currentChannel?.name}
          onClick={() =>
            sendMessage(new Message(user, currentChannel.id, message))
          }
          msgs={
            (currentChannel &&
              Object.values(channelsState[currentChannel.id]?.msgs || {})) ||
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
