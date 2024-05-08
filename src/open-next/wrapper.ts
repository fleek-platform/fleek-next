import { FleekRequest, FleekResponse } from '../types';
import { Converter, InternalEvent, InternalResult } from './types';

const wrapperHandler = async (
  handler: (event: InternalEvent) => Promise<InternalResult>,
  converter: Converter<InternalEvent, InternalResult>,
) => {
  return async (event: FleekRequest): Promise<FleekResponse> => {
    const internalEvent = await converter.convertFrom(event);
    const response = await handler(internalEvent);
    return converter.convertTo(response);
  };
};

export const wrapper = {
  wrapper: wrapperHandler,
  supportStreaming: false,
  name: 'fleek',
};
