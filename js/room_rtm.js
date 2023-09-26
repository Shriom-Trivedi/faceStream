let handleMemberJoined = async (memberId) => {
  console.log(`A new member has joined this channel: ${memberId}`);
  addMemberToDom(memberId);

  let members = await channel.getMembers();
  updateMemberTotal(members);

  let { name } = await rtmClient.getUserAttributesByKeys(memberId, ['name']);
  addBotMessageToDom(`${name} just joined!`);
};

let addMemberToDom = async (memberId) => {
  let { name } = await rtmClient.getUserAttributesByKeys(memberId, ['name']);
  let membersWrapper = document.getElementById('member__list');
  let memberItem = `<div class="member__wrapper" id="member__${memberId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${name}</p>
                    </div>
                    `;
  membersWrapper.insertAdjacentHTML('beforeend', memberItem);
};

let updateMemberTotal = async (members) => {
  let total = document.getElementById('members__count');
  total.innerText = members.length;
};

let handleMemberLeft = async (memberId) => {
  console.log(`member ${memberId} has left the channel.`);
  removeMemberFromDom(memberId);
  let members = await channel.getMembers();
  updateMemberTotal(members);
};

let removeMemberFromDom = async (memberId) => {
  let memberItem = document.getElementById(`member__${memberId}__wrapper`);

  let name = memberItem.getElementsByClassName('member_name')[0].textContent;
  addBotMessageToDom(`${name} has left the room.`);

  memberItem.remove();
};

// get all members from a channel and add it to DOM.
let getMembers = async () => {
  let members = await channel.getMembers();
  updateMemberTotal(members);

  for (let i = 0; members.length > i; i++) {
    addMemberToDom(members[i]);
  }
};

// Send message to the channel.
let sendMessage = async (e) => {
  e.preventDefault();
  const message = e.target.message.value;

  channel.sendMessage({
    text: JSON.stringify({
      type: 'chat',
      message: message,
      displayName: displayName,
    }),
  });

  addMessageToDom(displayName, message);

  e.target.reset();
};

let handleChannelMessage = async (messageData, memberId) => {
  console.log(`A new message recieved`);
  let data = JSON.parse(messageData.text);

  if (data.type === 'chat') {
    addMessageToDom(data.displayName, data.message);
  }

  if (data.type === 'user_left') {
    console.log({ uid: `user-container-${data.uid}` });
    document.getElementById(`user-container-${data.uid}`).remove();

    if (userIdInDisplayFrame === `user-container-${uid}`) {
      displayFrame.style.display = null;

      for (let i = 0; videoFrames.length > i; i++) {
        videoFrames[i].style.height = '300px';
        videoFrames[i].style.width = '300px';
      }
    }
  }
};

let addMessageToDom = async (name, message) => {
  let messageWrapper = document.getElementById('messages');
  let newMessage = `<div class="message__wrapper">
                      <div class="message__body">
                          <strong class="message__author">${name}</strong>
                          <p class="message__text">${message}</p>
                      </div>
                    </div>
                  `;
  messageWrapper.insertAdjacentHTML('beforeend', newMessage);

  // scroll to end when a new message is there.
  let lastMessage = document.querySelector(
    '#messages .message__wrapper:last-child'
  );
  if (lastMessage) {
    lastMessage.scrollIntoView();
  }
};

// add bot messages
let addBotMessageToDom = async (message) => {
  let messageWrapper = document.getElementById('messages');
  let newMessage = `<div class="message__wrapper">
                      <div class="message__body__bot">
                          <strong class="message__author__bot">🤖 FaceStream Bot</strong>
                          <p class="message__text__bot">${message}</p>
                      </div>
                    </div>
                  `;
  messageWrapper.insertAdjacentHTML('beforeend', newMessage);

  // scroll to end when a new message is there.
  let lastMessage = document.querySelector(
    '#messages .message__wrapper:last-child'
  );
  if (lastMessage) {
    lastMessage.scrollIntoView();
  }
};

let leaveChannel = async () => {
  await channel.leave();
  await rtmClient.logout();
};

// Triggers when user cuts browser
window.addEventListener('beforeunload', leaveChannel);
// send message event
let messageForm = document.getElementById('message__form');
messageForm.addEventListener('submit', sendMessage);
