const APP_ID = 'c48ebc7f93cc4dc29af9549672f6c01d';

let uid = sessionStorage.getItem('uid');
if (!uid) {
  uid = String(Math.floor(Math.random() * 10000));
  sessionStorage.setItem('uid', uid);
}

let token = null;

let client;

// Get room Id from URL
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

if (!roomId) {
  roomId = 'main'; // FIXME: redirect to index.html
}

let localTracks = [];
let remoteUsers = {};

let joinRoomInit = async () => {
  // create agora client
  // The `Codec` encodes and compresses, then decodes and decompresses the data that makes up your video.
  client = AgoraRTC.createClient({ mode: 'rtc', codex: 'vp8' });
  await client.join(APP_ID, roomId, token);

  joinStream();
};

// Join stream as presenter
let joinStream = async () => {
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  let player = ``
};

joinRoomInit();
