import moment from 'moment';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import React, { useEffect, useState } from 'react';
import { User } from '../../../src/modules/users/types';
import UserComp from '../User';
import api from '../api';
import { ChannelState } from '../Channels';
import Button from '../Button';
import InviteUser from './InviteUser';
import { Grid, makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  detailLable: {
    color: '#005180',
    fontWeight: 'bold',
  },
  container: {
    margin: '0.25rem 0.5rem',
  },
  inviteUser: {
    margin: '0.25rem 0.5rem',
  }
});

const Detail = ({ label, value }: any) => {
  const classes = useStyles();
  return (
    <Grid direction="column" className={classes.container}>
      <h4>{label}</h4>
      <h3 className={classes.detailLable}>{value}</h3>
    </Grid>
  );
};

const ChannelDetailsDialog = ({
  open = false,
  channel,
  users,
  onClose,
}: {
  open: boolean;
  channel: ChannelState;
  users: User[];
  onClose: () => void;
}) => {
  const [channelUsers, setUsers] = useState<User[]>([]);
  const classes = useStyles();

  useEffect(() => {
    channel &&
      api
        .getChannelUsers(channel.id)
        .then(
          (usersIDs) =>
            usersIDs.map(({ user_id }: any) => ({
              ...users.find((u) => u.id === user_id),
            })) as User[]
        )
        .then((res) => setUsers(res));
  }, [channel]);
  return (
    <Dialog
      fullWidth
      onClose={() => {}}
      aria-labelledby="channel-details-dialog"
      className="channel-details-dialog"
      open={open}
    >
      <DialogTitle>Chanel Details</DialogTitle>
      <Grid
        container
        direction="row"
        className="channel-details-dialog__details"
        justify="flex-start"
      >
        <Detail label="Name" value={channel?.name} />
        <Detail
          label="Created At"
          value={moment(channel?.createdAt).format('MMM d YYYY')}
        />
      </Grid>
      <DialogTitle>Participants</DialogTitle>
      <InviteUser
        users={users}
        className={classes.inviteUser}
        selectedUsers={new Set(channelUsers.map((u) => u.id))}
        onUserSelected={(user: User) =>
          api
            .inviteUsersToChannel([user], channel)
            .then((res) => setUsers([...channelUsers, user]))
        }
      />
      <DialogContent className="channel-details-dialog">
        <div className="channel-details-dialog__participants">
          {channelUsers.map((a: any) => (
            <UserComp style={{ margin: '0.5rem' }} key={a.user} user={a} />
          ))}
        </div>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" label="close" onClick={onClose} />
      </DialogActions>
    </Dialog>
  );
};
export default ChannelDetailsDialog;
