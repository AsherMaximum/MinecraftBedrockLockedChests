// Import world component from "@minecraft/server"
import { world } from '@minecraft/server';

function checkLock(b, p, i, a) {
    //world.sendMessage("Getting dynamicProperty: "+"containerName_"+b.dimension.id.slice(10)+"_"+b.x+"_"+b.y+"_"+b.z);
    const nameTag = world.getDynamicProperty("containerName_"+b.dimension.id.slice(10)+"_"+b.x+"_"+b.y+"_"+b.z);
    if(b.matches("barrel") || b.typeId.includes("shulker_box")){
        //world.sendMessage("barrel or chest");
        //world.sendMessage("nameTage of container: "+n);
        if(typeof nameTag !== "undefined" && nameTag.startsWith("Lock:")){
            //world.sendMessage("container locked");
            if(p === undefined){
                return true
            }else if(!nameTag.toLowerCase().includes(p.name.toLowerCase())){
                //world.sendMessage("container locked to not current player");
                if(p.isOp()){
                    if(typeof i !== "undefined" && i.matches("dirt")){
                        world.sendMessage("§eAdmin §c"+p.name+"§e "+a+"ed locked "+b.typeId.slice(10)+" at "+b.location.x+" "+b.location.y+" "+b.location.z+" in the "+b.dimension.id.slice(10)+", with lock tag ‘"+nameTag.slice(5).trim()+"’");
                        return false;
                    }else{
                        p.sendMessage("§6A player has locked this container with lock tag ‘"+nameTag.slice(5).trim()+"’. As admin, you can can override the lock by "+a+"ing the container while holding a dirt block.");
                        return true;
                    }
                }else{
                    return true;
                }
            }
        }
    }
    return false;
}

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const nameTag = event.itemStack.nameTag;
    const s = event.itemStack;
    var container = false;
    if(s.matches("barrel") || s.typeId.includes("shulker_box")){
        container = true;
    }

    const { block, blockFace } = event;

    let b2;
    switch (blockFace) {
        case "Up":
            b2 = block.above();
            break;
        case "Down":
            b2 = block.below();
            break;
        case "North":
            b2 = block.north();
            break;
        case "South":
            b2 = block.south();
            break;
        case "East":
            b2 = block.east();
            break;
        case "West":
            b2 = block.west();
            break;
        default:
            throw new Error("Invalid blockFace value");
    }

    const dev = false;
    if(container === true && typeof nameTag !== "undefined"){
        if(nameTag.toLowerCase().includes(event.player.name.toLowerCase()) || dev){
            world.setDynamicProperty("containerName_"+b2.dimension.id.slice(10)+"_"+b2.x+"_"+b2.y+"_"+b2.z, nameTag); 
            //world.sendMessage("DynamicWorldProperty set: "+"containerName_"+b2.dimension.id.slice(10)+"_"+b2.x+"_"+b2.y+"_"+b2.z);
        }else{
            event.player.sendMessage("§cYou cannot lock a container without your username on it!!!");
            event.cancel = true;
        }
    }    
})

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const nameTag = world.getDynamicProperty("containerName_"+event.block.dimension.id.slice(10)+"_"+event.block.x+"_"+event.block.y+"_"+event.block.z);
    // world.sendMessage("Block Nametag: "+nameTag);
    if(checkLock(event.block, event.player, event.itemStack, "open")){
        event.cancel = true;
        event.player.sendMessage("§cThis container is locked, only users ‘"+nameTag.slice(5).trim()+"’ may open it.");        
    }
})

world.beforeEvents.playerBreakBlock.subscribe(event => {
    const nameTag = world.getDynamicProperty("containerName_"+event.block.dimension.id.slice(10)+"_"+event.block.x+"_"+event.block.y+"_"+event.block.z);
    // world.sendMessage("Block Nametag: "+nameTag);
    if(checkLock(event.block, event.player, event.itemStack, "destroy")){
        event.cancel = true;
        event.player.sendMessage("§cThis container is locked, only users ‘"+nameTag.slice(5).trim()+"’ may break it.");
    }else{
        world.setDynamicProperty("containerName_"+event.block.dimension.id.slice(10)+"_"+event.block.x+"_"+event.block.y+"_"+event.block.z, undefined);
    }
})

world.beforeEvents.explosion.subscribe(event => {
    const b = event.getImpactedBlocks();

    for(let i=0; i<b.length; i++){
        if(checkLock(b[i])){
            event.cancel=true;
            break;
        }
    }

})