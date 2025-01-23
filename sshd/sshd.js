let btn_install;
let input_enabled;
let input_start;
let status_service;
let enabled_service;
let show_properties;

let listen_address;
let port;
let authorized_keys_file;
let permit_root_login;
let x11_forwarding;
let btn_apply_setup;

let file_sshd_config;

let keys_allowed_file_url;
let keys_allowed_array;
let table_keys_allowed;
let btn_refresh_keys_allowed;
let btn_apply_keys_allowed;

let table_active_conections;
let btn_refresh_active_conections;

let ssh_connections;

let user;
let user_login;
let user_alert;

function setElementsDefault() {
    user_alert = document.getElementById("user_alert");
    show_properties = document.getElementById("show_properties");
    // The section will only be hidden if SSH is not installed
    btn_install = document.getElementById("btn_install");
    input_enabled = document.getElementById("input_enabled");
    input_start = document.getElementById("input_start");
    status_service = document.getElementById("status_service");
    enabled_service = document.getElementById("enabled_service");

    addEventListenersDefault();
}

function addEventListenersDefault() {
    btn_install.addEventListener("click", onClickInstall);
    input_enabled.addEventListener("click", onToggleEnable);
    input_start.addEventListener("click", onToggleStart);
}

function setElementsSetup() {
    listen_address = document.getElementById("listen_address");
    port = document.getElementById("port");
    authorized_keys_file = document.getElementById("authorized_keys_file");
    permit_root_login = document.getElementById("permit_root_login");
    x11_forwarding = document.getElementById("x11_forwarding");
    btn_apply_setup = document.getElementById("btn_apply_setup");

    addEventListenersSetup();
}

function addEventListenersSetup() {
    btn_apply_setup.addEventListener("click", onClickApplySetup);
}

function setElementsKeysAllowed() {
    table_keys_allowed = document.getElementById("table_keys_allowed");
    btn_apply_keys_allowed = document.getElementById("btn_apply_keys_allowed");
    btn_refresh_keys_allowed = document.getElementById("btn_refresh_keys_allowed");
    user_login = document.getElementById("user_login");
    addEventListenerKeysAllowed();
}

function addEventListenerKeysAllowed() {
    btn_refresh_keys_allowed.addEventListener("click", loadAndPopulateKeysAllowed);
    btn_apply_keys_allowed.addEventListener("click", applyChangesOnKeysAllowed)
}

function setElementsActiveConections() {
    table_active_conections = document.getElementById("table_active_conections");
    btn_refresh_active_conections = document.getElementById("btn_refresh_active_conections");

    addEventListenerActiveConections();
}

function addEventListenerActiveConections() {
    btn_refresh_active_conections.addEventListener("click", checkActiveConections);
}

/*********** START CHECKS *************************/

function checkInstalledService() {
    cockpit.spawn(["apt", "list", "--installed"])
        .then(function(output) {
            if (output.includes("openssh-server")) {
                // SSH server is installed
                btn_install.setAttribute("disabled", "true");
                btn_install.innerText = "Installed";
                show_properties.style.display = 'block';

                checkService();
                loadSshdConfig();
                checkEnabledOnStartup(); // Check enabled status on startup
                checkActiveConections(); // Check active connections on startup
            } else {
                // SSH server is NOT installed
                // ... (rest of the code for the "not installed" case)
            }
        })
        .catch(function(error) {
            // ... (error handling)
        });
}

function checkEnabledOnStartup() {
    cockpit.spawn(["systemctl", "status", "sshd"])
        .then(function(output) {
            // Trim the output to remove leading/trailing whitespace and newlines
            const status = output.trim();
            console.log(output);
             

            if (output.includes("ssh.service; enabled;")) {
                enabled_service.innerText = "Enabled";
                enabled_service.className = "text-success";
                input_enabled.checked = true;
            } else {
                enabled_service.innerText = "Disabled";
                enabled_service.className = "text-warning";
                input_enabled.checked = false;
            }
        })
        .catch(function(error) {
            console.error("Error checking if SSH service is enabled on startup:", error);
        });
}
function checkService() {
    cockpit.spawn(["systemctl", "status", "sshd"])
        .stream(checkStatus)
        .catch(function(error) {
            console.error("Error checking SSH service status:", error);
        });
}

function checkStatus(data) {
    console.log("status_service");
    if (data.includes("Active: active (running)")) {
        status_service.innerText = "Running";
        status_service.className = "text-success";
        input_start.checked = true;
        checkEnabled(data);
        return;
    }
    if (data.includes("Active: inactive (dead)")) {
        status_service.innerText = "Stopped";
        status_service.className = "text-warning";
        input_start.checked = false;
        checkEnabled(data);
        return;
    }
    if (data.includes("Active: activating (start)")) {
        status_service.innerText = "Starting...";
        status_service.className = "text-warning";
        checkService(); // Check again soon
        return;
    }
    status_service.innerText = "Broken";
    status_service.className = "text-danger";
    input_start.checked = false;
    checkEnabled(data);
}

function checkEnabled(data) {
    console.log("enabled_service");
    if (data.includes("disabled; vendor preset:")) {
        enabled_service.innerText = "Disabled";
        enabled_service.className = "text-warning";
        input_enabled.checked = false
        return;
    }
    if (data.includes("enabled; vendor preset:")) {
        enabled_service.innerText = "Enabled";
        enabled_service.className = "text-success";
        input_enabled.checked = true;
        return;
    }
}

function checkActiveConections() {
    cockpit.spawn(["who"])
        .stream(getSshConections)
        .catch(function(error) {
            console.error("Error checking active connections:", error);
        });
}

/******************* ACTIONS ********************/

function installService() {
    btn_install.setAttribute("disabled", "true");
    btn_install.innerText = "Installing...";
    cockpit.spawn(["apt", "install", "-y", "openssh-server"])
        .then(function(resp) {
            console.log("Installation successful:", resp);
            checkInstalledService(); // Re-check after installation
        })
        .catch(function(error) {
            console.error("Installation error:", error);
            btn_install.removeAttribute("disabled");
            btn_install.innerText = "Install";
            // Display an error message to the user
            let message = document.createElement("p");
            message.textContent = "Error installing SSH Server. Please check the logs.";
            message.className = "alert alert-danger";
            show_properties.parentNode.insertBefore(message, show_properties);
        });
}

function setEnabled() {
    cockpit.spawn(["systemctl", "enable", "sshd"])
        .then(function() {
            enabled_service.innerText = "Enabled";
            enabled_service.className = "text-success";
            checkEnabled(); // Re-check after enabling
        })
        .catch(function(error) {
            console.error("Error enabling SSH service:", error);
            enabled_service.innerText = "Error";
            enabled_service.className = "text-danger";
        });
}

function setDisabled() {
    cockpit.spawn(["systemctl", "disable", "sshd"])
        .then(function() {
            enabled_service.innerText = "Disabled";
            enabled_service.className = "text-warning";
            checkEnabled(); // Re-check after disabling
        })
        .catch(function(error) {
            console.error("Error disabling SSH service:", error);
            enabled_service.innerText = "Error";
            enabled_service.className = "text-danger";
        });
}

function setStart() {
    cockpit.spawn(["systemctl", "start", "sshd"])
        .catch(function(error) {
            console.error("Error starting SSH service:", error);
        });
}

function setStop() {
    cockpit.spawn(["systemctl", "stop", "sshd"])
        .catch(function(error) {
            console.error("Error stopping SSH service:", error);
        });
}

/******************* ACTIONS **********************/

/******************* CLICKS **********************/

function onClickInstall() {
    installService();
}

function onToggleEnable() {
    if (input_enabled.checked) {
        enabled_service.innerText = "Enabling...";
        enabled_service.className = "text-warning";
        setEnabled();
    } else {
        enabled_service.innerText = "Disabling...";
        enabled_service.className = "text-warning";
        setDisabled();
    }
    //checkService();
}

function onToggleStart() {
    if (input_start.checked) {
        setStart();
    } else {
        setStop();
    }
    checkService();
}

async function onClickApplySetup() {
    await saveConfig();
    setStop();
    checkService();
    await loadSshdConfig();
    setStart();
    checkService();
}

/******************* LOAD CONFIG *****************/

async function loadSshdConfig() {
    try {
        file_sshd_config = await cockpit.file('/etc/ssh/sshd_config').read();

        for (const line of file_sshd_config.split('\n')) {
            getListenAddress(line);
            getPort(line);
            getAuthorizedKeysFile(line);
            getPermitRootLogin(line);
            getX11Forwarding(line);
        };

        loadAndPopulateKeysAllowed();
    } catch (error) {
        console.error("Error reading sshd_config:", error);
    }
}

function getListenAddress(line) {
    if (line.includes("ListenAddress")) {
        const completeLine = line.split("ListenAddress")
        if (isTheAtribute(completeLine)) {
            listen_address.value = completeLine[1].trim()
        }
    }
}

function getPort(line) {
    if (line.includes("Port")) {
        const completeLine = line.split("Port")
        if (isTheAtribute(completeLine)) {
            port.value = completeLine[1].trim()
        }
    }
}

function getAuthorizedKeysFile(line) {
    if (line.includes("AuthorizedKeysFile")) {
        const completeLine = line.split("AuthorizedKeysFile")
        if (isTheAtribute(completeLine)) {
            authorized_keys_file.value = completeLine[1].trim()
            keys_allowed_file_url = completeLine[1].trim();
        }
    }
}

function getPermitRootLogin(line) {
    if (line.includes("PermitRootLogin")) {
        const completeLine = line.split("PermitRootLogin")
        if (isTheAtribute(completeLine)) {
            permit_root_login.checked = completeLine[1].trim() == "yes" ? true : false;
        }
    }
}

function getX11Forwarding(line) {
    if (line.includes("X11Forwarding")) {
        const completeLine = line.split("X11Forwarding")
        if (isTheAtribute(completeLine)) {
            x11_forwarding.checked = completeLine[1].trim() == "yes" ? true : false;
        }
    }
}

function isTheAtribute(lineSplited) {
    if (lineSplited[0].trim() === '' && lineSplited[1][0].trim() === '') {
        return true;
    }
    return false;
}

/******************** SET CONFIG *****************/

async function saveConfig() {
    try {
        let liAdWrited = false;
        let porWrited = false;
        let auKFWrited = false;
        let peRLWrited = false;
        let x11FWrited = false;

        const fileSplited = file_sshd_config.split('\n')
        for (let index = 0; index < fileSplited.length; index++) {
            const line = fileSplited[index];

            if (!liAdWrited) {
                const liAd = setListenAddress(line);
                if (liAd !== null) {
                    fileSplited[index] = liAd;
                    liAdWrited = true;
                }
            }

            if (!porWrited) {
                const por = setPort(line);
                if (por !== null) {
                    fileSplited[index] = por;
                    porWrited = true;
                }
            }

            if (!auKFWrited) {
                const auKF = setAuthorizedKeysFile(line);
                if (auKF !== null) {
                    fileSplited[index] = auKF;
                    auKFWrited = true;
                }
            }

            if (!peRLWrited) {
                const peRL = setPermitRootLogin(line);
                if (peRL !== null) {
                    fileSplited[index] = peRL;
                    peRLWrited = true;
                }
            }

            if (!x11FWrited) {
                const x11F = setX11Forwarding(line);
                if (x11F !== null) {
                    fileSplited[index] = x11F;
                    x11FWrited = true;
                }
            }
        };

        if (!liAdWrited) {
            if (listen_address.value !== '') {
                fileSplited.push("ListenAddress " + listen_address.value);
            } else {
                fileSplited.push("#ListenAddress 0.0.0.0")
            }
        }
        if (!porWrited) {
            if (port.value !== '') {
                fileSplited.push("Port " + port.value);
            } else {
                fileSplited.push("#Port 22");
            }
        }
        if (!auKFWrited) {
            if (authorized_keys_file.value !== '') {
                fileSplited.push("AuthorizedKeysFile " + authorized_keys_file.value);
            } else {
                fileSplited.push("AuthorizedKeysFile .ssh/authorized_keys")
            }
        }
        if (!peRLWrited) {
            fileSplited.push("PermitRootLogin " + (permit_root_login.checked === true ? "yes" : "no"));
        }
        if (!x11FWrited) {
            fileSplited.push("X11Forwarding " + (x11_forwarding.checked === true ? "yes" : "no"))
        }

        const result = await cockpit.file('/etc/ssh/sshd_config').replace(fileSplited.join('\n'))
        console.log(result);
    } catch (error) {
        console.error("Error saving sshd_config:", error);
    }
}

function setListenAddress(line) {
    if (line.includes("ListenAddress")) {
        const completeLine = line.split("ListenAddress")
        if (isTheAtributeLine(completeLine)) {
            if (listen_address.value !== '') {
                return "ListenAddress " + listen_address.value;
            } else {
                return "#ListenAddress 0.0.0.0";
            }
        }
    }
    return null;
}

function setPort(line) {
    if (line.includes("Port")) {
        const completeLine = line.split("Port")
        if (isTheAtributeLine(completeLine)) {
            if (port.value !== '') {
                return "Port " + port.value;
            } else {
                return "#Port 22"
            }
        }
    }
    return null;
}

function setAuthorizedKeysFile(line) {
    if (line.includes("AuthorizedKeysFile")) {
        const completeLine = line.split("AuthorizedKeysFile")
        if (isTheAtributeLine(completeLine)) {
            if (authorized_keys_file.value !== '') {
                return "AuthorizedKeysFile " + authorized_keys_file.value;
            } else {
                return "AuthorizedKeysFile .ssh/authorized_keys";
            }
        }
    }
    return null;
}

function setPermitRootLogin(line) {
    if (line.includes("PermitRootLogin")) {
        const completeLine = line.split("PermitRootLogin")
        if (isTheAtributeLine(completeLine)) {
            return "PermitRootLogin " + (permit_root_login.checked === true ? "yes" : "no");
        }
    }
    return null;
}

function setX11Forwarding(line) {
    if (line.includes("X11Forwarding")) {
        const completeLine = line.split("X11Forwarding")
        if (isTheAtributeLine(completeLine)) {
            return "X11Forwarding " + (x11_forwarding.checked === true ? "yes" : "no");
        }
    }
    return null;
}

function isTheAtributeLine(lineSplited) {
    if ((lineSplited[0].trim() === '' || lineSplited[0].trim() === '#') && lineSplited[1][0].trim() === '') {
        return true;
    }
    return false;
}

function getSshConections(data) {

    ssh_connections = [];
    if (data != null && data.length > 0) {
        console.log(data)
        for (const line of data.split('\n')) {
            if (line.includes('pts')) {
                ssh_connections.push(line)
            }
        }
    }

    populateActiveConections();
}

/**********************END GET SSH CONECTIONS **********/

/********** START POPULATING ACTIVE CONECTIONS ********/
function populateActiveConections() {

    table_active_conections.innerHTML = "";

    for (const line of ssh_connections) {
        const div = document.createElement('div');
        div.className = "list-group-item d-flex flex-wrap justify-content-between";
        table_active_conections.appendChild(div);
        const text = document.createTextNode(line);
        div.appendChild(text);
    }
}

// Function to load and populate keys allowed
async function loadAndPopulateKeysAllowed() {
    try {
        // Get the user information
        let user = await cockpit.user();

        // Check if user information is available and set the user login display immediately
        user_login.innerText = user == null ? 'user.home' : user.name != null ? `(${user.name})` : 'user.home';

        // Build the URL for the keys allowed file
        const url = user.home + "/" + keys_allowed_file_url;

        // Read the keys allowed file
        const keys_allowed_file = await cockpit.file(url).read() || "";

        // Split the keys allowed file content into an array
        keys_allowed_array = keys_allowed_file.split('\n').filter(key => key.trim() !== "");

        // Populate the keys allowed
        populateKeysAllowed();
    } catch (error) {
        console.error("Error loading or populating keys allowed:", error);
    }
}

function populateKeysAllowed() {
    table_keys_allowed.innerHTML = "";

    // If no keys are found, display a message
    if (keys_allowed_array.length === 0) {
        const message = document.createElement('div');
        message.className = "list-group-item";
        message.textContent = "No authorized keys detected";
        table_keys_allowed.appendChild(message);
    } else {
        for (let index = 0; index < keys_allowed_array.length; index++) {
            const element = keys_allowed_array[index];

            const keyHost = element.split('= ')[1]

            const dflex = document.createElement('div');
            dflex.className = "list-group-item d-flex flex-wrap justify-content-between";
            table_keys_allowed.appendChild(dflex);

            const p1 = document.createElement('div');
            p1.className = "p-2";
            dflex.appendChild(p1);

            const p2 = document.createElement('div');
            p2.className = "p-2";
            dflex.appendChild(p2);
            const text = document.createTextNode(keyHost);
            p1.appendChild(text)
            const btnDelete = document.createElement('button')
            p2.appendChild(btnDelete)

            btnDelete.innerText = "Remove";
            btnDelete.className = "btn btn-danger";
            btnDelete.setAttribute("id", index);
            btnDelete.addEventListener("click", onClickDeleteKey);
        }
    }
}
function onClickDeleteKey(event) {
    const index = event.target.getAttribute('id');
    keys_allowed_array.splice(index, 1);
    populateKeysAllowed();
}

async function applyChangesOnKeysAllowed() {
    try {
        const url = "/root/" + keys_allowed_file_url;
        const result = await cockpit.file(url).replace(keys_allowed_array.join('\n'))
        console.log(result);
        loadAndPopulateKeysAllowed();
    } catch (error) {
        console.error("Error applying changes to keys allowed:", error);
    }
}

function showAlert() {
    let div = document.createElement("div");
    div.className = "alert alert-danger";

    div.innerHTML = "<h5>By default, these settings can only be modified by the <b>\"root\"</b> user.</h5>" +
        "<p>Current user: <b>" + user.full_name + "</b></p>";

    user_alert.appendChild(div);
}

cockpit.transport.wait(function() {
    cockpit.user().then((userCockpit) => {
        user = userCockpit;
        if (user !== null) {
            user_alert.style.display = 'none';
        } else {
            user_alert.style.display = 'block';
            showAlert();
        }
    });

    setElementsDefault();
    setElementsSetup();
    setElementsKeysAllowed();
    setElementsActiveConections();
    checkInstalledService();
});
