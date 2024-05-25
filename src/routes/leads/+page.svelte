<script>
  import { FirebaseDB as db } from '$lib/firebase/firebase.js';
  import { getDatabase, orderByChild,  ref, set, update, child, onValue, onChildAdded } from "firebase/database";
  import { onMount, tick } from 'svelte';

  let leads = [];

  onMount(async () => {
    await getLeads();
  });

  async function getLeads() {
    const leadsRef = ref(db, 'applications');
    onValue(leadsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        leads = data;
        leads = Object.keys(leads).map(key => {
          return {
            id: key,
            ...leads[key]
          }
        });
      }
    });
  }


  async function updateLeadStatus(lead, status) {
    const leadRef = ref(db, `applications/${lead.id}`);
    await update(leadRef, {
      status: status
    });
  }

  async function deleteLead(lead) {
    const leadRef = ref(db, `applications/${lead.id}`);
    await set(leadRef, null);
  }

  const statusIndex = {
    'new': 0,
    'contacted': 1,
    'closed': 2
  }
  function sortLeads(leads) {
    return leads.sort((a, b) => statusIndex[a.status] - statusIndex[b.status]);
  }

  //sort leads by new, contacted, closed

  $: {
    tick();
    leads = sortLeads(leads);
    console.log(leads);
  }


</script>

<h1>Leads</h1>

<div class=main>
  <div class=container>
    <div class=lead-info>
      <p>Name</p>
      <p>Phone</p>
      <p>Email</p>
      <p>Type</p>
      <p>Status</p>
    </div>

    {#each leads as lead}
      <div class=wrapper>
        <div class=lead-info>
          <p>{lead.name}</p>
          <p>{lead.phone || '-'}</p>
          <p>{lead.email || '-'}</p>
          <p>{lead.type}</p>
          <p>{lead.status}</p>
        </div>
        <div class=actions>
          <button on:click={() => updateLeadStatus(lead, 'contacted')}>Contacted</button>
          <button on:click={() => updateLeadStatus(lead, 'closed')}>Closed</button>
          <button on:click={() => deleteLead(lead)}>Delete</button> 
        </div>
      </div>
      <div class=divider></div>
    {/each}
  </div>
</div>

<style>
  .main{
    padding: 1rem;
  }

  .actions {
    display: flex;
    gap: 14rem;
  }

  .divider {
    height: 1px;
    background-color: #333;
    width: 100%;
  }

  .wrapper {
    display: flex;
    flex-direction: column;

    gap: 1rem;
  }


  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 1rem;
  }

  .lead-info {
    display: flex;
    gap: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #333;
    color: white;
    border: none;
    cursor: pointer;
  }

  button:hover {
    background-color: #555;
  }

  p {
    margin: 0;
    width: 200px;
  }
</style>
