import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import io from "socket.io-client";
import useSound from "use-sound";
import config from "../../../config";
import LatestMessagesContext from "../../../contexts/LatestMessages/LatestMessages";
import TypingMessage from "./TypingMessage";
import Header from "./Header";
import Footer from "./Footer";
import Message from "./Message";
import "../styles/_messages.scss";
import initialBottyMessage from "../../../common/constants/initialBottyMessage";
import { BOT, ME } from "./constants/users";
import { BOT_TYPING, BOT_MESSAGE, USER_MESSAGE } from "./constants/events";

const socket = io(config.BOT_SERVER_ENDPOINT, {
  transports: ["websocket", "polling", "flashsocket"],
});

function Messages() {
  const [messages, setMessages] = useState([
    {
      user: BOT,
      message: initialBottyMessage,
      id: `${BOT}-${new Date().getMilliseconds()}`,
    },
  ]);
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const bottomDiv = useRef();
  const { setLatestMessage } = useContext(LatestMessagesContext);

  const [nextMessage, setNextMessage] = useState("");
  const [botTyping, setBotTyping] = useState(false);

  function handleBotMessage(message) {
    playReceive();
    setBotTyping(false);
    setMessages((oldMessages) => [
      ...oldMessages,
      { user: BOT, message, id: `${BOT}-${new Date().getMilliseconds()}` },
    ]);
    setLatestMessage(BOT, message);
    bottomDiv.current.scrollIntoView({ behavior: "smooth" });
  }

  const sendMessage = useCallback(
    (e) => {
      if (e) e.preventDefault();
      playSend();
      socket.emit(USER_MESSAGE, nextMessage);
      setMessages((oldMessages) => [
        ...oldMessages,
        {
          user: ME,
          message: nextMessage,
          id: `${ME}-${new Date().getMilliseconds()}`,
        },
      ]);
      setNextMessage("");
      bottomDiv.current.scrollIntoView({ behavior: "smooth" });
    },
    [nextMessage, playSend]
  );

  function onChangeMessage(e) {
    setNextMessage(e.target.value);
  }

  useEffect(() => {
    socket.on(BOT_TYPING, () => {
      setBotTyping(true);
      bottomDiv.current.scrollIntoView({ behavior: "smooth" });
    });
    socket.on(BOT_MESSAGE, handleBotMessage);
  }, []);

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        {messages.map((message, index) => (
          <div key={message.id}>
            <Message
              nextMessage={nextMessage}
              message={message}
              botTyping={botTyping}
            />
          </div>
        ))}
        {botTyping && <TypingMessage />}
        <div ref={bottomDiv} />
      </div>
      <Footer
        message={nextMessage}
        sendMessage={sendMessage}
        onChangeMessage={onChangeMessage}
      />
    </div>
  );
}

export default Messages;
