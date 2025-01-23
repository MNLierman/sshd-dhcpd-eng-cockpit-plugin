# sshd-dhcpd-cockpit-plugin

## Overview
This is a plugin for Cockpit Project that allows the configuration and monitoring of SSH and DHCP services through a web interface.

## Cockpit Installation
If you haven't already done so, you need to install the Cockpit Plugin for the machine you want to monitor. Most package managers provide easy installation, this can be done through `apt`, `apk`, or `yum`.
Example: `apt install cockpit`

## Plugin Installation
```
git clone https://github.com/MNLierman/sshd-dhcpd-eng-cockpit-plugin
sudo ln -s sshd-dhcpd-eng-cockpit-plugin /local/share/cockpit/sshd-dhcpd-eng-cockpit-plugin\sshd
sudo ln -s "$(pwd)/sshd-dhcpd-eng-cockpit-plugin" /local/share/cockpit/sshd-dhcpd-eng-cockpit-plugin\dhcpd
```
<br><br><br>

## Remaining Configuration
##### The screenshots are still in Spanish, but one day I may replace them.

The folders corresponding to the two services will be symlinked to Cockpit's plugin directory, which in typically located at **/usr/share/cockpit**. By symlinking them, you can keep up to date with any changes, or you can fork this repo and make your own changes, and keep your own versions up to date using this same method. No need to build or make anything.

If you prefer, you can manually copy the two folders to the directory corresponding to your Cockpit's plugins.

Test again from another machine using a browser, at the URL:

[ip_of_cockpit_machine]:9090

Log in, and a screen like this will be displayed, with the two services added to the menu:
![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/2.png?raw=true)

## Monitoring the Services' Status
As soon as one of the services is accessed, it checks if the service is installed. If it is not installed, you can install it via the **Install** button. If it is already installed, this button will display **Installed**.

Below that, it shows the service status, whether it's **Running**, **Broken**, or **Stopped**. You can manually change these values to **Running** or **Stopped**.

You can also **Enable** or **Disable** the service to start automatically.

These features are present in both plugins.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/3.png?raw=true)

## Configuring SSHD
In the SSHD settings, you can restrict the access interface and specify an access port.

By default, access is allowed on all interfaces, meaning if this value is left blank, the service will be accessible on any available interface. If the access port value is left blank, the default port will be 22.

You can configure the file that will manage the authorization keys. If you are changing this value, make sure the specified file exists.

You can enable or disable access with the **root** user and X11 connection forwarding.

Applying the settings will restart the service.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/4.png?raw=true)

## Managing Access Keys
In this section, hosts with key access through the SSHD service of the current user (logged into Cockpit) are displayed according to the file specified in the previous configuration section. You can remove key access from the list of hosts with permitted key access. It is necessary to **Apply Changes** in the Key List, and the service will be restarted.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/5.png?raw=true)

## Managing Active Connections
In this section, active SSH connections to the server where Cockpit is running are displayed.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/6.png?raw=true)

## Configuring DHCPD

### General Settings
In the general DHCP settings, you can specify the primary DNS, secondary DNS, domain, default lease time, and maximum lease time.

The secondary DNS will only be applied if there is a primary DNS.

Applying these settings will restart the service.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/7.png?raw=true)

### Subnet Settings
In this section, we specify the network address, mask, range of automatic IPs, and gateway. If any value in this section is entered incorrectly, the service can *"Fail"* and show the status **Broken**, for example, if the mask does not correspond to the subnet address.

Applying these settings will restart the service.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/8.png?raw=true)

## Configuring a Fixed IP
You can assign a fixed IP to a machine by specifying the network card's MAC address, the IP to be assigned, and an identifier name. You can also delete previously configured fixed IP settings. It is necessary to **Apply Changes** to the Fixed IP List. The service will restart.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/9.png?raw=true)

## Monitoring Connected Clients
In this section, you can see the IP, hostname, and MAC address of all clients that received an automatic IP and are active.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/10.png?raw=true)
