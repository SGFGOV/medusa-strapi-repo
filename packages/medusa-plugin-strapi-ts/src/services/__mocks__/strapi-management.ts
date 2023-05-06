import { jest } from '@jest/globals';

export const createClient = jest.fn();

const mock = jest.fn().mockImplementation(() => {
	return { createClient };
});

export default mock;
