//this is an internel eventEmtter that is in nodejs to handle or perform some action on the event liek rabbitmq or bullmq
import EventEmitter from "events";

export const eventBus = new EventEmitter();