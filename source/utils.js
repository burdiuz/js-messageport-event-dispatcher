/**
 * Created by Oleg Galaburda on 09.02.16.
 */
import { isObject } from '@actualwave/event-dispatcher';

export const createId = () => `MP/${Math.ceil(Math.random() * 10000)}/${Date.now()}`;

/**
 * If toJSON method implemented on object, it will be called instead of converting to JSON string.
 * This was made to utilize structured cloning algorithm for raw objects.
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 * In this case developer is responsible for converting linked objects.
 * @param object
 * @returns {Object}
 */
export const toRawData = (object) => {
  if (typeof object.toJSON === 'function') {
    return object.toJSON();
  }

  return JSON.stringify(object);
};

/**
 *
 * @param data {Object|String}
 * @returns {Object}
 */
export const parseRawData = (data) => {
  let object; // keep it undefined in case of error

  if (isObject(data)) {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch (error) {
    // this isn't an event we are waiting for.
  }

  return object;
};
