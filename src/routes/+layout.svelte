<script>
    let mistyblue = "#C3CEDA";
    let bluegrey = '#738FA7';
    let midnightblue = '#0C4160';
    let darkblue = '#071330';

    let headerColor = darkblue;
    let footerColor = darkblue;

    let contentColor = bluegrey;
    let textColor = mistyblue;

</script>

<div class=header style='background-color: {headerColor}; color: {textColor}'>
    <h2>BIB Chat</h2>
</div>
<div class=content style='background-color: {contentColor}'>
    <slot></slot>
</div>

<div class=footer style='background-color: {footerColor}; color: {textColor}'>
    <h4>BIB Chat™️</h4>
</div>

<style>
    @import "$lib/css/global-dark.css";

    .header {
        color: var(--color-on-primary);
        padding: 2rem;
    }

    .content {
        /* padding: 1rem; */
        min-height: 70vh;
        min-width: 100vw;
        max-width: 100vw;
    }

    .footer {
        padding: 2rem;
    }

</style>