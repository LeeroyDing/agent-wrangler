export function initApp() {
    let currentAgentId = null;
    let eventSource = null;

    async function fetchAgents() {
        const res = await fetch('api/agents');
        return res.json();
    }

    async function createAgent(data) {
        const res = await fetch('api/agents', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' 
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to create agent: ${res.status} ${res.statusText} - ${errorText}`);
        }
        return res.json();
    }

    async function sendStdin(id, input) {
        const res = await fetch(`api/agents/${id}/stdin`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ input })
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to send input: ${res.status} ${res.statusText} - ${errorText}`);
        }
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
        
        // Fix 1: Update UI immediately with current status
        updateStatusUI(agent.status);
        
        const logsOutput = document.getElementById('logs-output');
        logsOutput.textContent = '';
        
        // Clear debug areas
        const dbgOut = document.getElementById('debug-stdout');
        if (dbgOut) dbgOut.value = '';
        const dbgErr = document.getElementById('debug-stderr');
        if (dbgErr) dbgErr.value = '';

        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
        
        // Re-fetch logs history if needed? The server streams *new* logs via SSE.
        // But we should probably fetch existing logs first if we want persistence.
        // For now, let's just rely on SSE for live updates.
        
        eventSource = new EventSource(`stream/logs/${agent.id}`);
        console.log(`[SSE] Connecting to stream/logs/${agent.id}`);
        
        eventSource.onopen = () => {
            console.log(`[SSE] Connection opened for agent ${agent.id}`);
        };

        eventSource.onmessage = (event) => {
            console.log('[SSE] Raw Message:', event.data); 
            try {
                const log = JSON.parse(event.data);
                appendLog(log);
            } catch (e) {
                console.error('[SSE] JSON Parse Error:', e);
            }
        };
        
        eventSource.addEventListener('status', (event) => {
            console.log(`[SSE] Status update: ${event.data}`);
            // Update the local agent object too so if we re-select it's correct
            agent.status = event.data;
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
        console.log('[Frontend] appendLog called', log.source, log.content.substring(0, 50));
        // Debug output always gets everything
        if (log.source === 'stdout') {
            const dbg = document.getElementById('debug-stdout');
            if (dbg) dbg.value += log.content + '\n';
        } else if (log.source === 'stderr') {
            const dbg = document.getElementById('debug-stderr');
            if (dbg) dbg.value += log.content + '\n';
        }

        // Filter main view: Don't show raw ACP protocol messages
        if (log.content.startsWith('[ACP-IN]') || log.content.startsWith('[ACP-OUT]')) {
            return;
        }

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
        if (statusEl) statusEl.className = `status-indicator status-${status}`;
        
        const input = document.getElementById('stdin-input');
        // Ensure input is enabled for 'running' state as well
        if (input) input.disabled = !['waiting_input', 'running'].includes(status);
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

    const btnSend = document.getElementById('btn-send');
    if (btnSend) btnSend.onclick = handleSend;
    
    const stdinInput = document.getElementById('stdin-input');
    if (stdinInput) stdinInput.onkeydown = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    const btnNewAgent = document.getElementById('btn-new-agent');
    if (btnNewAgent) btnNewAgent.onclick = showNewAgentForm;
    
    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) btnCancel.onclick = () => {
        document.getElementById('new-agent-form').style.display = 'none';
    };

    const cbDebug = document.getElementById('cb-debug-mode');
    if (cbDebug) cbDebug.onchange = (e) => {
        const container = document.getElementById('debug-container');
        if (container) container.style.display = e.target.checked ? 'flex' : 'none';
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

    const createForm = document.getElementById('create-agent-form');
    if (createForm) createForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        sessionStorage.setItem('last_command', data.command);

        try {
            const agent = await createAgent(data);
            const agents = await fetchAgents();
            renderAgentList(agents);
            // Select the newly created agent. It might be 'running' initially.
            // The server will transition it to 'waiting_input' soon.
            // Our SSE connection in selectAgent will handle the status update.
            selectAgent(agent);
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // Initial load
    (async () => {
        const agents = await fetchAgents();
        renderAgentList(agents);
    })();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
       initApp(); 
    });
}
