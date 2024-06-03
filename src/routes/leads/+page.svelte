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

  let selectedLead = null;

  $: {
    console.log(selectedLead);
  }

  function getQuestionInfo(question) {
    let ret = '';
    if (typeof question === 'object') {
      Object.keys(question).forEach(key => {
        if (question[key] !== '') {
          ret += `${key}: ${question[key]}\n`;
        }
      });
    } else {
      ret = question;
    }
    if (ret === '') {
      ret = null;
    }
    return ret;
  }

</script>

<h1>Leads</h1>

<div class=main>
  <div class=container>

    {#if leads.length === 0}
      <p>No leads found</p>
    {:else if selectedLead !== null}
      <div class=wrapper>
        <button  class=back on:click={() => selectedLead = null}>Back</button>
        <div class=title-info>
          <h2>Name: {selectedLead.name}</h2>
          <h2>Phone: {selectedLead.phone || '-'}</h2>
          <h2>Email: {selectedLead.email || '-'}</h2>
          <h2>Type: {selectedLead.type}</h2>
          <h2>Status: {selectedLead.status}</h2>
        </div>
         <div class=divider></div>
        <h2>Question information</h2>
        {#each Object.keys(selectedLead.questions) as question}
          {#if typeof(selectedLead.questions[question]) === 'object'}
            {#if getQuestionInfo(selectedLead.questions[question]) !== null}
                <p id=question>{question}</p>
                {#each Object.keys(selectedLead.questions[question]) as subQuestion}
                    {#if getQuestionInfo(selectedLead.questions[question]) !== null}
                      <div class=lead-info>
                        <p>{subQuestion}:</p>
                        <p>{selectedLead.questions[question][subQuestion]}</p>
                      </div>
                    {/if}
                {/each}
                <div class=divider></div>
              {/if}
            {:else}
              {#if selectedLead.questions[question] !== ''}
                <div class=lead-info>
                  <p id=question>{question}</p>
                  <p>{selectedLead.questions[question]}</p>
                </div>
                <div class=divider></div>
            {/if}
          {/if}
        {/each}
        <div class=actions>
          <button on:click={() => updateLeadStatus(selectedLead, 'contacted')}>Contacted</button>
          <button on:click={() => updateLeadStatus(selectedLead, 'closed')}>Closed</button>
          <button on:click={() => deleteLead(selectedLead)}>Delete</button> 
        </div>
      </div>
    {:else}
      {#each leads as lead}
        <div class=lead-info>
          <p>Name</p>
          <p>Phone</p>
          <p>Email</p>
          <p>Type</p>
          <p>Status</p>
        </div>
        <div class=wrapper>
          <div class=lead-info>
            <p>{lead.name}</p>
            <p>{lead.phone || '-'}</p>
            <p>{lead.email || '-'}</p>
            <p>{lead.type}</p>
            <p>{lead.status}</p>
          </div>
          <div class=actions>
            <button on:click={() => selectedLead = lead}>View</button>
            <button on:click={() => updateLeadStatus(lead, 'contacted')}>Contacted</button>
            <button on:click={() => updateLeadStatus(lead, 'closed')}>Closed</button>
            <button on:click={() => deleteLead(lead)}>Delete</button> 
          </div>
        </div>
        <div class=divider></div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .main{
    padding: 1rem;
  }

  .back {
    align-self: flex-start;
  }

  h1 {
    margin: 1rem;
    margin-top: 1rem;
  }

  #question {
    font-weight: bold;
  }

  .actions {
    display: flex;
    gap: 1rem;
  }

  .divider {
    height: 2px;
    background-color: rgba(7,20,48, 0.3);
    border-radius: 1px;
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

  .title-info{
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #071430;
    color: white;
    border: none;
    cursor: pointer;
  }

  button:hover {
  }

  p {
    margin: 0;
    width: 200px;
  }
</style>
