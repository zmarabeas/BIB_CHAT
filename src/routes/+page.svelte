<script>
    import { FirebaseDB as db } from '$lib/firebase/firebase.js';
    import { getDatabase, orderByChild, off, increment, get, ref, set, update, child, onValue, onChildAdded } from "firebase/database";
    import { onMount, tick } from 'svelte';
    import papa from 'papaparse';
    import { testData, dummyMessageData } from './testData.js';



    /*


 - I’m typing to someone when someone 
msgs me it will go to the chat of the person who messaged me last 

 - And the message I was typing for the last person can 
get sent to the person who just messaged me

    */


    let userName = null;
    function writeUserData(phone, message, type='sent', name='Default') {
        const timestamp = Date.now();

        if(type !== 'sent' && type !== 'received') {
            console.error('Invalid message type');
            console.log('Message type must be either "sent" or "received"');
            return;
        }

        //todo: update with one data structure
        update(ref(db, 'messages/' + phone + '/messages'), {
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
        update(ref(db, 'users/' + phone + '/data/'), {
                lastMessage: message,
                timestamp: timestamp,
        }).then(() => {
            // console.log('Data written successfully!');
        }).catch((error) => {
            console.error('Error writing data: ', error);
            console.log('Data not written successfully!', error);
        });

        update(ref(db, 'users/' + phone), {
            ['info']: {
                name: name,
            }
        }).then(() => {
            // console.log('Data written successfully!');
        }).catch((error) => {
            console.error('Error writing data: ', error);
            console.log('Data not written successfully!', error);
        });

        update(ref(db, 'users/' + phone), {
            messagesSent: increment(type === 'sent' ? 1 : 0),
            messagesReceived: increment(type === 'received' ? 1 : 0),
        }).then(() => {
            // console.log('Data written successfully!');
        }).catch((error) => {
            console.error('Error writing data: ', error);
            console.log('Data not written successfully!', error);
        });


    }

    async function getUserData(phone) {
        const userRef = ref(db, 'messages/' + phone);
        onValue(userRef, (snapshot) => {
            data = snapshot.val();
            data = data;

            currentMessages = data.messages;
            // console.log('data', data);
        });
        await tick();
    }

    
    

    async function updateServerData(){
      //update the server data with the number of messages sent and received
      //for each user
      console.log('updating server data');
      let userRef = ref(db, 'messages/');
      onValue(userRef, (snapshot) => {
        let users = snapshot.val();
        Object.keys(users).forEach(phone => {
          let user = users[phone];
          let messages = user.messages;
          let sent = 0;
          let received = 0;
          Object.keys(messages).forEach(message => {
            if(messages[message].type === 'sent'){
              sent++;
            }else{
              received++;
            }
          });
          update(ref(db, 'users/' + phone), {
            messagesSent: sent,
            messagesReceived: received,
          }).then(() => {
            // console.log('Data written successfully!');
          }).catch((error) => {
            console.error('Error writing data: ', error);
            console.log('Data not written successfully!', error);
          });
        });
      }, {
        onlyOnce: true,
      });
    }


    let messageState = null;
    let data = {};
    let usersData = {};
    function getAllUserData() {
        const userRef = ref(db, 'users/');
        onValue(userRef, (snapshot) => {
            usersData = snapshot.val();
            usersData = usersData;
            users = sortUsersByTimestamp(usersData);
        }, {
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

    function cleanServerData(){
      //remove all users without data from the server
      let userRef = ref(db, 'users/');
      onValue(userRef, (snapshot) => {
        let users = snapshot.val();
        Object.keys(users).forEach(phone => {
          let user = users[phone];
          if(!user.data){
            set(ref(db, 'users/' + phone), null).then(() => {
              // console.log('Data written successfully!');
            }).catch((error) => {
              console.error('Error writing data: ', error);
              console.log('Data not written successfully!', error);
            });
          }
        });
      }, {
        onlyOnce: true,
      });

    }

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
        getAllUserData();
        // usersData = testData;
        // updateServerData();
        //cleanServerData();
    }); 


    function sortUsersByTimestamp(dat){
        let u = new Set();
        Object.keys(dat).forEach(phone => {
            u.add(phone);
        });
        u = u;
        //sort users by last message timestamp
        let ret = new Set([...users].sort((a, b) => {
            return (dat[b].data.timestamp || Infinity) - (dat[a].data.timestamp || Infinity);
        }));
        ret = ret;
        return ret;
    }


    $: {
        Object.keys(usersData).forEach(phone => {
            users.add(phone);
        });
        users = users;
        //sort users by last message timestamp
        users = new Set([...users].sort((a, b) => {
            return (usersData[b].data.timestamp || Infinity) - (usersData[a].data.timestamp || Infinity);
        }));
        users = users;

    }


    //TODO: Look into chat changing screens when a new message is received

    let selectedUserRef = null; 
    $: {
        if(selectedUser !== ''){
            selectedUserRef = ref(db, 'messages/' + selectedUser);
            onValue(selectedUserRef, (snapshot) => {
                data = snapshot.val();
                data = data;
            });

        }
    }

    let currentMessages = [];

    let selectedUser = '';
    async function handleUser(user){
        if(user === selectedUser) return;

        
        //remove previous listener
        if(selectedUserRef){
          off(selectedUserRef);
          selectedUserRef = null;
        }

        messageState = 'chat';
        selectedUser = user;
        getUserData(user);
        await tick();
        userName = usersData[user].info.name;
        currentMessages = data.messages;
        userName = userName;
        currentMessages = currentMessages;
        // currentMessages = data[user].messages;
    }

    let inputMessage = '';

    function sendTwilioMessage(message){
      //send message to twilio api https://gnschat-9300.twil.io/welcome
      const response = fetch('https://gnschat-9300.twil.io/welcome', {
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
        let message = {
          to: to,
          body: inputMessage,
        }
        // if(mass){
        //     massData.forEach(function(data){
        //         writeUserData(data.phone, inputMessage, 'sent', data.name);
        //     });
        //     clearMassData();
        // }

        handleUser(selectedUser);
        sendTwilioMessage(message);

        inputMessage = '';
    }

    function getFirstName(name){
        let formattedName = name.split(' ')[0];
        return formattedName;
    }

    function sendMassText(){
        if(massMessage.trim() === '') return;
        let formattedPhone;
        let formattedMessage;
        massData.forEach(function(data){
            formattedPhone = formatPhone(data.phone);
            formattedMessage = massMessage;
            writeUserData(data.phone, formattedMessage, 'sent', data.name);
            //regex for valid phone number
            if(!formattedPhone.match(/^\+1\d{10}$/)){
                console.error('Invalid phone number: ', formattedPhone);
                //console.log('Phone number must be in the format +1XXXXXXXXXX: ', formattedPhone);
                return;
            }else{
                sendTwilioMessage({
                    to: formatPhone(data.phone),
                    body: formattedMessage,
                })
            }
        });
        clearMassData();
    }

    let editUserName = false;

    let changeUserName = () => {
        editUserName = false;
        update(ref(db, 'users/' + selectedUser), {
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

    $: {
      console.log(users);
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
        files = null;
        fileElement.value = '';
    }


    let unsortedUsers = new Set();
    let engagedUsers = new Set();
    let unresponsiveUsers = new Set();

    function updateUsers(){
        unsortedUsers = new Set();
        engagedUsers = new Set();
        unresponsiveUsers = new Set();
        users = new Set();
        Object.keys(usersData).forEach(phone => {
            unsortedUsers.add(phone);
        });
        unsortedUsers = unsortedUsers;
        //sort users by last message timestamp
        users = new Set([...unsortedUsers].sort((a, b) => {
            return (usersData[b].data.timestamp || Infinity) - (usersData[a].data.timestamp || Infinity);
        }));
        users = users;
        tick();

        //add engaged users

        unresponsiveUsers = new Set();
        engagedUsers = new Set();
        users.forEach(phone => {
            if(usersData[phone].messagesReceived > 0){
                engagedUsers.add(phone);
            }else{
                unresponsiveUsers.add(phone);
            }
        });

        engagedUsers = engagedUsers;
        unresponsiveUsers = unresponsiveUsers;
    }

    $: {
    }

    setInterval(() => {
    }, 1000);

    let userType = 'all';

    $: {

    }

    let numUsers = 10;
    let searchValue = '';
    let users = new Set(); 

    $: {
      try{
        let search = searchValue.toLowerCase();
        if(search === ''){
            users = new Set(Object.keys(usersData));
            updateUsers();
            if(userType === 'all'){
                users = new Set(unsortedUsers);
            }else if(userType === 'engaged'){
                users = new Set(engagedUsers);
            }else if(userType === 'unresponsive'){
                users = new Set(unresponsiveUsers);
            }
            users = users;
        }else{
          updateUsers();
          users = new Set(Array.from(users).filter(user => {
            return usersData[user].info.name.toLowerCase().includes(search) 
            || usersData[user].data.lastMessage.toLowerCase().includes(search)
            || user.includes(search);
          }));
          if(userType === 'all'){
              users = new Set(unsortedUsers);
          }else if(userType === 'engaged'){
              users = new Set(engagedUsers);
          }else if(userType === 'unresponsive'){
              users = new Set(unresponsiveUsers);
          }
          users = users;
        }
      }catch(e){
        console.error(e);
      }
    }

</script>


<div class=content>
    <div class=container id=users>
        <div class=title-bar>
            <button class=edit id={messageState==='chat'?'selected':''} on:click={()=>handleChat()}>messages</button>
            <button class=edit id={messageState==='mass'?'selected':''} on:click={()=>handleMass()}>create mass text</button>
        </div>
        <h4>users</h4>
        <div class=title-bar>
            <button class=edit id={userType==='all'?'selected':''} on:click={()=>userType = 'all'}>all</button>
             <button class=edit id={userType==='engaged'?'selected':''} on:click={()=>userType = 'engaged'}>engaged</button>   
             <button class=edit id={userType==='unresponsive'?'selected':''} on:click={()=>userType = 'unresponsive'}>unresponsive</button>  
        </div>
        <input type="text" bind:value={searchValue} placeholder="search name, phone, or messages">
        {#if users.size === 0}
            <p>No users</p>
        {:else}
            {#each Array.from(users).slice(0, numUsers) as user}
                <button id={selectedUser===user?'selected':''} on:click={()=>handleUser(user)}>
                    <span class=buttontext>
                        {(usersData[user].info.name==='Default'?user:usersData[user].info.name) + ' - ' + usersData[user].data.lastMessage}
                    </span>
                </button>
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
            </h3>

            <div class=message-content>
                {#if currentMessages}
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
            <input type="file" id=file-input bind:files bind:this={fileElement} on:change={handleChange}>
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
            <button on:click={()=>getMoney()} id=MONEY>Send Message</button>
        </div>
    {:else}
        <div class=container id=mass>
            <h3>select a user or create a mass text</h3>
        </div>
    {/if}

</div>

<!-- create confirmation overlay for mass text -->

<!-- <div class=confirm id={confirmMessage===true?'confirmMessage':''}>
</div> -->



<style>

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
        flex-direction: row;
        justify-content: center;
        text-align: center;
        align-items: center;
        min-height: 20px;
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
        background-color: rgba(0, 0, 0, 0.2);
    }


    #selected {
        background-color: #071330;
        background-color: rgba(0, 0, 0, 0.3);
    }

    .container {
        min-height: 80vh;
        height: 80vh;
        max-height: 80vh;
        background-color: #0C4160;
        border-radius: 1rem;
        overflow: scroll;
        padding: 1rem;
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
        min-height: 80%;
        max-height: 80%;
        /* max-height: 60vh;
        min-height: 60vh; */
    }

    #users.container {
        min-width: 33%;
        display: flex;
        flex-direction: column;
        gap: .3rem;
        overflow: scroll;
    }



    #chat.container {
        min-width: 66%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    #mass.container {
        min-width: 66%;
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
            min-width: 100%;
        }

        #chat.container {
            min-width: 100%;
        }
    }


</style>
