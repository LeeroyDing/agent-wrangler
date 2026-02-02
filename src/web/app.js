let currentAgentId = null;
let eventSource = null;

async function fetchAgents() {
    const res = await fetch('/api/agents');
    return res.json();
}

async function createAgent(data) {
    const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create agent');
    return res.json();
}

async function sendStdin(id, input) {
    const res = await fetch(`/api/agents/${id}/stdin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
    });
    if (!res.ok) throw new Error('Failed to send input');
}

function renderAgentList(agents) {
    const list = document.getElementById('agent-list');
    list.innerHTML = '';
    agents.forEach(agent => {
        const li = document.createElement('li');
        li.className = 'agent-item';
        
        const indicator = document.createElement('span');
        indicator.className = `status-indicator status-${agent.status}`;
        indicator.id = `indicator-${agent.id}`;
        
        const name = document.createElement('span');
        name.textContent = agent.name;
        
        li.appendChild(indicator);
        li.appendChild(name);
        li.onclick = () => selectAgent(agent);
        list.appendChild(li);
    });
}

function selectAgent(agent) {
    currentAgentId = agent.id;
    document.getElementById('new-agent-form').style.display = 'none';
    document.getElementById('agent-detail').style.display = 'flex';
    document.getElementById('agent-name').textContent = agent.name;
    
    updateStatusUI(agent.status);
    
    const logsOutput = document.getElementById('logs-output');
    logsOutput.textContent = '';
    
    if (eventSource) eventSource.close();
    
    eventSource = new EventSource(`/stream/logs/${agent.id}`);
    
    eventSource.onmessage = (event) => {
        const log = JSON.parse(event.data);
        appendLog(log);
    };
    
    eventSource.addEventListener('status', (event) => {
        updateStatusUI(event.data);
        const indicator = document.getElementById(`indicator-${agent.id}`);
        if (indicator) indicator.className = `status-indicator status-${event.data}`;
    });

    eventSource.onerror = (err) => {
        console.error("SSE failed:", err);
        eventSource.close();
    };
}

function appendLog(log) {
    const logsOutput = document.getElementById('logs-output');
    const span = document.createElement('span');
    span.className = `log-${log.source}`;
    span.textContent = log.content + '\n';
    logsOutput.appendChild(span);
    
    const container = document.getElementById('logs-container');
    container.scrollTop = container.scrollHeight;
}

function updateStatusUI(status) {
    const statusEl = document.getElementById('agent-status');
    statusEl.className = `status-indicator status-${status}`;
    
    const input = document.getElementById('stdin-input');
    input.disabled = (status !== 'waiting_input');
}

async function handleSend() {
    const inputEl = document.getElementById('stdin-input');
    const input = inputEl.value;
    if (!input || !currentAgentId) return;

    try {
        await sendStdin(currentAgentId, input);
        inputEl.value = '';
    } catch (err) {
        alert(err.message);
    }
}

document.getElementById('btn-send').onclick = handleSend;
document.getElementById('stdin-input').onkeydown = (e) => {
    if (e.key === 'Enter') handleSend();
};

document.getElementById('btn-new-agent').onclick = showNewAgentForm;
document.getElementById('btn-cancel').onclick = () => {
    document.getElementById('new-agent-form').style.display = 'none';
};

function showNewAgentForm() {
    if (eventSource) eventSource.close();
    document.getElementById('agent-detail').style.display = 'none';
    document.getElementById('new-agent-form').style.display = 'block';
    
    const lastCommand = sessionStorage.getItem('last_command');
    if (lastCommand) {
        document.getElementById('command').value = lastCommand;
    }
}

document.getElementById('create-agent-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    sessionStorage.setItem('last_command', data.command);

    try {
        const agent = await createAgent(data);
        const agents = await fetchAgents();
        renderAgentList(agents);
        selectAgent(agent);
    } catch (err) {
        alert(err.message);
    }
};

(async () => {
    const agents = await fetchAgents();
    renderAgentList(agents);
})();
