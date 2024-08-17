# Locked Containers

## Description
Locked Containers is a Minecraft add-on that allows players to lock barrels and shulker boxes by renaming the container to `Lock: <player1, player2 ...>` before placing it. This feature ensures that only specified players can access the locked containers. Players must include their own username when renaming; otherwise, placing the container will be blocked.

In addition to locking, this add-on also protects the locked containers from explosions. Any explosions near locked containers, such as those caused by creepers or TNT, are canceled, effectively protecting the surrounding area from damage.

**Note:** Chests are not included in this locking mechanism due to a graphical glitch. When an unauthorized player tries to mine a double chest, the chest splits into two single chests and becomes unopenable until the world is reloaded.

Server admins have the ability to override locks.

**Requirements:** 
- The `Experiments -> Beta APIs` feature must be turned on for this add-on to function properly.

## Installation
1. Download the add-on and place it in your Minecraft world folder.
2. Enable the `Experiments -> Beta APIs` feature in your world settings.

## Usage
- To lock a container, rename it to `Lock: <player1, player2 ...>`, including your own username.
- Only the players listed in the lock will be able to open the container.
- Locked containers are protected from explosions, helping secure your items and the surrounding area.

## Known Issues
- Chests cannot be locked due to a graphical glitch when mined by unauthorized players.
- The glitch causes the chest to split and become unopenable until the world is reloaded.

## Permissions
Server admins have the ability to override any locks placed on containers.

## Credits
Developed by AsherMaximum.

## License
This project is licensed under the GPL v3 License - see the [LICENSE](LICENSE) file for details.
