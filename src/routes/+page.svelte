<script>
    import { FirebaseDB as db } from '$lib/firebase/firebase.js';
    import { getDatabase, ref, set, update, child, onValue, onChildAdded } from "firebase/database";
    import { onMount, tick } from 'svelte';


    let userName = null;
    function writeUserData(phone, message, type='sent') {
        const timestamp = Date.now();

        if(type !== 'sent' && type !== 'received') {
            console.error('Invalid message type');
            console.log('Message type must be either "sent" or "received"');
            return;
        }

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
        update(ref(db, 'users/'), {
            [phone]: {
                lastMessage: message,
                timestamp: timestamp,
                name: userName || 'Default',
            }
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
        });
        await tick();
    }

    let messageState = null;
    let data = {};
    let usersData = {};
    function getAllUserData() {
        const userRef = ref(db, 'users/');
        onValue(userRef, (snapshot) => {
            usersData = snapshot.val();
        }, {
            // onlyOnce:true
        });

        // const dbRef = ref(getDatabase());
        // get(child(dbRef, `users/${userId}`)).then((snapshot) => {
        // if (snapshot.exists()) {
        //     console.log(snapshot.val());
        // } else {
        //     console.log("No data available");
        // }
        // }).catch((error) => {
        //     console.error(error);
        // });
    }

    let dummyMessageData = [
        {
            phone: '1234567890',
            message: 'bananas',
        },
        {
            phone: '1234567890',
            message: 'apples',
        },
        {
            phone: '1234567890',
            message: 'oranges',
        },
        {
            phone: '1234567290',
            message: 'Hello World!',
        },
        {
            phone: '1234563890',
            message: 'Hello World!',
        },
        {
            phone: '1232567890',
            message: 'Hello World!',
        },
        {
            phone: '1224567890',
            message: 'Hello World!',
        },
        {
            phone: '1234567890',
            message: 'Hello World!',
        },
        {
            phone: '1234567890',
            message: 'Hello World!',
        },
        {
            phone: '1234567890',
            message: 'Hello World!',
        },
        {
            phone: '1234564890',
            message: 'Hello World!',
        },
        {
            phone: '1234567890',
            message: 'Hello World!',
        },
        {
            phone: '1234567890',
            message: 'Hello World!',
        },
        {
            phone: '1234565890',
            message: 'Hello World!',
        },
        {
            phone: '1234567890',
            message: 'Hello World!',
        },
        {
            phone: '1234567890',
            message: 'Hello World!',
        },
        {
            phone: '1234567890',
            message: 'Hello World!',
        },
        {
            phone: '0987654321',
            message: 'Goodbye World!',
        },
    ]

    function writeDummyData() {
        dummyMessageData.forEach(function(data, index) {
            setTimeout(function(){
                writeUserData(data.phone, data.message);
            }, 1000 * (index + 1));
        });
        console.log('All data written!');
    }
    // writeDummyData();   


    let dat;
    onMount(() => {
        // dat = getAllUserData();
        // console.log(dat);
        getAllUserData();

    }); 

    // writeDummyData();

    let users = new Set();
    $: {
        Object.keys(usersData).forEach(phone => {
            users.add(phone);
            users = users;
        });
    }

    $: {
        // console.log('user', selectedUser);
        // console.log('current', currentMessages);
        // console.log('server', data);
    }

    let currentMessages = [];

    let selectedUser = '';
    async function handleUser(user){
        if(user === selectedUser) return;

        messageState = 'chat';
        selectedUser = user;
        getUserData(user);
        await tick();
        userName = usersData[user].name;
        currentMessages = data.messages;
        userName = userName;
        currentMessages = currentMessages;
        // currentMessages = data[user].messages;
    }

    let inputMessage = '';

    function handleSend(){
        writeUserData(selectedUser, inputMessage);
        handleUser(selectedUser);
        // getUserData(selectedUser);
        inputMessage = '';
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
        userName = usersData[selectedUser].name;
    }

    function handleMass(){
        if(messageState === 'mass'){
            messageState = null;
            return;
        }else if(messageState === 'chat'){
            selectedUser = '';
            messageState = 'mass';
        }else{
            messageState = 'mass';
        }
    }


</script>


<div class=content>
    <div class=container id=users>
        <div class=title-bar>
            <h3>users</h3>
            <button class=edit id={messageState==='mass'?'selected':''} on:click={()=>handleMass()}>create mass text</button>
        </div>
        {#if users.size === 0}
            <p>No users</p>
        {:else}
            {#each Array.from(users) as user}
                <button id={selectedUser===user?'selected':''} on:click={()=>handleUser(user)}>
                    {(usersData[user].name==='Default'?user:usersData[user].name) + ' - ' + usersData[user].lastMessage}
                </button>
            {/each}
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
                        <p class=message id={currentMessages[message].type}>{currentMessages[message].message}</p>
                    {/each}
                {:else}
                    <p>No messages</p>
                {/if}

            </div>

            <!-- <button on:click={()=>writeDummyData()}>spam</button> -->
            <div class=input-wrapper>
                <input type="text" class=userInput bind:value={inputMessage}>
                <button class=btn on:click={()=>handleSend()}>→</button>
            </div>

        </div>
    {:else if messageState === 'mass'}
        <div class=container id=mass>
            <h3>mass text</h3>
            <input type="file">
        </div>
    {:else}
        <div class=container id=mass>
            <h3>select a user or create a mass text</h3>
        </div>
    {/if}

</div>



<style>
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
        overflow-x: hidden;
        box-shadow: none;
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

    .message {
        border-radius: 1rem;
        padding: 0;
        background-color: none;
        background: none;
        max-width: 80%;
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
        min-width: 30%;
        display: flex;
        flex-direction: column;
        gap: .3rem;
        overflow: scroll;
    }



    #chat.container {
        min-width: 70%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    #mass.container {
        min-width: 70%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
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