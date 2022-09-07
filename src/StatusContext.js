import * as React from "react";
import Message from "./Message";
import { v4 as uuidv4 } from "uuid";

const initialState = {
  messages: [],
};

const StatusContext = React.createContext();

export const statusActions = {
  addMessage: "ADD_MESSAGE",
  remove: "REMOVE",
};

/**
 * For 'Title Case':
 *      const caps = str.split(' ').map(capitalize).join(' ');
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function useStatus() {
  const context = React.useContext(StatusContext);
  if (!context) {
    throw new Error(`useStatus must be used within a StatusProvider`);
  }
  const [state, dispatch] = context;

  const remove = (uuid) => dispatch({ type: statusActions.remove, uuid });
  const addMessage = (message, color, timeout) =>
    dispatch({ type: statusActions.addMessage, message, color, timeout });
  const addError = (error, color) => {
    color = color ?? "danger";
    const title = error.reason;
    const input = error.value;
    const errorMessage = error.message;

    let errorDataMessage = error?.data?.message;
    errorDataMessage = errorDataMessage ? ` - ${errorDataMessage}` : null;

    let message = input
      ? `Invalid input value '${input}'.`
      : title ?? errorMessage;
    message += errorDataMessage ?? "";
    message = capitalize(message);

    // const output = input ? `Invalid input value '${input}'.`  Input should be a signed message (i.e. a hex string).` : title ?? message;

    // console.log('title: %o', title);
    // console.log('input: %o', input);
    // console.log('message: %o', errorMessage);

    dispatch({ type: statusActions.addMessage, message, color });
  };
  const addContractError = (contract, error, color) => {
    color = color ?? "danger";
    const title = error.reason;
    const input = error.value;
    const errorMessage = error.message;

    let errorDataMessage = error?.data?.message;
    errorDataMessage = errorDataMessage ? ` - ${errorDataMessage}` : null;

    // contract specific
    let description = null;
    try {
      let errorData = error?.error?.data?.data;
      errorData = errorData ?? error?.error?.data?.originalError?.data;
      description = errorData ? contract.interface.parseError(errorData) : null;
    } catch (e) {
      console.log("failed to parseError: %o", e);
    }
    description = description ? ` - ${description.errorFragment?.name}` : null;
    // contract.AlreadyClaimed();

    let message = input
      ? `Invalid input value '${input}'.`
      : title ?? errorMessage;
    message += errorDataMessage ?? "";
    message += description ?? "";
    message = capitalize(message);

    // const output = input ? `Invalid input value '${input}'.`  Input should be a signed message (i.e. a hex string).` : title ?? message;

    // console.log('title: %o', title);
    // console.log('input: %o', input);
    // console.log('message: %o', errorMessage);

    dispatch({ type: statusActions.addMessage, message, color });
  };

  return {
    state,
    dispatch,
    remove,
    addMessage,
    addContractError,
    addError,
  };
}

function statusReducer(state, action) {
  switch (action.type) {
    case statusActions.remove: {
      const messages = state.messages.filter(
        (message) => message.uuid !== action.uuid
      );
      return { ...state, messages };
    }
    case statusActions.addMessage: {
      const message = {
        text: action.message,
        color: action.color ?? "success",
        uuid: uuidv4(),
        timeout: action.timeout ?? 5000,
      };
      return { ...state, messages: [...state.messages, message] };
      // const messagesCopy = structuredClone(state.messages);
      // messagesCopy.push(message);
      // return { ...state, messages: messagesCopy };
    }
    default: {
      throw new Error(`Unsupported action type: ${action.type}`);
    }
  }
}

function Messages() {
  const { state, dispatch, addMessage } = useStatus();

  React.useEffect(() => {
    window.ethereum?.on("message", addMessage);
  }, []);

  const messages = [];
  for (let index = 0; index < state.messages.length; index++) {
    const message = state.messages[index];
    const removeIt = () => {
      dispatch({
        type: statusActions.remove,
        uuid: message.uuid,
      });
    };
    messages.push(
      <Message
        variant={message.color}
        callback={removeIt}
        timeout={message.timeout}
        key={message.uuid}
      >
        {message.text}
      </Message>
    );
  }
  return (
    <footer className="footer sticky-footer mt-auto">
      <div className="container">
        <span className="text-muted">{messages}</span>
        {/* <span className="text-muted">{messages.reverse()}</span> */}
      </div>
    </footer>
  );
}

function StatusProvider(props) {
  const [state, dispatch] = React.useReducer(statusReducer, initialState);

  // const value = [state, dispatch];
  const value = React.useMemo(() => {
    return [state, dispatch];
    // NOTE: as a point of debug, you can uncomment the following to see when dispatch was called that caused an error
    // const newDispatch = (args) => {
    //     console.log('put a breakpoint here, or check console...');
    //     console.trace();
    //     dispatch(args);
    // };
    // return [state, newDispatch];
  }, [state]);

  return (
    <StatusContext.Provider
      value={value}
      // value={{ state, dispatch, onReloadNeeded }}
      {...props}
    />
  );
}

export { StatusProvider, Messages, useStatus };
