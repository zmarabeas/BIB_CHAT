<script>
    import { FirebaseDB as db } from '$lib/firebase/firebase.js';
    import { getDatabase, ref, set, update, child, onValue } from "firebase/database";
    import { onMount } from 'svelte';

    console.log(db);

    function writeUserData(phone, message, type='sent') {
        const timestamp = Date.now();

        if(type !== 'sent' && type !== 'received') {
            console.error('Invalid message type');
            console.log('Message type must be either "sent" or "received"');
            return;
        }

        update(ref(db, 'users/' + phone + '/messages'), {
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
    }

    function getUserData(phone) {
        const db = getDatabase();

        return data;
    }

    let data = {};
    function getAllUserData() {
        const userRef = ref(db, 'users/');
        onValue(userRef, (snapshot) => {
            data = snapshot.val();
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
        console.log(data);

    }); 

    // writeDummyData();

    let users = new Set();
    $: {
        console.log(data);
        Object.keys(data).forEach(phone => {
            users.add(phone);
            users = users;
        });
        console.log(users);
    }
</script>


<div class=content>
    <div class=container id=users>
        <h3>users</h3>
        {#if users.size === 0}
            <p>No users</p>
        {:else}
            {#each Array.from(users) as user}
                <p>{user}</p>
            {/each}
        {/if}
    </div>
    <div class=container id=chat>
        <h3>messages</h3>
        <button on:click={()=>writeDummyData()}>spam</button>

    </div>
</div>



<style>
    .content {
        padding: .5rem;
        min-width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        height: 100%;
        gap: .5rem;
    }

    /* let mistyblue = "#C3CEDA";
    let bluegrey = '#738FA7';
    let midnightblue = '#0C4160';
    let darkblue = '#071330'; */

    h3 {
        text-transform: capitalize;
    }

    .container {
        min-height: 80vh;
        background-color: #0C4160;
        border-radius: 1rem;
        padding: 1rem;
    }

    #users.container {
        min-width: 30%;
    }

    #chat.container {
        min-width: 70%;
    }


</style>