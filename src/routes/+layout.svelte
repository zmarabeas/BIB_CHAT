<script>
    let mistyblue = "#C3CEDA";
    let bluegrey = '#738FA7';
    let midnightblue = '#0C4160';
    let darkblue = '#071330';

    let textBlastColor = '#FBFDE9';
    let textBlastDarkColor = '#767568';
    let textBlastTextColor = '#2A2B2A';

    let headerColor = textBlastColor;
    let footerColor = textBlastColor;

    let contentColor = textBlastDarkColor;
    let textColor = mistyblue;

    import { user as currentLoggedInUser } from '$lib/stores/stores.js';

    let currentUser = null;

    currentLoggedInUser.subscribe(value => {
        currentUser = value;
        console.log('CURRENT USER LOGGED IN', currentUser);
    });

    function capitalizeFirstLetter(string) {
      if (string === null || string === undefined) {
        return '';
      }
      if (string.length === 0) {
        return '';
      }

      if (string.length === 1) {
        return string.toUpperCase();
      }

      if (string.length > 1) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }

      return '';
    }

    let head = null;
    const scrollIntoView = (element) => {
        element.scrollIntoView({ behavior: 'smooth' });
    }

</script>

<div class=header bind:this={head} style='background-color: {headerColor}; color: {textBlastTextColor}'>
    <img src="TEXT_BLAST_CROPPED.png" alt="BIB Chat" width="130" height="130">
    {#if currentUser !== null && currentUser !== undefined}
        <h2>Welcome, {capitalizeFirstLetter(currentUser.name)}</h2>
    {:else}
        <h2>Welcome, Please Login to Continue!</h2>
    {/if}
    <!-- <h2>BIB Chat</h2> -->
</div>
<div class=content style='background-color: {contentColor}'>
    <slot></slot>
</div>

<div class=footer style='background-color: {footerColor}; color: {textColor}'>
    <img src="TEXT_BLAST.png" alt="BIB Chat" width="100" height="100">
    <!-- <h4>BIB Chat™️</h4> -->
    <button class=top on:click={() =>  scrollIntoView(head)}>back to top</button>
</div>

<style>
    @import "$lib/css/global-dark.css";

    .top {
        background-color: #2A2B2A;
        float: right;
        color: #FBFDE9;
        padding: .5rem;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        max-width: 100px;
    }

    .header {
        color: var(--color-on-primary);
        padding: .5rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        color: #2A2B2A;
    }

    .content {
        /* padding: 1rem; */
        min-height: 70vh;
        min-width: 100vw;
        max-width: 100vw;
    }

    h2 {
        margin-left: 3rem;
    }

    .footer {
        padding: .5rem;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

</style>
