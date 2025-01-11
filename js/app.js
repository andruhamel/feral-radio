const statusNode = document.getElementById("server-status");
const EXTERNAL_SERVER_STATUS_DOMAIN = "feralcat-radio.ddns.net:1985";
const SERVER_STATUS_URL = `http://${EXTERNAL_SERVER_STATUS_DOMAIN}/status-json.xsl`

window.onload = async function () {
    if (!statusNode) {
        console.error("No status node found on the page!");
        return alert("No status node found on the page!");
    }

    const stationsInfo = document.createElement("div");
    stationsInfo.id = "stations-info";

    try {
        const icecastStats = await fetch(SERVER_STATUS_URL);

        if (!icecastStats.ok) {
            return statusNode.appendChild(document.createTextNode("Failed to fetch server status!"));
        }

        const { icestats: { location, server_start, source } } = await icecastStats.json();

        statusNode.appendChild(renderServerInfo(location, server_start));
        statusNode.appendChild(stationsInfo);

        if (source !== undefined) {
            stationsInfo.appendChild(renderStationsInfo(source));
        } else {
            const msgNode = document.createElement("div");
            msgNode.className = "alert alert-info";
            msgNode.id = "msg-container";
            msgNode.appendChild(document.createTextNode("No stations found! Seams we aren't broadcasting anything at the moment."));
            stationsInfo.appendChild(msgNode);
        }

        console.log("source", source);
    } catch (error) {
        console.error("Failed to fetch server status!", error);
        const errorNode = document.createElement("div");
        errorNode.className = "alert alert-danger";
        errorNode.id = "error-container";
        errorNode.appendChild(document.createTextNode("Failed to fetch server status!"));
        stationsInfo.appendChild(errorNode);
    }
};

let songTitleTimerId;

const refreshSongTitle = async (selector, stationIndex) => {
    console.debug(`Refreshing song title for station ${stationIndex + 1}...`);
    const songTitleNode = document.getElementById(selector);

    if (!songTitleNode) {
        console.error(`Failed to find song title node with id: ${selector}`);
        return;
    }

    songTitleTimerId = setInterval(async () => {
        try {
            const icecastStats = await fetch(SERVER_STATUS_URL);
            const { icestats: { source } } = await icecastStats.json();

            if (source === undefined) {
                console.error("No stations found!");
                return;
            }

            const stationInfo = Array.isArray(source) ? source[stationIndex] : source;

            songTitleNode.textContent = stationInfo.title;

            console.debug(`Song title for station ${stationIndex + 1}: ${stationInfo.title}`);

        } catch (error) {
            console.error("Failed to fetch song title!", error);
        }
    }, 3000);
};

const renderStation = (channel, index) => {
    const output = document.createElement("div");
    output.className = "accordion-item";

    output.innerHTML = `
        <h2 class="accordion-header">
        <button class="accordion-button fw-bold text-success" type="button" data-bs-toggle="collapse" data-bs-target="#station-${index}" aria-expanded="${index === 0}" aria-controls="station-${index}">
            Station ${index + 1}: ${channel.server_name}
        </button>
        </h2>
        <div id="station-${index}" class="accordion-collapse collapse ${index === 0 ? "show" : ""}" data-bs-parent="#stations">
        <div class="accordion-body">
            <div class="container-sd text-start g-0">
                <div class="row">
                    <div class="col-md-3 fw-bold">
                        Description:
                    </div>
                    <div class="col-md-9">
                        ${channel.server_description}
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3 fw-bold">
                        Stream start:
                    </div>
                    <div class="col-md-9">
                        ${channel.stream_start}
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3 fw-bold">
                        Listeners:
                    </div>
                    <div class="col-md-9">
                        ${channel.listeners}
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3 fw-bold">
                        Song:
                    </div>
                    <div class="col-md-9" id="station-${index}-song-title">
                        ${channel.title}
                    </div>
                </div>
            </div> 
            <br>
            <audio src="${channel.listenurl.replace(':8000', '')}" controls></audio>
        </div>
        </div>
    `;

    return output;
};

const renderServerInfo = (location, server_start) => {
    const output = document.createElement("div");

    output.id = "server-info";
    output.className = "container-sd text-start g-0";

    output.innerHTML = `        
        <div class="row">
            <div class="col-md-3 fw-bold">
                Server location:
            </div>
            <div class="col-md-9">
                ${location}
            </div>
        </div>
        <div class="row">
            <div class="col-md-3 fw-bold">
                Server start time:
            </div>
            <div class="col-md-9">
                ${server_start}
            </div>
        </div>
    `;

    return output;
}

const renderStationsInfo = (source) => {
    const stations = Array.isArray(source) ? source : [source];

    const accordion = document.createElement("div");
    accordion.id = "stations";
    accordion.className = "accordion";

    stations.forEach((station, index) => {
        const channelNode = renderStation(station, index);
        accordion.appendChild(channelNode);
    });

    return accordion;
};