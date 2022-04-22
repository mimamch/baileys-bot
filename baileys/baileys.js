const makeWASocket = require("@adiwajshing/baileys");
const path = require("path");
const qr = require("qrcode");
const fs = require("fs");

const { state, saveState } = makeWASocket.useSingleFileAuthState(
  path.resolve(__dirname, "log-wa.json")
);
const startSock = () => {
  global.sock = makeWASocket.default({
    auth: state,
    getMessage: async (key) => {
      //   return {
      //     conversation: "hello",
      //   };
    },
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (
      !msg.key.fromMe &&
      m.type === "notify" &&
      msg.key.remoteJid != "status@broadcast" &&
      msg.key.participant == undefined
    ) {
      manageMessage(msg);
    }
  });

  sock.ev.on("connection.update", (conn) => {
    if (conn.qr) {
      // if the 'qr' property is available on 'conn'
      qr.toFile(path.resolve(__dirname, "qr.png"), conn.qr); // generate the file
    } else if (conn.connection && conn.connection === "close") {
      // when websocket is closed
      if (fs.existsSync(path.resolve(__dirname, "qr.png"))) {
        // and, the QR file is exists
        fs.unlinkSync(path.resolve(__dirname, "qr.png")); // delete it
      }
    }
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      // reconnect if not logged out
      startSock();
    }
  });
  sock.ev.on("creds.update", saveState);
};

module.exports = startSock;

const sendMessageWTyping = async (msg, recvMsg, option = {}) => {
  await sock.presenceSubscribe(recvMsg.key.remoteJid);
  await makeWASocket.delay(500);

  await sock.sendPresenceUpdate("composing", recvMsg.key.remoteJid);
  await makeWASocket.delay(2000);

  await sock.sendPresenceUpdate("paused", recvMsg.key.remoteJid);

  if (option.quoted) {
    await sock.sendMessage(recvMsg.key.remoteJid, msg, { quoted: recvMsg });
  } else {
    await sock.sendMessage(recvMsg.key.remoteJid, msg);
  }
};

const manageMessage = (msg) => {
  const conversation = msg.message.conversation.toLowerCase();
  switch (conversation) {
    case "p":
      return sendMessageWTyping(
        { text: "Awali percakapan dengan salam" },
        msg,
        { quoted: true }
      );
    case "mam":
      return sendMessageWTyping({ text: "Iya kenapa?" }, msg);

    case "ping":
      return sendMessageWTyping({ text: "PONG!!!" }, msg);
  }
};
