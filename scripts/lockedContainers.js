// Import world component from "@minecraft/server"
import { world, system, } from '@minecraft/server';

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

    if(b.matches("barrel") || b.typeId.includes("shulker_box")){
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

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    
    if(checkLock(event, "open")){
        event.cancel = true;
        return;
    }

    const s = event.itemStack;
    if(typeof s !== "undefined"){

        //split off the match and save a value of "barrel" or "shulker", and leave it undefined if neither
        const type = s.matches("barrel") ? "barrel" : s.typeId.includes("shulker_box") ? "shulker" : null;
        
        if (type) {
            let nameTag = event.itemStack.nameTag;
            if(typeof nameTag !== "undefined" && nameTag.slice(0, 5).toLowerCase() === "lock:"){
                const dev = true;
                nameTag = nameTag.slice(5).trim();
                if(nameTag.toLowerCase().includes(event.player.name.toLowerCase()) || dev){
                    const b = getPlacedBlock(event);
                    setLock(b.dimension.id, b.x, b.y, b.z, nameTag, type);
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
    //delete lock if a barrel or shulker was not placed
    if(!b.matches("barrel") && !b.typeId.includes("shulker_box")){
        deleteLock(b.dimension.id, b.x, b.y, b.z);
    }    
})

world.beforeEvents.playerBreakBlock.subscribe(event => {
    if(checkLock(event, "destroy")){
        event.cancel = true;
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

world.afterEvents.entityDie.subscribe(event =>{
    world.sendMessage("Entity ID: "+event.deadEntity);
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
        world.sendMessage("Attached block type "+attached[i].typeId+": "+attached[i].location.x+" "+attached[i].location.y+" "+attached[i].location.z);
        
        let lock = lockExists(dimension, attached[i].location.x, attached[i].location.y, attached[i].location.z);

        if(lock && lock[0] === "barrel"){
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
            
            for (let i = 0; i < move.length; i++) {
                world.sendMessage(`Dimension: [${move[i][0][0]}, ${move[i][0][1]}, ${move[i][0][2]}], Lock: ${move[i][1]}`);
            }

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
    
    if(event.message.slice(0,3) === '!lc'){
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