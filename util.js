export const clamp = (value, min, max) => value > max ? max : (value < min ? min : value);
export const max = (a, b) => a > b ? a : b;
export const min = (a, b) => a < b ? a : b;

export function getSkyblockItemID(item) {
    const item_data = item?.getNBT()?.toObject();
    const item_id = item_data?.tag?.ExtraAttributes?.id;
    return item_id;
}

export function highlightSlot(x, y, color = Renderer.WHITE, frame = undefined) {
    Renderer.drawRect(color, x, y, 18, 18);
    if (frame) {
        GlStateManager.func_179123_a(); // pushAttrib
        GL11.glLineWidth(Renderer.screen.getScale() + 0.5);
        Renderer.drawShape(frame, [
            [x, y],
            [x, y + 18],
            [x + 18, y + 18],
            [x + 18, y],
        ], 2);
        GlStateManager.func_179099_b(); // popAttrib
    }
}
