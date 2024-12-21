// testing code, allows you to simulate a connect four game using the quadlinkmove command

import { Board } from "./board";
import { bestMove, isTerminated, getTranspositionTable, terminate } from "./solver";

var test_board = undefined;
var processing_move = false;

function doMove(move) {
    if (isNaN(move))
        return ChatLib.chat("&cError: Invalid Move, NaN");
    if (!test_board.canPlay(move))
        return ChatLib.chat("&cError: Invalid Move, Column full");

    let winner = test_board.isWinningMove(move);
    if (winner) {
        ChatLib.chat(`&aPlayer ${winner} Wins!`);
        overlay_trigger.unregister();
        test_board = undefined;
        return;
    }

    test_board.playCol(move);
    ChatLib.chat(`&aMove ${move}`);
    if (test_board.isTie()) {
        ChatLib.chat("&eTie Game!");
        overlay_trigger.unregister();
        test_board = undefined;
    }
}

register("command", (arg, arg2) => {
    if (test_board == undefined || arg == "reset") {
        test_board = new Board();
        overlay_trigger.register();
        return ChatLib.chat("&aStarting QuadLink Practice Game");
    }

    if (arg === "auto") {
        if (processing_move) {
            return ChatLib.chat("&aAlready processing");
        }
        new Thread(() => {
            const start_time = Date.now();
            processing_move = true;
            terminate(false);
            let move = bestMove(test_board, 7);

            processing_move = false;
            if (isTerminated())
                return;

            ChatLib.chat(`Took ${(Date.now() - start_time)}ms`);
            if (move !== undefined)
                ChatLib.chat(`&aFound move &e${move}`);
            else
                ChatLib.chat(`&cNo move found`);

            doMove(move);
        }).start();
        return;
    }

    terminate();
    if (arg === "stop") {
        overlay_trigger.unregister();
        test_board = undefined;
        return;
    }
    if (arg === "sequence") {
        test_board.playSequence(arg2);
        return;
    }

    doMove(parseInt(arg));
}).setName("quadlinkmove");

const overlay_trigger = register("renderOverlay", () => {
    if (processing_move) {
        Renderer.drawString(`&eprocessing...`, 100, 90);
    }
    Renderer.drawString(test_board.toString() + `\n${getTranspositionTable().entries.size}`, 100, 100);
});
overlay_trigger.unregister();