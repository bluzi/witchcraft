"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("./../enums");
const log_1 = require("./../log");
function createRoom(socket) {
    const currentUser = this.users.find(user => user.clientId === socket.client.id);
    const room = {
        leaderId: currentUser.accessToken,
        roomId: this.generateId(),
        members: [currentUser.accessToken],
    };
    socket.join(room.roomId);
    this.rooms.push(room);
    socket.emit('create-room-response', room);
    log_1.log(`Room created ${room.roomId}`);
}
exports.createRoom = createRoom;
function joinRoom(socket, roomId) {
    const currentUser = this.users.find(user => user.clientId === socket.client.id);
    const room = this.rooms.find(r => r.roomId === roomId);
    if (room) {
        room.members.push(currentUser.accessToken);
        socket.join(room.roomId);
        const state = {
            user: currentUser.accessToken,
            state: enums_1.UserState.Connected,
            room,
        };
        socket.in(room.roomId).emit('member-state-changed', state);
        socket.emit('join-room-response', room);
        log_1.log(`User joined room ${room.roomId}`);
    }
    else {
        socket.emit('join-room-response', undefined);
        log_1.log(`Joining room failed ${roomId}`);
    }
}
exports.joinRoom = joinRoom;
function getCurrentRoom(socket) {
    const currentUser = this.users.find(user => user.clientId === socket.client.id);
    const room = this.rooms.find(r => r.members.indexOf(currentUser.accessToken) > -1);
    if (room) {
        log_1.log(`Current room request ${room.roomId}`);
        socket.emit('get-current-room-response', room);
    }
    else {
        log_1.log(`Current room request (Not in a room)`);
        socket.emit('get-current-room-response', undefined);
    }
}
exports.getCurrentRoom = getCurrentRoom;
function leaveRoom(socket) {
    const currentUser = this.users.find(user => user.clientId === socket.client.id);
    this.rooms
        .filter(room => room.members.some(member => member === currentUser.accessToken))
        .forEach(room => {
        room.members.splice(room.members.indexOf(currentUser.accessToken), 1);
        if (room.members.length === 0) {
            this.rooms.splice(this.rooms.indexOf(room), 1);
        }
        else if (room.leaderId === currentUser.accessToken) {
            room.leaderId = room.members[0];
        }
        if (this.rooms.includes(room)) {
            const state = {
                user: currentUser.accessToken,
                state: enums_1.UserState.Disconnected,
                room,
            };
            socket.in(room.roomId).emit('member-state-changed', state);
        }
    });
    socket.emit('leave-room-response');
}
exports.leaveRoom = leaveRoom;
