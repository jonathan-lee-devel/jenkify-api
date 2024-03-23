import { LoggingInterceptor } from './logging.interceptor';
import { Logger } from '@nestjs/common';

describe('LoggingInterceptor', () => {
  it('should be defined', () => {
    expect(
      new LoggingInterceptor(new Logger(LoggingInterceptor.name)),
    ).toBeDefined();
  });
});
