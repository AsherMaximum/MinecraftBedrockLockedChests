# Minecraft Bedrock Locked Chests and Containers

## Description
Locked Containers is a Minecraft Bedrock add-on that allows players to lock chests, barrels, and shulker boxes by renaming the container to `Lock: <player1, player2 ...>` before placing it. This feature ensures that only specified players can access the locked containers. Players must include their own username when renaming; otherwise, placing the container will be blocked.

In addition to locking, this add-on also protects the locked containers from explosions. Any explosions near locked containers, such as those caused by creepers or TNT, are canceled, effectively protecting the surrounding area from damage.

Double chests are blocked from creation unless the names of both chests match.

Server admins have the ability to override locks.

**Requirements:** 
- The `Experiments -> Beta APIs` feature must be turned on for this add-on to function properly.

## Installation
1. [Download the Add-on Pack](https://github.com/AsherMaximum/MinecraftBedrockLockedChests/releases/latest/download/lockedContainers.mcpack) and open it to install.
2. Enable the `Experiments -> Beta APIs` feature in your world settings.
3. Add it to your world under `Behavior Packs`.

## Usage
- To lock a container, rename it to `Lock: <player1, player2 ...>`, including your own username.
- Only the players listed in the lock will be able to open the container.
- Locked containers are protected from explosions, helping secure your items and the surrounding area.

## Known Issues
- Shulker boxes can be broken by pistons, and the lock is not removed from the block where it was.

## Permissions
Server admins have the ability to override any locks placed on containers.

## Credits
Developed by AsherMaximum.

## License
This project is licensed under the GPL v3 License - see the [LICENSE](LICENSE) file for details.
