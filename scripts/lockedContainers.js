// Import world component from "@minecraft/server"
import { world, system, ItemStack } from '@minecraft/server';

//for testing, to allow placing containers not locked by user
const dev = false;

function actionBar(player, message){
    system.run(() => actionBarHelper(player, message));
}

function actionBarHelper(player, message) {
    player.onScreenDisplay.setActionBar(message);
}

function createPropertyKey(dimension, x, y, z){
    return "lockedContainer".concat('|', dimension.slice(10),'|', x, '|', y, '|', z)
}

function setLock(dimension, x, y, z, lock, type) {
    world.setDynamicProperty(
        createPropertyKey(dimension, x, y, z),
        type.concat('|',lock)
    );
}

function deleteLock(dimension, x, y, z) {
    // Unset the matching dynamic property
    world.setDynamicProperty(createPropertyKey(dimension, x, y, z), undefined);
}

function lockExists(dimension, x, y, z) {
    let property = world.getDynamicProperty(createPropertyKey(dimension, x, y, z));
    if(!property){
        return false;
    }else{
        return property.split('|', 2);
    }
}

function lockedForUser(user, dimension, x, y, z) {
    const lock = lockExists(dimension, x, y, z);
    if (!lock) {
        return false;
    }else if(lock[1].includes(user.toLowerCase())){
        return false;
    }else{
        return lock;
    }
}

function checkLock(event, action) {
    const b = event.block;
    const player = event.player;
    const item = event.itemStack;

    if(b.matches("chest") || b.matches("barrel") || b.typeId.includes("shulker_box")){
        const lock = lockedForUser(player.name, b.dimension.id, b.location.x, b.location.y, b.location.z);
        if(lock){
            // container locked
            if(player.isOp()){
                if(typeof item !== "undefined" && item.matches("dirt")){
                    world.sendMessage("§eAdmin §c"+player.name+"§e "+action+"ed locked "+lock[0]+" at "+b.location.x+" "+b.location.y+" "+b.location.z+" in the "+b.dimension.id.slice(10)+", with lock tag ‘"+lock[1]+"’");
                    return false;
                }else{
                    actionBar(player,"§6A player has locked this "+lock[0]+" with lock tag ‘"+lock[1]+"’. As admin, you can can override the lock by "+action+"ing the "+lock[0]+" while holding a dirt block.");
                    return true;
                }
            }else{
                actionBar(player,"§cThis "+lock[0]+" is locked, only users ‘"+lock[1]+"’ may "+action+" it.");
                return true;
            }
        }
    }
    return false;
}

function wouldDouble(placedBlock, playerFace){
    //get facing direction
    let face = 0;
    if (playerFace >= -45 && playerFace < 45) {
        //north
        face = 2;
    } else if (playerFace >= 45 && playerFace < 135) {
        //east
        face = 5;
    } else if ((playerFace >= 135 && playerFace <= 180) || (playerFace >= -180 && playerFace < -135)) {
        //south
        face = 3;
    } else if (playerFace >= -135 && playerFace < -45) {
        //west
        face = 4;
    }
    
    //deterimine the block that will be joined as a double chest to the placed block
    if(face === 2 || face === 3){
        if(placedBlock.east().permutation.getState("facing_direction") === face && placedBlock.east().matches("chest") && placedBlock.east().getComponent("inventory")?.container.size == 27){
            return placedBlock.east();
        }else if(placedBlock.west().matches("chest") && placedBlock.west().getComponent("inventory")?.container.size == 27){
            return placedBlock.west();
        }
    }
    if(face === 4 || face === 5){
        if(placedBlock.north().permutation.getState("facing_direction") === face && placedBlock.north().matches("chest") && placedBlock.north().getComponent("inventory")?.container.size == 27){
            return placedBlock.north();
        }else if(placedBlock.south().matches("chest") && placedBlock.south().getComponent("inventory")?.container.size == 27){
            return placedBlock.south();
        }
    }

    return false;
    
}

function doubleChestDiffLock(event, placedBlock, nameTag){
    const playerFace = event.player.getRotation().y;
    const doubledBlock = wouldDouble(placedBlock, playerFace);

    if(!doubledBlock){
        return false;
    }

    let name = undefined;
    if(typeof nameTag !== "undefined"){
            name = nameTag.slice(5).trim().toLowerCase()
    }

    const doubledLock = lockExists(doubledBlock.dimension.id, doubledBlock.x, doubledBlock.y, doubledBlock.z);

    // world.sendMessage("DoubledLock: "+doubledLock[1]);
    // world.sendMessage("name: "+name);

    if(doubledBlock && doubledLock){
        if(typeof name !== "undefined" && doubledLock[1].toLowerCase() === name){
            // world.sendMessage("Doubled chest lock matches");
            return false
        }
        return true
    }

    return false;

}

function getPlacedBlock(event){
    const { block, blockFace } = event;
    switch (blockFace) {
        case "Up":
            return block.above();
        case "Down":
            return block.below();
        case "North":
            return block.north();
        case "South":
            return block.south();
        case "East":
            return block.east();
        case "West":
            return block.west();
        default:
            throw new Error("Invalid blockFace value");
    }
}

function getOtherHalfChest(block){
    const itemStash = block.getComponent("inventory").container.getItem(0);
    block.getComponent("inventory").container.setItem(0, new ItemStack("minecraft:bedrock"));
    let block2;

    if(block.north().getComponent("inventory")?.container.getItem(0)?.typeId === "minecraft:bedrock"){
        world.sendMessage("matching block north: "+block.north().x+", "+block.north().z);
        block2 = block.north();
    }else if(block.south().getComponent("inventory")?.container.getItem(0)?.typeId === "minecraft:bedrock"){
        world.sendMessage("matching block south: "+block.south().x+", "+block.south().z);
        block2 = block.south();
    }else if(block.east().getComponent("inventory")?.container.getItem(0)?.typeId === "minecraft:bedrock"){
        world.sendMessage("matching block east: "+block.east().x+", "+block.east().z);
        block2 = block.east();
    }else if(block.west().getComponent("inventory")?.container.getItem(0)?.typeId === "minecraft:bedrock"){
        world.sendMessage("matching block west: "+block.west().x+", "+block.west().z);
        block2 = block.west();
    }
    
    block.getComponent("inventory").container.setItem(0, itemStash);
    
    return block2;
}

function fixChest(d, block){

    const block2 = getOtherHalfChest(block);

    const x1 = block.x;
    const y = block.y;
    const z1 = block.z;

    const x2 = block2.x;
    const z2 = block2.z;

    if(x1 < x2 || z1 < z2){
        //clone the chest being broken, including all blocks next to it to cover double chests down to the bottom of the world
        let result1 = world.getDimension(d).runCommand("clone "+x1+" "+y+" "+z1+" "+x2+" "+y+" "+z2+" "+x1+" "+-64+" "+z1);
        //world.sendMessage ("Clone Result successCount: "+result1.successCount);

        //clone it back to the original location - this fixes the graphical glitch with double chests where they split into two single chests when the event is canceled
        result1 = world.getDimension(d).runCommand("clone "+x1+" "+-64+" "+z1+" "+x2+" "+-64+" "+z2+" "+x1+" "+y+" "+z1);
        //world.sendMessage ("Clone Result successCount: "+result1.successCount);
    }else{
        //clone the chest being broken, including all blocks next to it to cover double chests down to the bottom of the world
        let result2 = world.getDimension(d).runCommand("clone "+x2+" "+y+" "+z2+" "+x1+" "+y+" "+z1+" "+x2+" "+-64+" "+z2);
        //world.sendMessage ("Clone Result successCount: "+result2.successCount);

        //clone it back to the original location - this fixes the graphical glitch with double chests where they split into two single chests when the event is canceled
        result2 = world.getDimension(d).runCommand("clone "+x2+" "+-64+" "+z2+" "+x1+" "+-64+" "+z1+" "+x2+" "+y+" "+z2);
        //world.sendMessage ("Clone Result successCount: "+result2.successCount);
    }

    //replace the cloned blocks at bottom of world with air or bedrock depending on the dimension.
    if(d === "minecraft:theEnd"){
        world.getDimension(d).runCommand("fill "+x1+" "+-64+" "+z1+" "+x2+" "+-64+" "+z2+" air");
    }else{
        world.getDimension(d).runCommand("fill "+x1+" "+-64+" "+z1+" "+x2+" "+-64+" "+z2+" bedrock");
    }
}

world.afterEvents.worldInitialize.subscribe(() => {
    world.setDynamicProperty("lockedContainersTagVersion", 1);
})

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    
    if(checkLock(event, "open")){
        event.cancel = true;
        return;
    }

    const s = event.itemStack;
    if(typeof s !== "undefined"){

        //split off the match and save a value of "chest", "barrel", or "shulker", and leave it undefined if neither
        const type = s.matches("chest") ? "chest" : s.matches("barrel") ? "barrel" : s.typeId.includes("shulker_box") ? "shulker" : null;
        
        if (type) {
            const b = getPlacedBlock(event);
            let nameTag = event.itemStack.nameTag;

            if(type === "chest" && doubleChestDiffLock(event, b, nameTag)){
                actionBar(event.player,"§cYou cannot create a double chest unless the locks match exactly!!!");
                event.cancel = true;
            }else if(typeof nameTag !== "undefined" && nameTag.slice(0, 5).toLowerCase() === "lock:"){
                nameTag = nameTag.slice(5).trim();
                if(nameTag.toLowerCase().includes(event.player.name.toLowerCase()) || dev){
                    setLock(b.dimension.id, b.x, b.y, b.z, nameTag, type);
                    // world.sendMessage("Locked block will be: "+b.typeId);
                }else{
                    actionBar(event.player,"§cYou cannot lock a container without your username on it!!!");
                    event.cancel = true;
                }
            }
        }
    }   
})


world.afterEvents.playerInteractWithBlock.subscribe(event => {

    const b = getPlacedBlock(event);
    
    //delete lock if a chest, barrel, or shulker was not placed
    if(!b.matches("chest") && !b.matches("barrel") && !b.typeId.includes("shulker_box")){
        deleteLock(b.dimension.id, b.x, b.y, b.z);
    }    
})

world.beforeEvents.playerBreakBlock.subscribe(event => {
    if(checkLock(event, "destroy")){
        event.cancel = true;
        if(event.block.getComponent("inventory")?.container.size === 54){

            //fix graphical glitch with double chests
            system.run(() => fixChest(event.dimension.id, event.block));
        }
        
    }else{
        deleteLock(event.block.dimension.id, event.block.x, event.block.y, event.block.z);
    }
    
    
})


world.beforeEvents.explosion.subscribe(event => {
    const b = event.getImpactedBlocks();

    for(let i=0; i<b.length; i++){
        if(lockExists(event.dimension.id, b[i].location.x, b[i].location.y, b[i].location.z,)){
            event.cancel=true;
            break;
        }
    }

})

world.afterEvents.pistonActivate.subscribe(event => {

    const attached = event.piston.getAttachedBlocks();
    const dimension = event.block.dimension.id;
    let ex = 1;
    if(!event.isExpanding){
        ex = -1
    }
   
    let move = [];

    for(let i=0; i<attached.length; i++) {
        
        let lock = lockExists(dimension, attached[i].location.x, attached[i].location.y, attached[i].location.z);

        if(lock && (lock[0] === "chest" || lock[0] === "barrel")){
            let xadd = 0;
            let yadd = 0;
            let zadd = 0;
            switch (event.block.permutation.getState("facing_direction")) {
                case 0:
                    yadd -= ex;
                    break;
                case 1:
                    yadd += ex;
                    break;
                case 2:
                    zadd += ex;
                    break;
                case 3:
                    zadd -= ex;
                    break;
                case 4:
                    xadd += ex;
                    break;
                case 5:
                    xadd -= ex;
                    break;
                default:
                    throw new Error("Invalid facing_direction value");
            }
            //save location for moving at the end of the loop
            move.push([[attached[i].location.x+xadd, attached[i].location.y+yadd, attached[i].location.z+zadd], lock]);
            
            //delete lock
            deleteLock(dimension, attached[i].location.x, attached[i].location.y, attached[i].location.z);
        }

    }
    //reset locks for all moved blocks that previously had a lock
    move.forEach(item => {
        setLock(dimension, item[0][0], item[0][1], item[0][2], item[1][1], item[1][0]);
    });

})



//debugging
world.beforeEvents.chatSend.subscribe(event => {
    if(event.sender.isOp() && event.message.slice(0,3) === '!lc'){
        event.cancel = true;
        const command = event.message.split(" ");
        switch(command[1]){
            case "props":
                var props = world.getDynamicPropertyIds();
                world.sendMessage("Current Dynamic Properties:");
                props.forEach(p => {
                    world.sendMessage("PropId: "+p+" Value: "+world.getDynamicProperty(p));
                });
                break;
            case "clearProps":
                world.sendMessage("All Dynamic Properties cleared")
                world.clearDynamicProperties();
                break;
            default:
                world.sendMessage("No custom command for lockedContainers plugin by that name");
        }
    }
})