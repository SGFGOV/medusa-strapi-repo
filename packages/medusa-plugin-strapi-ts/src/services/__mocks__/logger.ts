import { jest } from "@jest/globals";

const Logger = {
    info: jest.fn((message: any, optionalParams?: any[]) => {
        console.info(message);
    }),
    debug: jest.fn((message: any, optionalParams?: any[]) => {
        console.debug(message);
    }),
    error: jest.fn((message: any, optionalParams?: any[]) => {
        console.error(message);
    }),
    warn: jest.fn((message: any, optionalParams?: any[]) => {
        console.warn(message);
    }),

    progress: jest.fn((message: any, optionalParams?: any[]) => {
        console.log(message);
    })
};

export default Logger;
