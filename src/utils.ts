const isObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null;

export const createId = (): string =>
  `MP/${Math.ceil(Math.random() * 10000)}/${Date.now()}`;

/**
 * If toJSON method is implemented on the object, it will be called instead of converting to a
 * JSON string. This utilises the structured cloning algorithm for raw objects.
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 * In this case the developer is responsible for converting nested objects.
 */
export const toRawData = (object: unknown): unknown => {
  if (typeof (object as { toJSON?: unknown }).toJSON === 'function') {
    return (object as { toJSON: () => unknown }).toJSON();
  }
  return JSON.stringify(object);
};

export const parseRawData = (data: unknown): unknown => {
  if (isObject(data)) {
    return data;
  }
  try {
    return JSON.parse(data as string);
  } catch {
    // not a valid JSON event
  }
  return undefined;
};
