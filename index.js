import { getSkyblockItemID, highlightSlot } from "./util";

import "./alternative_algorithm";

const CONTAINER_TITLE = "Quad Link Legacy - Wizardman";

import {
    PLAYER_PIECE,
    WIZARD_PIECE,
    EMPTY,
    emptyBoard,
    getNextOpenRow,
    copyBoard,
    minimax
} from "./algorithm";

register("guiOpened", (event) => {
    if (!event.gui || !(event.gui.field_147002_h instanceof Java.type("net.minecraft.inventory.ContainerChest"))) 
        return;

    const container_lower_chest_inventory = event.gui.field_147002_h.func_85151_d();
    const container = container_lower_chest_inventory.func_145748_c_().func_150260_c();

    Client.scheduleTask(1, () => {
        if (container !== Player.getContainer()?.getName() || container !== CONTAINER_TITLE)
            return;

        // start logic
        tick_trigger.register();
        render_slot_trigger.register();
        gui_render_trigger.register();
        gui_close_trigger.register();
    });
});

const gui_close_trigger = register("guiClosed", (gui) => {
    if (!gui || !(gui.field_147002_h instanceof Java.type("net.minecraft.inventory.ContainerChest")))
        return;

    const container_lower_chest_inventory = gui.field_147002_h.func_85151_d();
    const container = container_lower_chest_inventory.func_145748_c_().func_150260_c();
    
    Client.scheduleTask(1, () => {
        if (container === Player.getContainer()?.getName() && container === CONTAINER_TITLE)
            return;

        // shutdown logic
        current_board_string = "";
        current_board = undefined;
        current_player_count = 0;
        current_opponent_count = 0;
        tick_trigger.unregister();
        render_slot_trigger.unregister();
        gui_render_trigger.unregister();
        gui_close_trigger.unregister();
    });
});
gui_close_trigger.unregister();

const render_slot_trigger = register("renderSlot", (slot) => {
    const idx = slot.getIndex();
    if (idx >= 54) return;

    const [x, y] = [slot.getDisplayX() - 1, slot.getDisplayY() - 1];
    if (idx == best_move_slot) { // highlight best move
        highlightSlot(x, y, Renderer.color(85, 255, 85, 127), Renderer.color(85, 255, 85));
    }
    else if (idx < best_move_slot && idx % 9 == best_move + 1) { // highlight column above best move
        highlightSlot(x, y, Renderer.color(85, 255, 85, 85));
    }
});
render_slot_trigger.unregister();

var current_board = undefined;
var current_player_count = 0;
var current_opponent_count = 0;

var calculating_best_move = false;
var best_move = undefined;
var best_move_slot = undefined;
var depth = 5;

register("command", (arg) => {
    if (!arg || arg.toLowerCase() == "help") {
        return ChatLib.chat("&eThe depth is how many moves ahead the algorithm will search.\n"+
                            "&eLarger depth with take longer to process, but result in a more accurate solution.\n"+
                            `&aCurrent depth is set to &e${depth}`);
    }
    arg = parseInt(arg);
    if (isNaN(arg)) {
        return ChatLib.chat("&cError: invalid input");
    }
    if (arg < 0) {
        return ChatLib.chat("&cError: Depth must be positive");
    }
    if (arg > 8) {
        return ChatLib.chat("&cError: Depth must be below 8");
    }
    depth = arg;
    ChatLib.chat(`&aDepth set to &e${depth}`);
}).setCommandName("quadlinkdepth");

const tick_trigger = register("tick", () => {
    const items = Player.getContainer().getItems();

    const opponent_item_id = getSkyblockItemID(items[18]);
    const player_item_id = getSkyblockItemID(items[26]);
    if (!opponent_item_id || !player_item_id) 
        return;
    
    let board = emptyBoard();
    let player_count = 0;
    let opponent_count = 0;
    
    // read the board 
    items.forEach((item, idx) => {
        if (idx >= 54)
            return;
        const container_column = idx % 9;
        if (container_column === 0 || container_column === 8)
            return;

        const col = container_column - 1;
        const row = Math.floor(idx / 9);
        
        const peice_id = getSkyblockItemID(item);
        switch (peice_id) {
            case player_item_id:
                board[row][col] = PLAYER_PIECE;
                player_count++;
                break;
            case opponent_item_id:
                board[row][col] = WIZARD_PIECE;
                opponent_count++;
                break;
            default:
                board[row][col] = EMPTY;
        }
    });

    if (current_board && current_opponent_count >= opponent_count && current_player_count >= player_count )
        return;

    // board changed
    current_board = board;
    current_opponent_count = opponent_count;
    current_player_count = player_count;

    // reset solution
    best_move = undefined;
    best_move_slot = undefined;

    if (current_opponent_count > current_player_count) { 
        // player's move, calculate solution
        calculating_best_move = true;
        // use a thread so the game doesn't have to wait for the solution
        new Thread(() => {
            const board = copyBoard(current_board);
            const player_count = current_player_count;
            const [this_best_move, _] = minimax(board, depth, -Infinity, Infinity, true);
            
            // verify that the game state has not changed
            if (player_count !== current_player_count)
                return

            best_move = this_best_move;
            
            calculating_best_move = false;
            if (best_move != undefined) {
                best_move_slot = best_move + 1 + (getNextOpenRow(board, best_move) * 9);
            }
        }).start();
    }
});
tick_trigger.unregister();

const gui_render_trigger = register("guiRender", () => {
    const [center_x, center_y] = [(Renderer.screen.getWidth() / 2), (Renderer.screen.getHeight() / 2)];

    if (best_move) {
        Renderer.drawString(`Solver: &aColumn ${best_move + 1}`, center_x - 84, center_y - 121);
    }
    else if (calculating_best_move) {
        Renderer.drawString("Solver: &eCalculating...", center_x - 84, center_y - 121);
    }
    else {
        Renderer.drawString(`Solver: &c${current_opponent_count > current_player_count ? "No move found :c" : "Waiting for opponent!"}`, center_x - 84, center_y - 121);
    }
});
gui_render_trigger.unregister();