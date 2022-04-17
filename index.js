const makeWASocket = require("@adiwajshing/baileys");
const {
  makeWALegacySocket,
  AnyMessageContent,
  delay,
  DisconnectReason,
  makeInMemoryStore,
  useSingleFileAuthState,
} = require("@adiwajshing/baileys");

const { state, saveState } = useSingleFileAuthState("./auth_info_multi.json");
const startSock = () => {
  const sock = makeWASocket.default({
    printQRInTerminal: true,
    auth: state,
    getMessage: async (key) => {
      console.log("key>>>>>>>>>", key);
      //   return {
      //     conversation: "hello",
      //   };
    },
  });

  const sendMessageWTyping = async (msg, recvMsg) => {
    await sock.presenceSubscribe(recvMsg.key.remoteJid);
    await delay(500);

    await sock.sendPresenceUpdate("composing", recvMsg.key.remoteJid);
    await delay(2000);

    await sock.sendPresenceUpdate("paused", recvMsg.key.remoteJid);

    await sock.sendMessage(recvMsg.key.remoteJid, msg, { quoted: recvMsg });
  };

  sock.ev.on("chats.set", (item) =>
    console.log(`recv ${item.chats.length} chats (is latest: ${item.isLatest})`)
  );
  sock.ev.on("messages.set", (item) =>
    console.log(
      `recv ${item.messages.length} messages (is latest: ${item.isLatest})`
    )
  );
  sock.ev.on("contacts.set", (item) =>
    console.log(`recv ${item.contacts.length} contacts`)
  );

  sock.ev.on("messages.upsert", async (m) => {
    console.log(JSON.stringify(m, undefined, 2));

    const msg = m.messages[0];
    if (
      !msg.key.fromMe &&
      m.type === "notify" &&
      msg.key.remoteJid != "status@broadcast" &&
      msg.key.participant == undefined
    ) {
      console.log("msg>>>>>>>>>>", msg);
      console.log("replying to", m.messages[0].key.remoteJid);
      // await sock!.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [msg.key.id])
      const date = new Date();
      await sendMessageWTyping(
        {
          text: `Halo 🖐, Pesan anda akan dibalas sebentar lagi
*sekarang pukul ${date.getHours()}.${date.getMinutes()} waktu server*`,
        },
        msg
      );
    }
  });

  //   sock.ev.on("messages.update", (m) => console.log(m));
  //   sock.ev.on("message-receipt.update", (m) => console.log(m));
  //   sock.ev.on("presence.update", (m) => console.log(m));
  //   sock.ev.on("chats.update", (m) => console.log(m));
  //   sock.ev.on("contacts.upsert", (m) => console.log(m));

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      // reconnect if not logged out
      startSock();
      // if((lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
      // } else {
      // 	console.log('connection closed')
      // }
    }

    console.log("connection update", update);
  });
  // listen for when the auth credentials is updated
  sock.ev.on("creds.update", saveState);

  return sock;
};

startSock();
