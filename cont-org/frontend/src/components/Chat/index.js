/* eslint-disable jsx-a11y/anchor-is-valid */
import { AutoComplete, Modal, notification, Spin } from 'antd';
import { useContext, useEffect, useRef, useState } from 'react';
import useDebounce from '../../Hooks/useDebounce';
import axios from 'axios';
import './style.css';
import { connect } from 'react-redux';
import { getRooms, setRoom } from '../../redux/actions/room';
import moment from '../../../node_modules/moment';
import { BsDot } from 'react-icons/bs';
import useToggle from '../../Hooks/useToggle';
import { SocketContext } from '../Parent';

const Chat = ({
  _id,
  name,
  socket,
  activeUsers,
  getRooms,
  setRoom,
  rooms,
  room,
}) => {
  const ref = useRef();
  const roomRef = useRef(room);
  const [active, setActive] = useState(Object.values(activeUsers));

  const [searchUser, setSearchUser] = useState('');
  const [options, setOptions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [member, setMember] = useState(undefined);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isCall, setIsCall] = useToggle(false);

  const {
    callAccepted,
    answerCall,
    leaveCall,
    callUser,
    myVideo,
    userVideoEnabled,
    userVideo,
    callEnded,
    stream,
    call,
    getStream,
    updateVideoStream,
    updateAudioStream,
  } = useContext(SocketContext);

  const [mediaOptions, setMediaOptions] = useState({
    video: true,
    audio: true,
  });

  const getRoom = (value, option) => {
    socket.emit('set_room', [_id, value]);
    setSearchUser(option.label);
  };

  const getMessages = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/chat/${room._id}`);
      const { data } = res;
      setIsLoading(false);
      setMessages(data);
    } catch (err) {
      console.log({ err });
    }
  };

  const searchUsers = async () => {
    if (searchUser) {
      try {
        const res = await axios.get(`/api/users/all/${searchUser}`);
        const { data } = res;
        setOptions(data.map(({ name, _id }) => ({ label: name, value: _id })));
      } catch (err) {
        console.log({ err });
      }
    } else {
      setOptions([]);
    }
  };

  useDebounce(() => searchUsers(), 1200, [searchUser]);
  useEffect(() => {
    getRooms();
    return () => {
      setRoom(undefined);
    };
  }, []);

  useEffect(() => {
    if (room) {
      const member = room?.members?.find(({ _id: id }) => _id !== id);
      setMember(member);
      getMessages();
    }

    return () => {};
  }, [room, _id]);

  useEffect(() => {
    setTimeout(() => {
      intoView();
    }, 1000);
    return () => {};
  }, [messages]);

  useEffect(() => {
    roomRef.current = room;
  }, [room, roomRef, socket]);

  useEffect(() => {
    socket?.on('receive_message', (data) => {
      if (data?.room?._id === roomRef?.current?._id) {
        setMessages((list) => [...list, data]);
      }
    });
  }, []);

  useEffect(() => {
    setActive(Object.values(activeUsers));
    return () => {};
  }, [activeUsers]);

  const sendMessage = async () => {
    if (currentMessage !== '') {
      const messageData = {
        author: _id,
        message: currentMessage,
        room: room?._id,
      };
      await socket.emit('send_message', messageData);
      setMessages((list) => [
        ...list,
        {
          ...messageData,
          author: { _id, name },
          _id: Date.now(),
          date: Date.now(),
        },
      ]);
      setCurrentMessage('');
      intoView();
    }
  };
  const intoView = () =>
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  return (
    <main className='content w-100 p-0 m-0'>
      <div className='p-0 m-0 w-100'>
        <div className='card m-0 p-0 w-100'>
          <div className='row g-0 w-100 p-0 m-0'>
            <div className='col-sm-12 col-md-4 col-xl-3 border-end'>
              <div className='px-4 d-md-block'>
                <div className='d-flex align-items-center'>
                  <div className='flex-grow-1'>
                    <AutoComplete
                      backfill={true}
                      onSelect={getRoom}
                      onChange={setSearchUser}
                      value={searchUser}
                      allowClear
                      size='large'
                      className='w-100 rounded my-3'
                      options={options}
                      placeholder='Search users...'
                    />
                  </div>
                </div>
              </div>
              {rooms.map(({ _id: roomId, members }) => (
                <a
                  key={roomId}
                  onClick={() => {
                    const member = members.find(({ _id: id }) => _id !== id);
                    setRoom({ _id: roomId, members });
                    setMember(member);
                    socket.emit('set_room', [_id, member?._id]);
                  }}
                  href='#'
                  className={`list-group-item list-group-item-action border-0 ${
                    roomId === room?._id ? 'active' : ''
                  }`}
                >
                  {/* <div className='badge bg-success float-end'>5</div> */}
                  <div className='d-flex align-items-start'>
                    <img
                      src='https://bootdey.com/img/Content/avatar/avatar5.png'
                      className='rounded-circle me-1'
                      alt='Vanessa Tucker'
                      width='40'
                      height='40'
                    />
                    <div className='flex-grow-1 ms-3'>
                      {members.find(({ _id: id }) => _id !== id)?.name}
                      <div className='small'>
                        <span className='fas fa-circle chat-offline'></span>
                        <BsDot
                          size={26}
                          className='align-self-center'
                          color={
                            active?.includes(
                              members.find(({ _id: id }) => _id !== id)?._id
                            )
                              ? 'green'
                              : 'red'
                          }
                        />
                        {active?.includes(
                          members.find(({ _id: id }) => _id !== id)?._id
                        )
                          ? 'Online'
                          : 'Offline'}
                      </div>
                    </div>
                  </div>
                </a>
              ))}

              <hr className='d-block d-lg-none mt-1 mb-0' />
            </div>
            <div className='col-sm-12 col-md-8 col-xl-9'>
              <div className='py-2 px-4 border-bottom d-none d-lg-block'>
                <div className='d-flex align-items-center py-1'>
                  <div className='position-relative'>
                    <img
                      src='https://bootdey.com/img/Content/avatar/avatar1.png'
                      className='rounded-circle me-1'
                      alt='Sharon Lessman'
                      width='40'
                      height='40'
                    />
                  </div>
                  <div className='flex-grow-1 ps-3'>
                    <strong>{member?.name}</strong>
                    {/* <div className='text-muted small'>
                      <em>Typing...</em>
                    </div> */}
                  </div>
                  <div>
                    {call.isReceivingCall && !callAccepted ? (
                      <button
                        onClick={async () => {
                          setIsCall();
                          await getStream();
                          setTimeout(() => {
                            answerCall();
                          }, 0);
                        }}
                        className='btn btn-success w-100 float-end'
                      >
                        Answer Call
                      </button>
                    ) : isCall || (callAccepted && !callEnded) ? (
                      <button
                        onClick={() => {
                          leaveCall();
                          setIsCall();
                        }}
                        className='btn btn-danger w-100 float-end'
                      >
                        Hang Up
                      </button>
                    ) : (
                      <button
                        onClick={
                          member?.name
                            ? async () => {
                                setIsCall();
                                await getStream();
                                setTimeout(() => {
                                  callUser(
                                    Object.keys(activeUsers)[
                                      active.indexOf(member?._id)
                                    ]
                                  );
                                }, 0);
                              }
                            : () => {}
                        }
                        className='btn btn-primary w-100 float-end'
                      >
                        Call
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {isCall ? (
                <div
                  className='d-flex flex-column justify-content-center align-items-center'
                  style={{ minHeight: 400 }}
                >
                  <video
                    className={`w-75 rounded-3 m-3 shadow-lg${
                      userVideoEnabled ? '' : ' d-none'
                    }`}
                    playsInline
                    ref={userVideo}
                    autoPlay
                  />

                  <Box
                    className={`w-75${userVideoEnabled ? ' d-none' : ''}`}
                    style={{ height: 350 }}
                  >
                    {member?.name}
                  </Box>
                  <Box
                    className={`position-absolute bottom-0 end-0${
                      mediaOptions.video ? ' d-none' : ''
                    }`}
                    style={{ height: 150, width: '19%' }}
                  >
                    {'You'}
                  </Box>
                  {stream && (
                    <video
                      className={`rounded-3 position-absolute bottom-0 end-0 m-3 shadow${
                        mediaOptions.video ? '' : ' d-none'
                      }`}
                      style={{ width: '19%' }}
                      playsInline
                      muted
                      ref={myVideo}
                      autoPlay
                    />
                  )}
                  <div
                    className='d-flex flex-row justify-content-evenly w-50 mb-2'
                    style={{ zIndex: 2 }}
                  >
                    <button
                      onClick={() => {
                        updateVideoStream(
                          Object.keys(activeUsers)[active.indexOf(member?._id)]
                        );
                        setMediaOptions({
                          ...mediaOptions,
                          video: !mediaOptions.video,
                        });
                      }}
                      className='btn btn-primary w-25'
                    >
                      {mediaOptions.video ? 'Video Off' : 'Video On'}
                    </button>
                    <button
                      onClick={() => {
                        updateAudioStream();
                        setMediaOptions({
                          ...mediaOptions,
                          audio: !mediaOptions.audio,
                        });
                      }}
                      className='btn btn-secondary w-25'
                    >
                      {mediaOptions.audio ? 'Mute' : 'Unmute'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className='position-relative'>
                    <div className='chat-messages p-4 d-flex justify-content-center'>
                      {isLoading ? (
                        <Spin size='large' className='align-self-center' />
                      ) : (
                        <>
                          {messages.map(
                            ({ _id: messageId, author, message, date }) => (
                              <div
                                key={messageId}
                                className={`chat-message-${
                                  author?._id === _id ? 'right' : 'left'
                                } ${author?._id === _id ? 'm' : 'p'}b-4`}
                              >
                                <div>
                                  <img
                                    src='https://bootdey.com/img/Content/avatar/avatar1.png'
                                    className='rounded-circle me-1'
                                    alt='Chris Wood'
                                    width='40'
                                    height='40'
                                  />
                                </div>
                                <div>
                                  <div className='min-width flex-shrink-1 text-break bg-light rounded py-2 px-3 me-3'>
                                    <div className='fw-bold mb-1'>
                                      {author?._id === _id
                                        ? 'You'
                                        : member?.name}
                                    </div>
                                    {message}
                                  </div>
                                  <div className='text-muted small float-end text-nowrap mt-1 me-3'>
                                    {moment(date).format('DD-MMM hh:mm')}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                          <div ref={ref} className='w-100 p-0 m-0'></div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className='flex-grow-0 py-3 px-4 border-top'>
                    <div className='input-group'>
                      <input
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        value={currentMessage}
                        type='text'
                        className='form-control'
                        placeholder='Type your message'
                      />
                      <button onClick={sendMessage} className='btn btn-primary'>
                        Send
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const Box = ({ className, style, children }) => (
  <div
    className={`rounded-3 m-3 shadow-lg bg-secondary d-flex justify-content-center align-items-center ${className}`}
    style={{ ...(style || {}) }}
  >
    <h3 className='text-uppercase text-white'>{children}</h3>
  </div>
);

const mapStateToProps = ({
  user: {
    user: { _id, name },
  },
  io: { socket, activeUsers },
  room: { list: rooms, room },
}) => ({
  socket,
  activeUsers,
  _id,
  name,
  rooms,
  room,
});

export default connect(mapStateToProps, { getRooms, setRoom })(Chat);
