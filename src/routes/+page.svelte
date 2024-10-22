<script>
    import { FirebaseDB as db } from '$lib/firebase/firebase.js';
    import { getDatabase, orderByChild, off,  ref, set, remove,  update, child, onValue, onChildAdded } from "firebase/database";
    import { onMount, tick } from 'svelte';
    import papa from 'papaparse'; import { testData, dummyMessageData } from './testData.js';
    import { user as currentLoggedInUser } from '$lib/stores/stores.js';


    let currentUserRef = '';

    let users = new Set();

    let userName = 'Default';
    function writeUserData(phone, message, type='sent', name='Default') {
        const timestamp = Date.now();

        if(type !== 'sent' && type !== 'received') {
            console.error('Invalid message type');
            console.log('Message type must be either "sent" or "received"');
            return;
        }

        //todo: update with one data structure
        update(ref(db, currentUserRef + 'messages/' + phone + '/messages'), {
            [timestamp]: {
                message: message,
                type: type,
            }
        }).then(() => {
            // console.log('Data written successfully!');
        }).catch((error) => {
            console.error('Error writing data: ', error);
            console.log('Data not written successfully!', error);
        });


        let userID = phone;
        update(ref(db, currentUserRef + 'users/' + phone + '/data/'), {
                lastMessage: message,
                timestamp: timestamp,
        }).then(() => {
            // console.log('Data written successfully!');
        }).catch((error) => {
            console.error('Error writing data: ', error);
            console.log('Data not written successfully!', error);
        });

        update(ref(db, currentUserRef + 'users/' + phone), {
            ['info']: {
                name: name,
            }
        }).then(() => {
            // console.log('Data written successfully!');
        }).catch((error) => {
            console.error('Error writing data: ', error);
            console.log('Data not written successfully!', error);
        });

    }

    async function getUserData(phone) {
        const _userRef = ref(db, currentUserRef + 'messages/' + phone);
        //console.log('user ref: ', _userRef);
        onValue(_userRef, (snapshot) => {
            data = snapshot.val();
         //   console.log('data', data);
            if(!data){
                data = {
                    messages: {},
                }
            }else{
                data = data;
            }
            currentMessages = data.messages;
            // console.log('data', data);
        });
        await tick();
    }


    let messageState = null;
    let data = {};
    let usersData = {};
    let userRef = ref(db, currentUserRef + 'users/');
    function getAllUserData() {
        // const userRef = ref(db, 'users/');
        userRef = ref(db, currentUserRef + 'users/');
        //console.log('Getting all user data');
        //console.log('user ref: ', userRef);
        onValue(userRef, (snapshot) => {
            if(snapshot.val()){
                usersData = snapshot.val();
                usersData = usersData;
                // users = sortUsersByTimestamp(usersData);
                handleUserType(currentUserType);
                // users = sortUsersByReceivedMessages(usersData);
            }else{
                usersData = {};
            }
        }, {
        });
    }



    function blockUser(){
      //add user to blocked list on database
      const _ref = ref(db, currentUserRef + 'blocked/' + selectedUser);
      //time in milliseconds
      const timestamp = Date.now();

      set(_ref, {
          timestamp: timestamp,
      }).then(() => {
          // console.log('Data written successfully!');
          handleUserType(currentUserType);
      }).catch((error) => {
          console.error('Error blocking user: ', error);
          console.log('User not blocked successfully!', error);
      });
    }

    function unblockUser(){
      //remove user from blocked list on database
      const _ref = ref(db, currentUserRef + 'blocked/' + selectedUser);
      remove(_ref).then(() => {
          // console.log('Data written successfully!');
          //blockedUsers.delete(selectedUser);
          //blockedUsers = blockedUsers;
          handleUserType(currentUserType);
      }).catch((error) => {
          console.error('Error unblocking user: ', error);
          console.log('user not unblocked successfully!', error);
      });
    }


    let blockedUsers = new Set();
    function getBlockedUsers(){
      const _ref = ref(db, currentUserRef + 'blocked/');
      onValue(_ref, (snapshot) => {
          //console.log('blocked users: ', snapshot.val());
          if(snapshot.val()){
              blockedUsers = new Set(Object.keys(snapshot.val()));
          }
      });
    }

    function writeDummyData() {
        dummyMessageData.forEach(function(data, index) {
            setTimeout(function(){
                writeUserData(data.phone, data.message);
            }, 1000 * (index + 1));
        });
        console.log('All data written!');
    }
    // writeDummyData();   

    function testUserData() {
        testData.forEach(function(data, index) {
            setTimeout(function(){
                writeUserData(data.phone, 'yo where did you get that transmog?', 'sent', data.name);
            }, 1000 * (index + 1));
        });
        console.log('All data written!');
    }

    let dat;
    onMount(() => {
        // getAllUserData();
        // usersData = testData;
    }); 


    function sortUsersByTimestamp(_usersData){
        let u = new Set(Object.keys(_usersData));
        //sort users by last message timestamp
        let ret = new Set([...u].sort((a, b) => {
            return (_usersData[b].data.timestamp || Infinity) - (_usersData[a].data.timestamp || Infinity);
        }));


        ret = ret;
        return ret;
    }

    function sortUsersByReceivedMessages(_usersData){
        let u = sortUsersByTimestamp(_usersData);
        let received = new Set();
        let notReceived = new Set();
        u.forEach(user => {
            if(_usersData[user].messagesReceived){
                received.add(user);
            }else{
                notReceived.add(user);
            }
        });
        let ret = new Set([...received, ...notReceived]);
        ret = ret;
        return ret;
    }

    function getEngagedUsers(_usersData){
        let u = sortUsersByTimestamp(_usersData);
        let ret = new Set();
        u.forEach(user => {
            if(_usersData[user].messagesReceived){
                ret.add(user);
            }
        });
        ret = ret;
        return ret;
    }


/*
    $: {
        if(usersData){
            users = sortUsersByReceivedMessages(usersData);
        }
    }
    */

    let selectedUserRef = null; 
    /*
    $: {
        if(selectedUser !== ''){
            if(selectedUserRef){
                try{
                  off(selectedUserRef);
                }catch(e){
                  console.error(e);
                  console.log('unable to remove listener', e);
                }
                selectedUserRef = null;
            }
            selectedUserRef = ref(db, currentUserRef + 'messages/' + selectedUser);

            onValue(selectedUserRef, (snapshot) => {
                data = snapshot.val();
                data = data;
            });

        }
    }
    */

    let currentMessages = [];

    let selectedUser = '';
    async function handleUser(user){
        if(user === selectedUser) {

          if(usersData[user].messagesReceived){
            if(usersData[user].messagesReceived === 1){
              update(ref(db, currentUserRef + 'users/' + user), {
                  messagesReceived: 2,
              }).then(() => {
                  // console.log('Data written successfully!');
                  usersData[user].messagesReceived = 2;
              }).catch((error) => {
                  console.error('Error writing data: ', error);
                  console.log('unable to update messages!', error);
              });
            }
          }

          return;
        }

        
        //remove previous listener
        if(selectedUserRef){
          off(selectedUserRef);
          selectedUserRef = null;
        }

        messageState = 'chat';
        selectedUser = user;

        selectedUserRef = ref(db, currentUserRef + 'messages/' + user);

        onValue(selectedUserRef, (snapshot) => {
            data = snapshot.val();
            if(!data){
                data = {
                    messages: {},
                }
            }else{
                data = data;
            }
            currentMessages = data.messages;
            // console.log('data', data);
        });

        if(usersData[user].messagesReceived){
            update(ref(db, currentUserRef + 'users/' + user), {
                messagesReceived: 2,
            }).then(() => {
                // console.log('Data written successfully!');
            }).catch((error) => {
                console.error('Error writing data: ', error);
                console.log('Data not written successfully!', error);
            });
        }

        getUserData(user);
        await tick();
        userName = usersData[user].info.name;
        currentMessages = data.messages;
        userName = userName;
        currentMessages = currentMessages;
        // currentMessages = data[user].messages;
    }

/*
    let usersType = 'all';
    let engagedUsers = new Set();
    $: {
        engagedUsers = getEngagedUsers(usersData);
    }
    */

    let inputMessage = '';

    function sendTwilioMessage(message){
      //send message to twilio api https://gnschat-9300.twil.io/welcome
      const sendURL = 'https://gnschat-9300.twil.io/welcome';
      const response = fetch(sendURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })
        .then(response => response.json())
        .then(data => {
        //   console.log('Success:', data);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }

    function handleSend(mass=false){
        if(inputMessage.trim() === '') return;
        writeUserData(selectedUser, inputMessage, 'sent', userName);
        let to = formatPhone(selectedUser);
        let from = userInfo[currentUserName].phone || '+18254620440';
        let message = {
          to: to,
          from: from,
          body: inputMessage,
        }

        handleUser(selectedUser);
        sendTwilioMessage(message);

        inputMessage = '';
    }

    function getFirstName(name){
        let formattedName = name.split(' ')[0];
        return formattedName;
    }

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    let currentMessageIndex = 0;
    let totalMessages = 0;
    let enableMass = true;

    async function sendMassText(){
        if(massMessage.trim() === '') return;
        let formattedPhone;
        let formattedMessage;

        totalMessages = massData.length;
        currentMessageIndex = 0;
        enableMass = false;

        off(userRef);


        massData.forEach(async function(data){
            formattedPhone = formatPhone(data.phone);
            formattedMessage = massMessage;
            /*
            if(currentUserName !== 'admin'){
              formattedMessage += '\n\nSTOP2END';
            }
            */
            writeUserData(data.phone, formattedMessage, 'sent', data.name);
            //regex for valid phone number
            if(!formattedPhone.match(/^\+1\d{10}$/)){
                console.error('Invalid phone number: ', formattedPhone);
                //console.log('Phone number must be in the format +1XXXXXXXXXX: ', formattedPhone);
                return;
            }else{
                sendTwilioMessage({
                    to: formatPhone(data.phone),
                    from: userInfo[currentUserName].phone || '+18254620440',
                    body: formattedMessage,
                })
            }
            currentMessageIndex++;
        });
        clearMassData();
    }

    let editUserName = false;

    let changeUserName = () => {
        editUserName = false;
        update(ref(db, currentUserRef + 'users/' + selectedUser), {
            name: userName,
        }).then(() => {
            // console.log('Data written successfully!');
        }).catch((error) => {
            console.error('Error writing data: ', error);
            console.log('Data not written successfully!', error);
        });
    }

    let cancelEdit = () => {
        editUserName = false;
        userName = usersData[selectedUser].info.name;
    }

    function handleMass(){
        if(messageState === 'mass'){
            messageState = null;
            return;
        }else if(messageState === 'chat'){
            // selectedUser = '';
            messageState = 'mass';
        }else{
            messageState = 'mass';
        }
    }

    function handleChat(){
        if(messageState === 'chat'){
            // messageState = null;
            messageState = null;
            currentMessages = [];
            selectedUser = '';
            return;
        }else if(messageState === 'mass'){
            messageState = 'chat';
        }else{
            messageState = 'chat';
        }
    }


    function submit(event) {
        if (event.key === 'Enter') {
            if(inputMessage.trim() !== ''){
                handleSend();
            }
        }else{
            // console.log('Key pressed: ', event.key);
        }
    }

    let files;
    let fileElement;


    let massData = [];
    async function handleChange(event) {
        let files = event.target.files;
        let dat = await readCSV(files[0]);
        duplicatePhoneNumbers = [];
        sortData(dat);
        // console.log(massData);
    }

    function formatPhone(phone) {
        let phoneString = phone.toString();

        let noContactFlags = [ 'NIS', 'DNC', 'NO CONTACT', 'no contact', 
          'No Contact', 'DO NOT CALL', 'nis', 'dnc'];
        noContactFlags.forEach((flag) => {
          if(phoneString.includes(flag)){
            console.error('No contact phone number: ', phoneString);
            phoneString = '';
          }
        });

        // reformat from (123) 456-7890 to +11234567890
        phoneString = phoneString.replace(/\D/g, '');
        if(phoneString.length === 10){
            phoneString = '+1' + phoneString;
        }else if(phoneString.length === 11){
            phoneString = '+' + phoneString;
        }
  
        if(!phoneString.match(/^\+1\d{10}$/)){
            console.error('Invalid phone number: ', phoneString);
            //console.log('Phone number must be in the format +1XXXXXXXXXX: ', phoneString);
            phoneString = null;
        }

        return phoneString;
    }

    function formatName(name) {
        // reformat name from all caps to first letter caps
        if(!name){
            return 'Default';
        }
        let nameString = name.toString();
        nameString = nameString.toLowerCase();
        //capitalize the first letter of each word
        nameString = nameString.replace(/\b\w/g, l => l.toUpperCase());
        return nameString;
    }

    function convertTimeStamp(timestamp){
        let ts = parseInt(timestamp);
        let date = new Date(ts);
        let formattedDate = date.toLocaleString();
        return formattedDate;
    }

    let duplicatePhoneNumbers = [];
    function sortData(data) {
        massData = [];
        let phoneNumbers = []; //store phone numbers to check for duplicates
        let phoneKey = 'PHONE NUMBER';
        let noteKey = 'NOTE'
        let nameKey = 'NAME';
        let emailKey = 'EMAIL';
        data.forEach(function(row){
            let name = formatName(row[nameKey]);
            let phone = row[phoneKey];
            let note = row[noteKey];
            let email = row[emailKey];

            if(!phone){
                console.error('Invalid phone number: ', phone);
            }else if(phone.includes('/')){
              let phoneArray = phone.split('/');
              phoneArray.forEach((phoneNumber) => {
                phone = formatPhone(phoneNumber);
                if(phone){
                    if(!phoneNumbers.includes(phone) && !users.has(phone)){
                        phoneNumbers.push(phone);
                        massData.push({
                            name: name || 'Default',
                            phone: phone,
                            note: note,
                            email: email || '',
                        });
                        massData = massData;
                    }else{
                        duplicatePhoneNumbers.push(phone);
                        console.error('Phone number already exists: ', phone);
                    }
                }
              });
            }else{
              phone = formatPhone(phone);
              if(phone){
                  if(!phoneNumbers.includes(phone) && !users.has(phone)){
                      phoneNumbers.push(phone);
                      massData.push({
                          name: name || 'Default',
                          phone: phone,
                          note: note,
                          email: email || '',
                      });
                      massData = massData;
                  }else{
                    duplicatePhoneNumbers.push(phone);
                    console.error('Phone number already exists: ', phone);
                  }
              }
            }
        });
        duplicatePhoneNumbers = duplicatePhoneNumbers;
    }


    const readCSV = async (file) => {
        return new Promise(resolve => {
            papa.parse(file, {
                header: true,
                complete: results => {
                    console.log('Complete', results.data.length, 'records.'); 
                    resolve(results.data);
                }
            });
        });
    };

    function handleRemove(index){
        massData.splice(index, 1);
        massData = massData;
    }

    let massMessage = '';
    function getMoney(){
        // massData.forEach(function(data){
        //     writeUserData(data.phone, massMessage, 'sent', data.name);
        // });
        // clearMassData();
        sendMassText();
    }

    function clearMassData(){
        massData = [];
        massData = massData;
        duplicatePhoneNumbers = [];
        massMessage = '';
        enableMass = true;
        currentMessageIndex = 0;
        totalMessages = 0;
        files = null;
        fileElement.value = '';

        getAllUserData();
    }

    let numUsers = 10;
    let searchValue = '';

    $: {
      try{
        let search = searchValue.toLowerCase().trim();
        if(search === ''){
            {/* users = new Set(Object.keys(usersData)); */}
            // users = sortUsersByTimestamp(usersData);
            // users = sortUsersByReceivedMessages(usersData);
            handleUserType(currentUserType);
        }else{
          // users = sortUsersByTimestamp(usersData);
          // users = sortUsersByReceivedMessages(usersData);
          handleUserType(currentUserType);
          users = new Set(Array.from(users).filter(user => {
            if(usersData[user].info){
              return usersData[user].info.name.toLowerCase().includes(search) 
              || usersData[user].data.lastMessage.toLowerCase().includes(search)
              || user.includes(search);
            }else{
              return false;
            }
          }));
        }
      }catch(e){
        console.error(e);
      }
    }

    let loginStatus = null;
    let loginSuccess = false;
    let currentUserName = '';
    let userNameInput = '';
    let passwordInput = '';


    let unused = {
      'wjtibbo@gmail.com': 'Hologram',
      'ray@greatnorthfinance.com': 'Kaleidoscope',
      'tenneson@greatnorthfinance.com': 'Juxtapose',
      'sohrab@greatnorthfinance.com': 'Zephyr',
      'brandon@greatnorthfinance.com': 'Quagmire',
      'garrett@squamishdodgejeepram.com': 'Labyrinth',
      'neima@squamishdodgejeepram.com': 'Nebula',
    };


    let loginCredentials = {
      'jeremy@squamishdodgejeepram.com': 'Vellichor',
      'cruz@squamishdodgejeepram.com': 'Serendipity',
      'wjtibbo@gmail.com': 'Hologram',
      'Arleneteves48@gmail.com': 'Serenity',
      'wins.teves27@gmail.com': 'Polaris',
      'mayann.teve91@gmail.com': 'Aurora',
      'airynnavarro@gmail.com': 'Erudite',
      'ramospatriciapaula@gmail.com': 'Ethereal',
      'sabrina@greatnorthfinance.com': 'Austere',
      'admin': 'lolxd ;]',
      'guest': 'Dichotomy',
      'nima@squamishdodgejeepram.com': 'Nebula',
      'neima@squamishdodgejeepram.com': 'Quadradic',
      'ocheregaming@gmail.com': 'Popcorn',
      'matttownsend2013@gmail.com': 'Peanut',
    };

    let userInfo = {
      'ocheregaming@gmail.com': {
        'name': 'cherise',
        'password': 'Popcorn',
        'phone': '+17789496722'
      },
      'matttownsend2013@gmail.com': {
       'name': 'matt',
       'password': 'Peanut',
       'phone': '+17789497373'
       },
      'nima@squamishdodgejeepram.com': {
        'name': 'nima',
        'password': 'Nebula',
        'phone': '+17787432512'
      },
      'neima@squamishdodgejeepram.com': {
        'name': 'neima',
        'password': 'Quadradic',
        'phone': '+17787196815'
      },
      'guest' : {
        'name': 'guest',
        'password': 'Dichotomy',
        'phone': '+12363019250'
      },
      'cruz@squamishdodgejeepram.com': {
        'name': 'cruz',
        'password': 'Serendipity',
        'phone': '+16043054717'
      },
      'sabrina@greatnorthfinance.com': {
        'name': 'gnf',
        'password': 'Austere',
        'phone': '+12362465467'
      },
      'jeremy@squamishdodgejeepram.com': {
        'name': 'jeremy',
        'password': 'Vellichor',
        'phone': '+16043596071'
      },
      'ramospatriciapaula@gmail.com': {
        'name': 'paula',
        'password': 'Ethereal',
        'phone': '+15877427096'
      },
      'airynnavarro@gmail.com': {
        'name': 'airyn',
        'password': 'Erudite',
        'phone': '+15878175350'
      },
      'mayann.teve91@gmail.com': {
        'name': 'mayann',
        'password': 'Aurora',
        'phone': '+15878166968'
      },
      'wins.teves27@gmail.com': {
        'name': 'winston',
        'password': 'Polaris',
        'phone': '+15878047994'
      },
      'wjtibbo@gmail.com': {
        'name': 'jeff',
        'password': 'Hologram',
        'phone': '+12494448225'
      },
      'Arleneteves48@gmail.com': {
        'name': 'arlene',
        'password': 'Serenity',
        'phone': '+15878405695'
      },
      'admin': {
        'name': 'admin',
        'password': 'lolxd ;]',
        'phone': '+15484883983'
      },
    }


/*
    let count = 1;
    for(let user in userInfo){
      console.log('user: ', count);
      console.log('name: ', userInfo[user].name);
      console.log('user: ', user);
      console.log('password: ', userInfo[user].password);
      console.log('phone: ', userInfo[user].phone);
      count++;
    }

    console.log('login credentials: ', Object.keys(loginCredentials));
  */



    function handleLogin(event){
      if(event === 'click' || event.key === 'Enter'){
        if(loginCredentials[userNameInput] === passwordInput){
            loginSuccess = true;
            loginStatus = 'success';
            off(userRef);
            usersData = {};
            currentUserName = userNameInput;
            currentLoggedInUser.set(userInfo[currentUserName]);
            
            if(currentUserName == 'admin'){
              currentUserRef = '';
            }else{
              currentUserRef = 'textblaster/' + userInfo[currentUserName].name + '/';
            }
            console.log('logged in as: ', currentUserName);
            console.log('getting their data');
            getAllUserData();
            getBlockedUsers();
            getLabels();

        }else{
            loginSuccess = false;
            loginStatus = 'invalid login';
        }
      }
    }

    let labeledUsers = {
      'red': new Set('test'),
      'yellow': new Set(),
      'green': new Set(),
    };

    function labelUser(user, label){
      let currentLabel = '';

      Object.keys(labeledUsers).forEach((key) => {
        if(labeledUsers[key].has(user)){
          labeledUsers[key].delete(user);
          currentLabel = key;
        }
      });

      if(currentLabel !== label){
        labeledUsers[label].add(user);
        labeledUsers = labeledUsers;
        //console.log('labeled users: ', labeledUsers);
      }

      updateLabel(labeledUsers);
    }

    function updateLabel(labels){
      const labelRef = ref(db, currentUserRef + 'labels/');
      //console.log('labels: ', labels);
      set(labelRef, 
        {
          red: Array.from(labels.red),
          yellow: Array.from(labels.yellow),
          green: Array.from(labels.green),
        }
      ).then(() => {
          //console.log('Data written successfully!');
      }).catch((error) => {
          console.error('Error writing data: ', error);
          console.log('Data not written successfully!', error);
      });
    }

    function getLabels(){
      const labelRef = ref(db, currentUserRef + 'labels/');
      onValue(labelRef, (snapshot) => {
          //console.log('labels: ', snapshot.val());
          if(snapshot.val()){
              let data = snapshot.val();
              //console.log('labels from db: ', data);
              labeledUsers = {
                'red': new Set(data.red),
                'yellow': new Set(data.yellow),
                'green': new Set(data.green),
              };
          }else{
            updateLabel(labeledUsers);
          }
      });
    }




    let login = async () => {
        let user = userNameInput;
        let password = passwordInput;
        let response = await fetch('https://gnschat-9300.twil.io/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: user,
                password: password,
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            loginSuccess = true;
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

/*
    $: {
      if(usersType === 'all'){
        users = sortUsersByTimestamp(usersData);
      }else if(usersType === 'engaged'){
        users = engagedUsers;
      }
    }
    */

    let currentUserType = 'all';
    function handleUserType(type){
      currentUserType = type;
      if(type === 'all'){
        users = sortUsersByReceivedMessages(usersData);
      }else if(type === 'blocked'){
        users = blockedUsers;
      }
      users = users;
    }


</script>


<div class=content>
  {#if !loginSuccess}
    <div class=container id=login>
        <p class=login-title>Enter your username and password</p>
        <input type="text" bind:value={userNameInput} placeholder="username">
        <input type="password" on:keydown={handleLogin} bind:value={passwordInput} placeholder="password">
        <button class=login on:click={()=>handleLogin('click')}>Log In</button>
        {#if loginStatus === 'invalid login'}
          <p style='text-align: center; margin-top: 30px;'>Invalid login</p>
        {/if}
    </div>


  {:else if usersData}
    <div class=container id=users>
        <div class=title-bar>
            <button class=edit id={messageState==='chat'?'selected':''} on:click={()=>handleChat()}>messages</button>
            <button class=edit id={messageState==='mass'?'selected':''} on:click={()=>handleMass()}>create mass text</button>
        </div>
        <input type="text" bind:value={searchValue} placeholder="search name, phone, or messages">
        <!--
        <div class=usersType>
            <button class=edit id={usersType==='all'?'selected':''} on:click={()=>usersType = 'all'}>all</button>
            <button class=edit id={usersType==='engaged'?'selected':''} on:click={()=>usersType = 'engaged'}>engaged</button>
        </div>
        -->
        {#if users.size === 0}
            <p>No users</p>
        {:else}
            {#each Array.from(users).slice(0, numUsers) as user}
              {#if !blockedUsers.has(user) || (currentUserType === 'blocked' && blockedUsers.has(user))}
                <button class=userBtn id={selectedUser===user?'selected':''} on:click={()=>handleUser(user)}>
                    {#if usersData[user].messagesReceived}
                      {#if usersData[user].messagesReceived === 1}
                        <div class=unread></div>
                      {/if}
                    {/if}
                    <span class=buttontext>
                      {#if usersData[user].info}
                        {(usersData[user].info.name==='Default'?user:usersData[user].info.name) + ' - ' + usersData[user].data.lastMessage}
                      {/if}
                    </span>
                    {#if labeledUsers.red.has(user)}
                      <div class=red></div>
                    {/if}
                    {#if labeledUsers.yellow.has(user)}
                      <div class=yellow></div>
                    {/if}
                    {#if labeledUsers.green.has(user)}
                      <div class=green></div>
                    {/if}
                </button>
              {/if}
            {/each}
            <button on:click={()=>numUsers = numUsers + 10}>show more</button>
        {/if}
    </div>

    {#if messageState === 'chat'}
        <div class=container id=chat>
            <h3>messages{selectedUser !==  '' ? ' - ' + selectedUser: ''}
                {#if editUserName === true}
                    <input type="text" id=username bind:value={userName}>
                    <button class=edit on:click={()=>changeUserName()}>submit</button>
                    <button class=edit on:click={()=>cancelEdit()}>cancel</button>
                {:else}
                    {#if selectedUser !== ''}
                        {' - ' + userName}
                        <button class=edit on:click={()=>editUserName = true}>edit</button>
                    {/if}
                {/if}
                {#if blockedUsers.has(selectedUser)}
                    <button class=edit on:click={()=>unblockUser()}>unblock</button>
                {:else}
                    <button class=edit on:click={()=>blockUser()}>block</button>
                {/if}

            </h3>
            <h3>Labels: 
                {#each Object.keys(labeledUsers) as label}
                  <button class=edit id={labeledUsers[label].has(selectedUser)?'selected':''} on:click={()=>labelUser(selectedUser, label)}>{label}</button>
                {/each}
            </h3>
            <!-- add a line below here -->
            <div class=horizontal-line></div>

            <div class=message-content>
                {#if blockedUsers.has(selectedUser)}
                    <h3 class=warning>Unblock to view messages</h3>
                {:else if currentMessages}
                    {#each Object.keys(currentMessages).reverse() as message}
                        <div class=message-wrapper>
                            <p class=message id={currentMessages[message].type}>{currentMessages[message].message}</p>
                            <p class=timestamp id={currentMessages[message].type}>{convertTimeStamp(message)}</p>
                        </div>
                    {/each}
                {:else}
                    <p>No messages</p>
                {/if}

            </div>

            <!-- <button on:click={()=>writeDummyData()}>spam</button> -->
            <div class=input-wrapper>
                <input type="text" on:keydown={submit} class=userInput bind:value={inputMessage}>
                <button class=btn on:click={()=>handleSend()}>→</button>
            </div>

        </div>
    {:else if messageState === 'mass'}
        <div class=container id=mass>
            <h3>mass text</h3>
            <div class=file-input-wrapper>
              <input type="file" id=file-input bind:files bind:this={fileElement} on:change={handleChange}>
            </div>
            <div class=mass-info-wrapper>
              <button id=clear on:click={()=>clearMassData()}>clear</button>
              <h4>Number of contacts: {massData.length}</h4>
              <h4>Duplicate phone numbers: {duplicatePhoneNumbers.length}</h4>
            </div>
            <div class=names-container>
                {#each massData as data, index}
                    <span class=name>{data.name} - {data.phone}
                        <button id=remove on:click={()=>handleRemove(index)}>remove</button>
                     </span>
                {/each}
            </div>
            <textarea bind:value={massMessage} rows=5 placeholder="Enter your message" name="message" id="mass-text"></textarea>
            {#if enableMass}
                <button on:click={()=>getMoney()} id=MONEY>Send Message</button>
            {:else}
                <button id=MONEY disabled>Sending {currentMessageIndex} / {totalMessages}</button>
            {/if}
        </div>
    {:else}
        <div class=container id=mass>
            <h3>select a user or create a mass text</h3>
        </div>
    {/if}

  {:else}
    <p>Loading...</p>
  {/if}

  <br>

</div>
{#if loginSuccess}
  <div class=container id=userType>
    <button class=user-btn id={currentUserType==='all'?'selected':''}  on:click={()=>handleUserType('all')}>all</button>
    <button class=user-btn id={currentUserType==='blocked'?'selected':''} on:click={()=>handleUserType('blocked')}>blocked</button>
  </div>
{/if}

<!-- create confirmation overlay for mass text -->

<!-- <div class=confirm id={confirmMessage===true?'confirmMessage':''}>
</div> -->



<style>
    .horizontal-line {
        width: 100%;
        height: 1px;
        background-color: #C3CEDA;
        margin: 10px 0px;
    }

    .red {
        width: 10px;
        height: 10px;
        background-color: red;
        border-radius: 50%;
        margin-right: 10px;
    }

    .yellow {
        width: 10px;
        height: 10px;
        background-color: yellow;
        border-radius: 50%;
        margin-right: 10px;
    }

    .green {
        width: 10px;
        height: 10px;
        background-color: green;
        border-radius: 50%;
        margin-right: 10px;
    }

    .user-btn {
        text-align: center;
        padding: 5px;
        min-width: 50px;
        line-height: 0px;
    }

    #selected.user-btn {
        background-color: rgba(0, 0, 0, 0.5);
        color: azure;
    }

    .usersType {
      display:flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .userBtn {
      display:flex;
      flex-direction: row;
      align-items: center;
    }


    .unread {
        width: 10px;
        height: 10px;
        background-color: #04A3EE;
        border-radius: 50%;
        margin-right: 10px;
    }

    .login-title {
        text-align: center;
    }

    h3.login {
        text-align: center;
    }

    button.login {
        width: 100%;
        max-width: 100%;
        min-width: 100%;
        text-align: center;
        border: 1px solid #C3CEDA;
    }

    input:focus {
        outline: none;
    }

    input {
        padding: 10px;
        border-radius: 5px;
        border: 1px solid #C3CEDA;
        width: 100%;
        max-width: 100%;
        min-width: 100%;
    }



    .mass-info-wrapper {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }

    .confirm {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1;
    }

    .message-wrapper {
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }



    #clear {
        text-align: center;
        position: relative;
        top: 0;
        left: 0;
        max-width: 30%;
        width: 30%;
        min-width: 30%;
    }

    .buttontext {
        width: 100%;
        overflow: hidden;
        white-space: nowrap;
        font-size: 1rem;
        display: block;
        text-overflow: ellipsis;
    }

    #mass-text {
        width: 100%;
        height: 300px;
        padding: .5rem;
        border-radius: 1rem;
        border: 1px solid #C3CEDA;
    }

    .message {
        border-radius: 1rem;
        background-color: none;
        background: none;
        padding: 10px 20px;
        border-radius: 5px;
        max-width: 50%;
        min-width: 50px;
        margin-bottom: 0px;
        border: none;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        text-align: left;
    }

    #sent {
        background-color: #07a3ee;
        color: azure;
        margin-left: auto;
    }

    #received {
        background-color: #5b758f;
        color: azure;
        margin-right: auto;
    }

    .name {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        font-size: .9rem;
        gap: .5rem;
    }

    #MONEY {
        background-color: #07a3ee;
        color: azure;
        padding: 10px 20px;
        border-radius: 5px;
        border: none;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        text-align: center;
    }

    #remove {
        min-width: 50px;
        text-align: center;
        max-width: 20%;
        float: right;
    }

    .names-container {
        display: flex;
        flex-direction: column;
        overflow-y: scroll;
        max-height: 50%;
        min-height: 50%;
        width: 100%;
        gap: .5rem;
    }

    #file-input {
        display: flex;
        justify-content: space-around;
        text-align: center;
        align-items: center;
        border: none;
        padding: 0; 
    }

    .file-input-wrapper {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        height: 40px;
        width: 95%;
        gap: 1rem;
    }

    .title-bar {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    .content {
        padding: .5rem;
        min-width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        height: 100%;
        gap: .5rem;
        overflow: scroll;
    }

    input:placeholder-shown {
        display: hidden;
    }

    .btn {
        width: 20px;
        max-width: 40px;
        width: 40px;
        min-width: 0px;
        height: 30px;
        text-align: center;
        padding: 5px;
        line-height: 0px;
    }

    #username {
        width: 30%;
        max-width: 30%;
    }

    .input-wrapper {
        display: flex;
        flex-direction: row;
        gap: .5rem;
    }

    /* let mistyblue = "#C3CEDA";
    let bluegrey = '#738FA7';
    let midnightblue = '#0C4160';
    let darkblue = '#071330'; */

    h3 {
        text-transform: capitalize;
    }

    button:first-letter {
        text-transform: capitalize;
    }

    button {
        padding: 10px 20px;
        font-size: 16px;
        text-align: left;
        text-decoration: none;
        border-radius: 5px;
        background: none;
        min-width: 100%;
        /* background: linear-gradient(#5fcbfb,#07a3ee); */
        /* box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.3); */
        box-shadow: none;
        overflow: hidden;
        min-height: 40px;
        max-height: 40px;
        text-wrap: nowrap;
        color: azure;
        border: none;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    button:hover {
        /* box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.3); */
        background-color: rgba(0, 0, 0, 0.5);
    }


    #selected {
        background-color: #071330;
        background-color: rgba(0, 0, 0, 0.5);
    }

    .container {
        min-height: 80vh;
        height: 80vh;
        /*background-color: #0C4160;*/
        background-color: #3F3622;
        border-radius: 1rem;
        overflow: scroll;
        padding: 1rem;
    }

    #userType.container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        min-height: 10vh;
        max-height: 50px;
        gap: 1rem;
        width: 100%;
    }

    .timestamp {
        font-size: .8rem;
        color: #5b758f;
        margin: 0;
    }

    #sent.timestamp {
        color: grey;
        background-color: rgba(0, 0, 0, 0);
    }

    #received.timestamp {
        color: grey;
        background-color: rgba(0, 0, 0, 0);
    }


    .message-content {
        display: flex;
        flex-direction: column-reverse;
        justify-content: flex-start;
        gap: 1rem;
        padding: 1rem;
        overflow: scroll;
        /* max-height: 60vh;
        min-height: 60vh; */
    }

    #users.container {
        min-width: 30%;
        display: flex;
        flex-direction: column;
        gap: .3rem;
        overflow: scroll;
    }

    #login.container {
      min-width: 30%;
      display: flex;
      flex-direction: column;
      gap: .3rem;

    }



    #chat.container {
        min-width: 70%;
        display: flex;
        overflow: none;
        flex-direction: column;
        justify-content: space-between;
    }

    #mass.container {
        min-width: 70%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: .5rem;
        align-items: center;
    }

    .userInput {
        margin-top: auto;
        background: none;
        background-color: none;
        border: none;
        color: azure;
        font-weight: bold;
        overflow-x: hidden;
        text-wrap: wrap;
        min-width: 0;
    }

    .userInput:focus {
        outline: none;
    }

    .input-wrapper {
        display: flex;
        padding: .5rem;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        border-radius: 1rem;
        border: 1px solid #C3CEDA;
        width: 100%;
    }

    .edit {
        min-width: 50px;
        text-align: center;
    }

    @media only screen and (max-width: 778px) {
        .content {
            flex-direction: column;
        }

        #users.container {
            width: 100%;
        }

        #chat.container {
            width: 100%;
            max-height: none;
            min-height: none;
            overflow: hidden;
        }
    }

    .warning {
      margin: auto;
    }

</style>
