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

let displayName = sessionStorage.getItem('display_name');
if (!displayName) {
  window.location = 'lobby.html';
}

let localTracks = [];
let remoteUsers = {};

let localScreenTracks;
let sharingScreen = false;

let joinRoomInit = async () => {
  // create agora client
  // The `Codec` encodes and compresses, then decodes and decompresses the data that makes up your video.
  client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  await client.join(APP_ID, roomId, token);

  // triggers when user publishes
  client.on('user-published', handleUserPublished);
  client.on('user-left', handleUserLeft);

  joinStream();
};

// Join stream as presenter
let joinStream = async () => {
  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks(
    {},
    {
      encoderConfig: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
      },
    }
  );

  let player = `<div class="video__container" id="user-container-${uid}">
                  <div class="video-player" id="user-${uid}"></div>
                </div>`;

  document
    .getElementById('streams__container')
    .insertAdjacentHTML('beforeend', player);
  document
    .getElementById(`user-container-${uid}`)
    .addEventListener('click', expandVideoFrame);

  // index 0 is for audio and index 1 is for video
  // play video stream at uid video player
  localTracks[1].play(`user-${uid}`);

  await client.publish([localTracks[0], localTracks[1]]);
};

// switch to camera
let switchToCamera = async () => {
  let player = `<div class="video__container" id="user-container-${uid}">
                  <div class="video-player" id="user-${uid}"></div>
                </div>`;

  document
    .getElementById('streams__container')
    .insertAdjacentHTML('beforeend', player);
  document
    .getElementById(`user-container-${uid}`)
    .addEventListener('click', expandVideoFrame);

  await localTracks[0].setMuted(true);
  await localTracks[1].setMuted(true);

  document.getElementById('mic-btn').classList.remove('active');
  document.getElementById('screen-btn').classList.remove('active');

  localTracks[1].play(`user-${uid}`);
  await client.publish([localTracks[1]]);
};

// user joins
let handleUserPublished = async (user, mediaType) => {
  // add users data in remote users object
  remoteUsers[user.uid] = user;

  // subscribe to user's media data (tracks)
  await client.subscribe(user, mediaType);

  let player = document.getElementById(`user-container-${user.uid}`);
  if (player === null) {
    player = `<div class="video__container" id="user-container-${user.uid}">
                  <div class="video-player" id="user-${user.uid}"></div>
                </div>`;
    document
      .getElementById('streams__container')
      .insertAdjacentHTML('beforeend', player);
    document
      .getElementById(`user-container-${user.uid}`)
      .addEventListener('click', expandVideoFrame);
  }

  if (displayFrame.style.display) {
    player.style.height = '150px';
    player.style.width = '200px';
  }

  if (mediaType === 'video') {
    user.videoTrack.play(`user-${user.uid}`);
  }
  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
};

let handleUserLeft = async (user) => {
  delete remoteUsers[user.uid];
  document.getElementById(`user-container-${user.uid}`).remove();

  if (userIdInDisplayFrame === `user-container-${user.uid}`) {
    displayFrame.style.display = null;

    let videoFrames = document.getElementsByClassName('video__container');
    for (let i = 0; i < videoFrames.length; i++) {
      videoFrames[i].style.height = '300px';
      videoFrames[i].style.width = '500px';
    }
  }
};

let toggleMic = async (e) => {
  let button = e.currentTarget;

  if (localTracks[0].muted) {
    await localTracks[0].setMuted(false);
    button.classList.add('active');
  } else {
    await localTracks[0].setMuted(true);
    button.classList.remove('active');
  }
};

let toggleCamera = async (e) => {
  let button = e.currentTarget;

  if (localTracks[1].muted) {
    await localTracks[1].setMuted(false);
    button.classList.add('active');
  } else {
    await localTracks[1].setMuted(true);
    button.classList.remove('active');
  }
};

let toggleScreen = async (e) => {
  let screenBtn = e.currentTarget;
  let cameraBtn = document.getElementById('camera-btn');

  if (!sharingScreen) {
    sharingScreen = true;

    screenBtn.classList.add('active');
    cameraBtn.classList.remove('active');
    cameraBtn.style.display = 'none';

    localScreenTracks = await AgoraRTC.createScreenVideoTrack();

    document.getElementById(`user-container-${uid}`).remove();
    displayFrame.style.display = 'block';

    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                  </div>`;

    displayFrame.insertAdjacentHTML('beforeend', player);
    document
      .getElementById(`user-container-${uid}`)
      .addEventListener('click', expandVideoFrame);

    userIdInDisplayFrame = `user-container-${uid}`;
    localScreenTracks.play(`user-${uid}`);

    // unpublish presenter's localTracks and his screen to the view.
    await client.unpublish([localTracks[1]]);
    await client.publish([localScreenTracks]);

    for (let i = 0; i < videoFrames.length; i++) {
      if (videoFrames[i].id !== userIdInDisplayFrame) {
        videoFrames[i].style.height = '150px';
        videoFrames[i].style.width = '200px';
      }
    }
  } else {
    sharingScreen = false;
    cameraBtn.style.display = 'block';
    document.getElementById(`user-container-${uid}`).remove();
    displayFrame.style.display = 'none';

    await client.unpublish([localScreenTracks]);

    switchToCamera();
  }
};

document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('screen-btn').addEventListener('click', toggleScreen);

joinRoomInit();
