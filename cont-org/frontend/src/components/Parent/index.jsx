import { notification } from 'antd';
import { getRooms } from '../../redux/actions/room';
import { updateSocket } from '../../redux/actions/socket';
import { io } from 'socket.io-client';
import { createContext, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import Peer from 'simple-peer';

let socket;
export const SocketContext = createContext();

const Parent = ({ children, updateSocket, getRooms, _id, name }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');
  const [userVideoEnabled, setUserVideoEnabled] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  console.log({
    callAccepted,
    callEnded,
    stream,
    call,
    me,
    myVideo,
    userVideoEnabled,
    userVideo,
    connectionRef,
  });
  useEffect(() => {
    socket = io('http://localhost:5000', { path: '/socket' });

    updateSocket({ socket });

    socket.emit('active_user', _id);

    socket.on('active_users', (activeUsers) => updateSocket({ activeUsers }));

    socket?.on('receive_message', (data) => {
      notification.success({
        message: data?.room?.members?.find(({ _id: id }) => _id !== id)?.name,
        description: data?.message,
      });
    });

    socket?.on(_id, (room) => {
      socket.emit('join_room', room._id);
      setTimeout(() => {
        getRooms();
      }, 500);
    });

    socket.on('me', (id) => setMe(id));

    socket.on('video', (video) => setUserVideoEnabled(video));

    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getStream = async () => {
    try {
      const streamTemp = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(streamTemp);
      myVideo.current.srcObject = streamTemp;
    } catch (err) {
      console.log({ err });
    }
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: myVideo.current.srcObject,
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: call.from });
    });

    peer.on('stream', (currentStream) => {
      setUserVideoEnabled(currentStream?.getVideoTracks()[0].enabled);
      userVideo.current.srcObject = currentStream;
    });

    peer.on('track', (track) => {
      //   setUserVideoEnabled(currentStream?.getVideoTracks()[0].enabled);
      console.log({ track });
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: myVideo.current.srcObject,
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
    });

    peer.on('stream', (currentStream) => {
      setUserVideoEnabled(currentStream?.getVideoTracks()[0].enabled);
      userVideo.current.srcObject = currentStream;
    });

    peer.on('track', (track) => {
      //   setUserVideoEnabled(currentStream?.getVideoTracks()[0].enabled);
      console.log({ track });
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const updateVideoStream = (to) => {
    try {
      myVideo.current.srcObject.getVideoTracks()[0].enabled =
        !myVideo.current.srcObject.getVideoTracks()[0].enabled;
      connectionRef.current?.replaceTrack(
        stream.getVideoTracks()[0],
        myVideo.current.srcObject.getVideoTracks()[0],
        stream
      );
      socket.emit('video', {
        to,
        video: myVideo.current.srcObject.getVideoTracks()[0].enabled,
      });
    } catch (err) {
      console.log({ err });
    }
  };

  const updateAudioStream = () => {
    try {
      myVideo.current.srcObject.getAudioTracks()[0].enabled =
        !myVideo.current.srcObject.getAudioTracks()[0].enabled;
      connectionRef.current?.replaceTrack(
        stream.getAudioTracks()[0],
        myVideo.current.srcObject.getAudioTracks()[0],
        stream
      );
    } catch (err) {
      console.log({ err });
    }
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    stream?.getTracks().forEach((track) => {
      track.stop();
    });

    myVideo.current = null;
    userVideo.current = null;

    //   window.location.reload();
  };

  return (
    <SocketContext.Provider
      value={{
        call,
        callAccepted,
        myVideo,
        userVideo,
        stream,
        name,
        callEnded,
        me,
        userVideoEnabled,
        updateVideoStream,
        updateAudioStream,
        getStream,
        callUser,
        leaveCall,
        answerCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

const mapStateToProps = ({ user: { user: { _id, name } = {} } }) => ({
  _id,
  name,
});

export default connect(mapStateToProps, {
  updateSocket,
  getRooms,
})(Parent);
