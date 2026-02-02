const API_BASE = '/api/agents';

async function fetchAgents() {
    const res = await fetch(API_BASE);
    return res.json();
}

async function createAgent(data) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create agent');
    return res.json();
}

function renderAgentList(agents) {
    const list = document.getElementById('agent-list');
    list.innerHTML = '';
    agents.forEach(agent => {
        const li = document.createElement('li');
        li.textContent = agent.name;
        li.onclick = () => selectAgent(agent);
        list.appendChild(li);
    });
}

function selectAgent(agent) {
    document.getElementById('new-agent-form').style.display = 'none';
    document.getElementById('agent-detail').style.display = 'block';
    document.getElementById('agent-name').textContent = agent.name;
    
    // Status handling will be refined in US2
    const statusEl = document.getElementById('agent-status');
    statusEl.className = `status-indicator status-${agent.status}`;
}

function showNewAgentForm() {
    document.getElementById('agent-detail').style.display = 'none';
    document.getElementById('new-agent-form').style.display = 'block';
}

document.getElementById('btn-new-agent').onclick = showNewAgentForm;
document.getElementById('btn-cancel').onclick = () => {
    document.getElementById('new-agent-form').style.display = 'none';
};

document.getElementById('create-agent-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        await createAgent(data);
        const agents = await fetchAgents();
        renderAgentList(agents);
        document.getElementById('new-agent-form').style.display = 'none';
    } catch (err) {
        alert(err.message);
    }
};

// Initial load
(async () => {
    const agents = await fetchAgents();
    renderAgentList(agents);
})();
