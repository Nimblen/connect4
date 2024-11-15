import { createBoard, playMove } from "./connect4.js";

function getWebSocketServer() {
  if (window.location.host === "python-websockets.github.io") {
    return "wss://websockets-tutorial.herokuapp.com/";
  } else if (window.location.host === "localhost:8000") {
    return "ws://localhost:8001/";
  } else {
    throw new Error(`Unsupported host: ${window.location.host}`);
  }
}

function initGame(websocket) {
  websocket.addEventListener("open", () => {
    const params = new URLSearchParams(window.location.search);
    let event = { type: "init" };
    if (params.has("join")) {
      event.join = params.get("join");
    } else if (params.has("watch")) {
      event.watch = params.get("watch");
    }
    websocket.send(JSON.stringify(event));
  });
}

function showMessage(message) {
  window.setTimeout(() => window.alert(message), 50);
}

function receiveMoves(board, websocket) {
  websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    switch (event.type) {
      case "init":
        document.querySelector(".join").href = "?join=" + event.join;
        document.querySelector(".watch").href = "?watch=" + event.watch;
        break;
      case "play":
        playMove(board, event.player, event.column, event.row);
        break;
      case "win":
        showMessage(`Player ${event.player} wins!`);
        websocket.close(1000);
        break;
      case "error":
        showMessage(event.message);
        break;
      default:
        throw new Error(`Unsupported event type: ${event.type}.`);
    }
  });
}

function sendMoves(board, websocket) {
  const params = new URLSearchParams(window.location.search);
  if (params.has("watch")) return;

  board.addEventListener("click", ({ target }) => {
    const column = target.dataset.column;
    if (column === undefined) return;
    const event = {
      type: "play",
      column: parseInt(column, 10),
    };
    websocket.send(JSON.stringify(event));
  });
}

// Chat functionality
function receiveMessages(websocket) {
  const chatMessages = document.getElementById("chat-messages");

  websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    if (event.type === "chat") {
      const messageElement = document.createElement("div");
      messageElement.textContent = `${event.player}: ${event.message}`;
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });
}

function sendMessage(websocket) {
  const chatInput = document.getElementById("chat-input");
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const message = chatInput.value.trim();
      if (message) {
        const event = { type: "chat", message };
        websocket.send(JSON.stringify(event));
        chatInput.value = "";
      }
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const board = document.querySelector(".board");
  createBoard(board);

  const websocket = new WebSocket(getWebSocketServer());
  initGame(websocket);
  receiveMoves(board, websocket);
  sendMoves(board, websocket);
  receiveMessages(websocket);
  sendMessage(websocket);
});
