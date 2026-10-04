const drones = [
    { id: 'OR-01', status: 'Idle', battery: 94, location: 'Bay Alpha', eta: 'N/A' },
    { id: 'OR-02', status: 'Patrolling', battery: 78, location: 'Coastal Sector 3', eta: '12 min' },
    { id: 'OR-03', status: 'Responding', battery: 62, location: 'Distress signal', eta: '4 min' },
];

const droneList = document.getElementById('droneList');
const alertArea = document.getElementById('alertArea');
const missionStatus = document.getElementById('missionStatus');
const lastUpdate = document.getElementById('lastUpdate');
const launchDroneBtn = document.getElementById('launchDroneBtn');
const resetBtn = document.getElementById('resetBtn');
const emergencyBtn = document.getElementById('emergencyBtn');

let currentTime = new Date();
let alertTimeout;

function updateTime() {
    currentTime = new Date();
    lastUpdate.textContent = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function renderDrones() {
    droneList.innerHTML = '';
    drones.forEach(drone => {
        const li = document.createElement('li');
        const colorClass = drone.status === 'Responding' ? 'status-danger' : drone.status === 'Idle' ? 'status-warning' : 'status-safe';

        li.innerHTML = `
            <span class="status-dot" style="background:${drone.status === 'Responding' ? '#ff5f6d' : drone.status === 'Idle' ? '#ffb86c' : '#2bf2a8'}"></span>
            <div>
                <strong>${drone.id}</strong>
                <p>${drone.location}</p>
            </div>
            <div class="status ${colorClass}">${drone.status}</div>
            <div class="battery">${drone.battery}%</div>
        `;
        droneList.appendChild(li);
    });
}

function setAlert(message, type = 'normal') {
    const alertClass = type === 'danger' ? 'status-danger' : type === 'warning' ? 'status-warning' : 'status-safe';
    alertArea.innerHTML = `
        <div class="alert-box ${alertClass}">
            <strong>${message}</strong>
        </div>
    `;
}

function simulateMissionUpdate() {
    const nextStatuses = [
        { idx: 0, status: 'Patrolling', battery: 82, location: 'Offshore Sector 1', eta: 'N/A' },
        { idx: 1, status: 'Responding', battery: 59, location: 'Distress signal', eta: '6 min' },
        { idx: 2, status: 'Patrolling', battery: 88, location: 'Bay Alpha', eta: 'N/A' },
    ];

    nextStatuses.forEach(update => {
        drones[update.idx].status = update.status;
        drones[update.idx].battery = update.battery;
        drones[update.idx].location = update.location;
        drones[update.idx].eta = update.eta;
    });

    missionStatus.textContent = 'Active';
    missionStatus.className = 'status status-danger';
    setAlert('Rescue mission underway: OR-02 is responding to an active distress signal.', 'danger');
    updateTime();
    renderDrones();
}

function launchDrone() {
    missionStatus.textContent = 'Launching';
    missionStatus.className = 'status status-warning';
    setAlert('Launching additional drone to support the coastal patrol.', 'warning');
    updateTime();
    renderDrones();
}

function resetSimulation() {
    drones[0].status = 'Idle';
    drones[0].battery = 94;
    drones[0].location = 'Bay Alpha';
    drones[1].status = 'Patrolling';
    drones[1].battery = 78;
    drones[1].location = 'Coastal Sector 3';
    drones[1].eta = '12 min';
    drones[2].status = 'Responding';
    drones[2].battery = 62;
    drones[2].location = 'Distress signal';
    missionStatus.textContent = 'Monitoring';
    missionStatus.className = 'status status-safe';
    setAlert('No active alerts. All drones are operating normally.');
    updateTime();
    renderDrones();
}

function requestEmergency() {
    missionStatus.textContent = 'Emergency';
    missionStatus.className = 'status status-danger';
    setAlert('Emergency alert received. Rescue drones are being dispatched to the reported location.', 'danger');
    updateTime();
}

launchDroneBtn.addEventListener('click', launchDrone);
resetBtn.addEventListener('click', resetSimulation);
emergencyBtn.addEventListener('click', requestEmergency);

resetSimulation();
setInterval(simulateMissionUpdate, 18000);
