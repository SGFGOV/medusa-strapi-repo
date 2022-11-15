"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldIgnore_ = exports.addIgnore_ = void 0;
const IGNORE_THRESHOLD = 3; // seconds
async function addIgnore_(id, side, client, ignore_threshold) {
    const key = `${id}_ignore_${side}`;
    return await client.set(key, 1, "EX", ignore_threshold || IGNORE_THRESHOLD);
}
exports.addIgnore_ = addIgnore_;
async function shouldIgnore_(id, side, client) {
    const key = `${id}_ignore_${side}`;
    return await client.get(key);
}
exports.shouldIgnore_ = shouldIgnore_;
